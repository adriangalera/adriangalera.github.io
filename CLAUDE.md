# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

Adrian Galera's personal blog, built with Astro (content collections) +
Tailwind, deployed to GitHub Pages / Netlify. Content is edited either
directly as Markdown or via TinaCMS (`npx tinacms dev -c "astro dev"`, see
`package.json` scripts).

## Blog post conventions

- Posts live in `src/content/blog/*.md`.
- Frontmatter schema is defined in `src/content/config.ts` (zod). Required
  fields: `title` (max 80 chars), `description`, `pubDate` (string or Date),
  `heroImage` (resolved via Astro's `image()` helper — must point to a real
  file), `category` (must be one of `CATEGORIES` in `src/data/categories.ts`:
  maker, aws, github, golang, java, js, machine learning, python, raspberrypi,
  testing, docker, development), `tags` (array of strings), `draft` (defaults
  to `false`).
- Hero/inline images live under `src/assets/img/posts/<slug>/`. Reusing an
  existing image (e.g. `cracking-code/featured.jpg` for coding-interview
  posts) across posts is acceptable and already done in this repo — you don't
  have to generate a new image per post.
- Older posts set an explicit `slug:` frontmatter field with a date-prefixed
  filename (`YYYY-MM-DD-title.md`); newer posts drop the date prefix and the
  `slug:` field, relying on the Title-Case filename for routing (e.g.
  `Code-Interview-Cheatsheet.md`, `Contains-Duplicate.md`). Follow the newer
  convention for new posts unless matching an existing series.
- Tone: first person, casual-but-technical, code fences with language tags,
  short sections with `##` headers. See `Code-Interview-Cheatsheet.md` for a
  representative example of the interview/algorithms series.
- Validate new posts with `npx astro sync` (checks frontmatter against the
  zod schema, fast) and `npx astro build` (full build, catches broken image
  paths/markdown) before considering a post done. `npx astro check` will
  prompt to install `@astrojs/check`/`typescript` interactively — avoid it
  unless that's already installed, since it hangs waiting for a y/n prompt.
- Also run `npm test` (vitest) before considering a post done, and definitely
  before `npm run deploy` — the `deploy` script runs `npm run build`, which
  is `vitest --no-watch && astro build`, so a vitest failure blocks deploy
  even when `npx astro build` alone was clean. In particular
  `test/assetlocation.test.ts` walks every file under `src/content/blog`
  (including subfolders like `coding-interview-prep/`) checking for stray
  `/src/assets` references and unescaped spaces in image links — it will
  surface issues `astro build` doesn't catch, so don't skip it just because
  the Astro build passed.

## Related

Blog posts about coding-interview problems (LeetCode/Neetcode) are sourced
from the sibling `leet` repo's `PROBLEMS.md`, which documents each problem's
approach and complexity analysis in prose (there usually isn't a matching
`.java` file — see that repo's own `CLAUDE.md`).
