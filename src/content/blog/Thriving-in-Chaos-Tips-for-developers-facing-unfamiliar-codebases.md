---
heroImage: ../../assets/img/posts/thriving-chaos/uncertainty-featured-image.webp
category: development
description: >-
  Tips and mindset shifts for developers facing messy, unfamiliar code and not
  knowing where to start in real-world projects.
pubDate: 2025-03-26T22:00:00.000Z
draft: false
tags:
  - testing
  - migration
  - development
  - tips
title: Tips for developers facing unfamiliar codebases
---

**Feeling lost in a sea of unfamiliar code?** This guide is for developers who’ve ever stared at a confusing repo wondering where to even start. Learn practical tips, mindset shifts, and strategies to not just survive (but thrive) in the messy, uncertain world of real-world software development.

A recent organizational shift required all teams to migrate their observability tooling to a new platform. While some teams were prioritized over others, one high-priority group didn’t have the capacity to manage the transition themselves, so I stepped in to lead the effort. I wasn’t familiar with the codebase initially, but thanks to regular consultations and code reviews with the original authors, I was able to get up to speed and move the migration forward.

In this article, I’d like to share some tips and tricks I used during this assignment that really helped me navigate the migration successfully.

You can think of these tips and tricks as an iterative cycle:

![Iteration cycle](../../assets/img/posts/thriving-chaos/cycle.png 'iteration cycle')

## Create a proof of concept

The service I had to migrate only required integration with a specific part of the observability stack: the synhetic monitoring component. I had never worked with that product suite before, so my first step was to get familiar with it.

To do that, I created a separate project where I could experiment freely with it, exploring the available APIs and the Terraform modules. This helped me gather the knowledge I would later need to integrate it into the actual project.

It's advisable to do this kind of experimentation in an isolated environment to minimize potential issues.

## Create a document to centralize your thoughts

While building the proof-of-concept project, I uncovered many synthetic monitoring specific details that I knew I would eventually need to apply to the real service. I was taking so many notes that I decided to create a single document to centralize everything I was learning.

This document also became a place to write down questions I had for the teams involved in the migration. The goal was to have a single source of truth for all related knowledge.

Eventually, the document evolved to include the following sections:

```
- Useful links
- Findings
- Questions
  - Pending
  - Future
  - Solved
```

In the **Useful Links** section, I saved references to documents, API definitions, internal repositories; basically any link I used throughout the migration.

**Findings** contained notes about workflows, processes, and everything I discovered about both the application I had to migrate and the synthetic monitoring module.

As for **Questions**, I initially had quite a few; after all, the codebase was completely unfamiliar. I didn’t want to overwhelm the team with too many questions at once, so I wrote them down and continued digging through the code on my own. This helped reduce the number of questions I eventually needed to ask.

I also found it helpful to have a Future section for questions that didn’t need immediate answers. For example, one of them was how to allocate costs related to the application; something that could clearly wait until later.

Finally, I kept track of Solved questions. I'm not entirely sure how valuable this section will be long-term, but it's easy to maintain, and if I ever need to revisit a past discussion or decision, the information is there.

## Short iteration cycle

Once you gain access to the project, your first task should be to set up the shortest possible iteration cycle. You’ll need to make changes, and the faster you can verify whether those changes work, the better.

A short iteration cycle can take many forms: fast-running unit tests, frontend end-to-end tests using [Cypress](https://www.cypress.io/), local scripts that call the API—you name it.

Another important factor in keeping the iteration cycle short is being able to run the application on your own development machine. Otherwise, deploying temporary changes to a remote development environment can be time-consuming and make development seriously inefficient.

A key enabler for running the application locally is using an in-memory database like [H2](https://h2database.com/html/main.html). For more complex setups, consider using Docker or Docker Compose.

## Search the entry points in the code

At this point, you're somewhat familiar with the codebase, you’ve got a decent (and fast) testing setup, and you're ready to start making changes. But you might not know exactly where to begin. This section outlines some patterns I used to uncover the workflow that needed modification. Let’s head down the rabbit hole.

If the application has a web interface, the **Network** tab in Chrome Developer Tools can be incredibly useful. It helps you observe the API calls the frontend makes, revealing endpoint URLs and potential entry points into the workflow.

Once you’ve identified an API endpoint, the next step is to locate the backend component that implements it. You can often do this with a simple text search using the endpoint's URL. This gives you the outer layer of the onion; you can then dig deeper into the application’s layers until you find the logic you need to modify. In Spring applications, these entry points are typically defined using **@Controller** or **@RestController** annotations. If the codebase is well-structured, these components should be easy to find. If not, just search for the annotation across the codebase.

In some cases, backend applications process messages from queues, such as AWS SQS. In Spring, this is usually implemented with the **@SqsListener** annotation. You can think of these components as the "controllers" for queue-based workflows.

For frontend changes, Chrome Developer Tools comes in handy again. Inspect the HTML to find a visual element close to the part you need to update. Look for unique identifiers such as element IDs or class names that you can search for in your IDE to trace back to the relevant code.

This is the most "fun" part of the migration; finding the exact places to make changes can feel more like an art than a science. So be patient, and don’t panic. You’ll find your way eventually.

## TODO and failing tests

This part is essential if you don’t want to miss things. When you're navigating unfamiliar code, you'll explore many classes and components. As you go, you might spot areas that need attention but aren't urgent. In those cases, it's useful to leave a TODO comment with a reference to the relevant JIRA ticket. Later, you can search your codebase to find and address any pending work.

I typically use the following format:

```java
// TODO TASK-1234: Refactor this algorithm
```

This makes it easy to search for `// TODO TASK-1234` across your code. It also serves as a visual reminder—during code reviews, an unaddressed TODO will stand out clearly. If you want to add another layer of safety, you can include a comment in your Pull Request indicating that the task must be completed before the PR is merged.

Another effective technique is to create failing tests. This is especially helpful when you're making changes in unfamiliar code. As soon as you create a new class or method, jump straight into writing its test. At this point, you probably have a good idea of what you want to implement, so it’s a great time to try TDD. Even if you don’t follow it strictly, a failing test acts as a reminder. For example:

```java
void shouldImplementAlgorithmX() {
  Assertions.fail("I need to implement algorithm X");
}
```

This will cause the test suite to fail. If you're using a CI/CD pipeline (and you should be), the failing test will prevent the PR from being merged until you implement the feature and all tests pass.

## Refactor versus changes

Since you’re not working in your usual codebase, it can be tempting to avoid overthinking and go for the simplest possible implementation of the new feature. Sometimes, that means copying and pasting existing code and duplicate logic to accomodate your need. However, be cautious with this approach: there are situations where a small refactor before making your changes can significantly reduce the amount of code you need to touch.

For example, in my case, the frontend codebase of the application I had to migrate was full of references to New Relic. After taking a step back and thinking it through, I realized that “New Relic” was essentially being used as a synonym for “Monitor.” With a bit of renaming and refactoring, I was able to integrate the new synthetic monitoring checks into the UI with changes in just two small places.

Had I gone straight into full copy-paste mode, I would have ended up introducing a lot of unnecessary duplication.

## Frontend changes

When it’s time to make frontend changes, you might run into trouble if the tooling isn’t up to par. Fortunately, the frontend project I had to modify was written in TypeScript and had solid linting and testing in place.

If you're not that lucky and end up working on a project that uses plain JavaScript, be especially cautious when modifying objects. It’s easy to miss an update somewhere, which can cause subtle bugs or break small parts of the application. Hopefully, if there are good tests in place, they’ll catch these errors early.

Speaking of testing, I found **snapshot testing** particularly useful in my case. These tests helped ensure I didn’t introduce regressions in existing components. Snapshot testing works by comparing the rendered output of a component in the current codebase with a previously saved version. If there are differences, the test will fail. Sometimes the change is intentional—in that case, you simply update the snapshot. If not, you've just caught a regression.

## Scripting

This might be a little controversial, but I believe that sometimes it’s easier to write scripts to iterate quickly and test your changes, rather than relying on more elaborate approaches like TDD or BDD.

Don’t get me wrong, I’m not suggesting replacing tests with scripts or relying solely on manual testing. But for the sake of practicality, it's often much simpler to trigger specific application workflows using scripts than it is with full integration tests or similar setups.

Of course, once you're confident your changes work, you should write a proper suite of tests to ensure the logic continues to function even when you're no longer the one maintaining it.

In my case, I wrote scripts to simulate API calls from other services, mimic frontend requests, and send messages to the SQS queues of the application.

Even if you’re the only one using the scripts, it’s a good idea to include execution instructions explaining what the script does. Also, avoid hardcoding any authentication tokens or secrets, use environment variables or another secure method to pass them in.

## JIRA tickets

This might not sound like the most exciting task, but it really helped me maintain a clear overview of the tasks I needed to implement and the blockers between them. It also made it much easier to communicate a clear, understandable plan for upcoming work to stakeholders higher up.

Try to keep tickets as small as possible. This not only reduces the scope of code changes per ticket, but also makes life easier for reviewers (and testers). Of course, this is a trade-off, you might not want to create a separate task just to change a single line of code, so sometimes it's reasonable to group small, unrelated changes into a single Pull Request, or other approaches.

## Final words

If you’ve made it this far, thank you for reading! I hope these tips help you feel a bit more confident the next time you’re dropped into a codebase you don’t know, working on a feature you’ve never seen, under constraints you didn’t choose.

Real-world software development can be messy, unpredictable, and at times overwhelming but with the right mindset, some practical habits, and a little patience, you can absolutely navigate the chaos and make meaningful progress.

Good luck out there—and if any of these strategies help you, or you’ve got tips of your own, I’d love to hear about them, drop me an email at [adrian.galera.87@gmail.com](mailto:adrian.galera.87@gmail.com)
