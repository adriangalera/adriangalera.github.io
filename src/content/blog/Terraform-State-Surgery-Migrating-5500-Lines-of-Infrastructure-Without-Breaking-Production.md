---
heroImage: ../../assets/img/posts/terraform-state-migration/95def0cc-f2bd-4b04-98da-4dc5d817dc13.jpeg
category: development
description: >-
  When your Terraform configuration grows to manage dozens of environments
  across multiple applications, eventually you need to split things up. You can't just delete code and walk away. Do that, and
  Terraform will destroy your production infrastructure.
pubDate: 2026-02-22T09:56:28.188Z
draft: false
tags:
  - terraform
  - infrastructure
  - migration
  - devops
  - gitlab
title: >-
  Terraform State Surgery: migrating the infrastructure
---

When your Terraform configuration grows to manage dozens of environments across multiple applications, eventually you need to split things up. But here's the catch: you can't just delete code and walk away. Do that, and Terraform will gleefully destroy your production infrastructure. This is the story of how I safely migrated an entire application's infrastructure out of a monolithic Terraform repository without a single second of downtime.

## The Monolith Problem

Our observability infrastructure was managed through a single Terraform repository that handled four different applications across 13 different environments. That's over 50 different Terraform states to manage.

The setup looked something like this:

```
tfconfig/
  env/
    prd/
      env1/
      env2/
      ...
    dev/
      env3/
    sit/
      env4/
  modules/
    applications/
      app1/
      app2/
```

Each application module contained AWS resources, Grafana dashboards, alerts, and various integrations. For example one application alone had:

- CloudWatch alarms and metrics
- Three Grafana dashboards with thousands of lines of JSON configuration
- Three different alert types with complex thresholds
- OpenSearch configurations

The monolithic approach worked initially, but as the team grew and responsibilities shifted, we needed to give each application its own infrastructure repository. The challenge? How do you extract one application's resources spread across 50+ Terraform states without accidentally destroying production infrastructure?

## The Terraform State Problem

If you've worked with Terraform, you know the golden rule: **never modify the state file directly unless you absolutely know what you're doing**. But here's the problem we faced:

1. If you just **delete the Terraform code**, the next `terraform plan` will show that Terraform wants to **destroy** all those resources in AWS and Grafana
2. If you **remove resources from state** incorrectly, you lose track of infrastructure
3. If you do things in the **wrong order** across environments, you end up with inconsistent states

The safe migration path requires four carefully ordered steps:

1. **Identify** all resources that belong to the application
2. **Move** them to the application terraform state
3. **Remove** them from Terraform state (telling Terraform to forget about them)
4. **Delete** the code (now safe because Terraform isn't tracking them anymore)

But we can't just wing it. With 50+ states to migrate, we need automation.

## Building the Migration Tooling

I approached this migration the same way I approach any unfamiliar codebase problem: by building tools that make the manual process repeatable and safe.

### Tool 1: State Retrieval

The first challenge was getting access to the Terraform state. We used GitLab-managed Terraform state, which means each environment's state is stored remotely. The `prepare-for-init.sh` script handles the initialization:

```bash
#!/bin/bash
DTAP="$1"
VPC="$2"
STATE_NAME="${VPC}_${DTAP}"

GITLAB_API_URL="<GITLAB-URL>"
GITLAB_PROJECT_ID="<PROJECT-ID>"
TF_ADDRESS="${GITLAB_API_URL}/projects/${GITLAB_PROJECT_ID}/terraform/state/${STATE_NAME}"

# Initialize and retrieve state
terraform init \
    -backend-config="address=${TF_ADDRESS}" \
    -backend-config="username=${GITLAB_USERNAME}" \
    -backend-config="password=${GITLAB_TOKEN}"
```

This script abstracts away the complexity of connecting to GitLab-managed state, handling authentication, and preparing the environment.

### Tool 2: Resource Extraction

Once we have the state, we need to identify which resources belong to our application. The `extract-application-resources.sh` script does exactly that:

```bash
#!/bin/bash
DTAP="$1"
VPC="$2"
APPLICATION_ID="$3"

# First, prepare the environment
./prepare-for-init.sh "$DTAP" "$VPC"

# Pull the state and extract application-specific resources
terraform state pull > state.json

# Use jq to filter resources by application name
jq --arg app "$APPLICATION_ID" '
  .resources[] |
  select(.module | contains($app)) |
  {
    module: .module,
    type: .type,
    name: .name,
    index_key: .index_key
  }
' state.json > "resources-to-delete_${VPC}_${DTAP}_${APPLICATION_ID}.json"
```

This script produces a JSON file listing every single resource that needs to be removed.

### Tool 3: Command Generation

Now that we know what to remove, we need to generate the actual Terraform commands. The `generate-terraform-state-rm.sh` script converts our JSON into executable shell commands:

```bash
#!/bin/bash
JSON_FILE="$1"
OUTPUT_FILE="$2"

# Generate terraform state rm commands from JSON
STATE_RM_COMMANDS=$(jq -r '
  .[] |
  if .index_key then
    "\(.module).\(.type).\(.name)[\(.index_key)]"
  else
    "\(.module).\(.type).\(.name)"
  end |
  "terraform state rm '"'"'\(.)'"'"'"
' "$JSON_FILE")

# Write to executable script
cat > "$OUTPUT_FILE" <<EOF
#!/bin/bash
set -e

$STATE_RM_COMMANDS
EOF

chmod +x "$OUTPUT_FILE"
```

This generates scripts like:

```bash
terraform state rm 'module.app1.aws_cloudwatch_metric_alarm.error_rate'
terraform state rm 'module.app1.module.throttling_dashboard.grafana_dashboard.dashboard'
# ... hundreds more lines
```

### Tool 4: Safe Removal Orchestration

The final script, `remove-app1-from-state.sh`, ties everything together with safety checks:

```bash
#!/bin/bash
TERRAFORM_DIR="$1"

cd "$TERRAFORM_DIR"

# List all resources and filter for our application
terraform state list > all_resources.txt
grep "app1" all_resources.txt > resources_to_remove.txt

# Verify we found resources
if [ ! -s resources_to_remove.txt ]; then
    echo "No app1 resources found"
    exit 0
fi

# Count and display what we're about to remove
RESOURCE_COUNT=$(wc -l < resources_to_remove.txt)
echo "Found $RESOURCE_COUNT resources to remove"

# Remove each resource from state
while IFS= read -r resource; do
    echo "Removing: $resource"
    terraform state rm "$resource" || {
        echo "Failed to remove: $resource"
        continue
    }
done < resources_to_remove.txt
```

The script includes error handling and continues even if individual removals fail, ensuring we can complete as much of the migration as possible.

## Automating Across 50+ Environments

With the tooling built, I still faced the challenge of running this migration across all environments consistently. This is where GitLab CI/CD came in. I created a dedicated migration pipeline (`ci/migration.yml`):

```yaml
.remove_app1_resources_from_base:
  stage: plan
  image: registry.gitlab.com/gitlab-org/terraform-images/stable:latest
  variables:
    TF_ROOT: ${CI_PROJECT_DIR}/tfconfig/env/${DTAP}/${VPC}
    TF_ADDRESS: ${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/${VPC}_${DTAP}
  before_script:
    - apk add --no-cache jq
    - terraform --version
  script:
    - cd ${TF_ROOT}
    - terraform init
    - terraform state list | grep -i "app1" > resources.txt
    - |
      while IFS= read -r resource; do
        echo "Removing: $resource"
        terraform state rm "$resource"
      done < resources.txt

# Generate jobs for each environment
remove_app1_resources_from_vpc1_sit:
  extends: .remove_app1_resources_from_base
  variables:
    DTAP: sit
    VPC: vpc1

remove_app1_resources_from_vpc2_prd:
  extends: .remove_app1_resources_from_base
  variables:
    DTAP: prd
    VPC: vpc2

# ... jobs for all 50+ environments
```

This approach gave us:

- **Consistency**: The same logic runs in every environment
- **Auditability**: Every removal is logged in GitLab CI
- **Safety**: We can run one environment at a time and verify
- **Rollback capability**: If something goes wrong, the state is still in GitLab history

## The Migration Execution

With all the tooling in place, the actual migration followed a careful sequence:

### Phase 1: Verification (Week 1)

First, I ran the extraction scripts locally against each environment to understand the scope:

```bash
for vpc in vpc1 vpc2 vpc3 vpc4; do
    ./extract-application-resources.sh prd $vpc app1
done
```

This generated reports showing that we'd be removing:

- 95 AWS CloudWatch resources
- 179 Grafana resources (dashboards and alerts)
- 28 OpenSearch configuration items

**Total**: Over 300 individual Terraform resources spread across all the states.

### Phase 2: Target Application Setup (Week 2)

Before removing anything from our repository, the `app1` team needed to set up their new Terraform project and import these resources. This is crucial because:

1. They need to own these resources in their new state
2. The import must happen **before** we remove from our state
3. Any drift between states could cause issues

We documented every resource that would be migrated and coordinated with their team to ensure imports completed successfully.

### Phase 3: State Removal (Week 3)

With the target team ready, I triggered the GitLab CI pipeline:

```bash
git checkout -b state-removal
git add ci/migration_app1.yml
git commit -m "state-removal: Add migration pipeline for app1"
git push origin state-removal
```

Then, in GitLab, I manually triggered each environment's migration job one at a time:

1. Start with SIT (testing environment)
2. Verify the state is clean: `terraform plan` shows no changes
3. Move to RTE environments
4. Finally, production environments

Each job took 2-5 minutes and produced logs showing every resource removal. At the end of each job, I verified:

```bash
terraform init
terraform plan
# Should show: No changes. Infrastructure is up-to-date.
```

### Phase 4: Code Removal (Week 4)

Only after all states were clean did I remove the actual code:

```bash
# Remove the module
rm -rf tfconfig/modules/applications/app1/

# Remove module references from each environment
for vpc in vpc1 vpc2 vpc3 vpc4; do
    # Edit tfconfig/env/prd/$vpc/main.tf
    # Remove the module "app1" block
done
```

This single commit removed:

- **5,533 lines deleted**
- **1,017 lines added** (documentation and tooling)
- **104 files changed**

Including:

- The entire `app1` module
- Three Grafana dashboard templates (3,312 lines of JSON)
- Three Grafana alert modules (670 lines)
- AWS resource configurations
- OpenSearch constants

## Lessons Learned

### 1. Automation is Non-Negotiable at Scale

Manually managing 50+ states would have been error-prone and time-consuming. The scripts I built turned a potentially multi-week manual process into a semi-automated workflow that completed in a few days.

### 2. State Operations Are Order-Dependent

The sequence matters:

1. Import in target (new state)
2. Remove from source (old state)
3. Delete code

Get this wrong, and you either lose infrastructure tracking or destroy production resources.

### 3. GitLab CI For Audit Trail

Running state operations through CI/CD provided:

- Logs of every change
- Timestamps for compliance
- Ability to review before execution
- Consistent execution environment

### 4. Verification at Every Step

After each environment migration, I ran `terraform plan` to verify no unexpected changes. This caught issues early before they compounded.

### 5. Documentation is Part of the Migration

The migration scripts are now documented in the repository's README, making future application splits much easier. The next team can follow the same process with minimal guidance.

## The Result

The migration completed successfully with:

- **Zero downtime**: All infrastructure remained operational
- **Zero drift**: Every resource was accounted for
- **Clean states**: All 50+ Terraform states now cleanly plan with no changes
- **Reusable tooling**: Scripts are generic and can migrate other applications
- **Improved ownership**: The `app1` team now owns their infrastructure end-to-end

The monolithic repository is now lighter, and teams have clearer ownership boundaries. More importantly, we have a proven, documented process for future splits.

## Key Takeaways

If you're facing a similar Terraform migration:

1. **Build the tools first**: Create scripts to understand scope before making changes
2. **Coordinate import timing**: Ensure the target state receives resources before you remove from source
3. **Automate the repetitive parts**: Use CI/CD to execute consistently across environments
4. **Verify constantly**: Run `terraform plan` after every phase to catch drift early
5. **Document everything**: Your future self (and teammates) will thank you

Terraform state management can be intimidating, but with the right approach and tooling, even large-scale migrations can be safe, predictable, and successful.

Have you had to migrate Terraform states or split monolithic infrastructure repositories? I'd love to hear about your approach—drop me an email at [adrian.galera.87@gmail.com](mailto:adrian.galera.87@gmail.com).
