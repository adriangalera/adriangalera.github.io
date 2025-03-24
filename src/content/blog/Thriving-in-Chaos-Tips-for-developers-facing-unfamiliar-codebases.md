---
heroImage: /src/assets/img/posts/thriving-chaos/uncertainty-featured-image.webp
category: development
description: >-
  This guide is for developers who’ve ever stared at a confusing repo wondering
  where to even start. Learn practical tips and mindset shifts and strategies to
  survive in the messy, uncertain world of real-world software development
pubDate: 2025-03-31T22:00:00.000Z
draft: false
tags:
  - testing
  - migration
  - development
  - tips
title: 'Thriving in Chaos: tips for developers facing unfamiliar codebases'
---

**Feeling lost in a sea of unfamiliar code?** This guide is for developers who’ve ever stared at a confusing repo wondering where to even start. Learn practical tips, mindset shifts, and strategies to not just survive — but thrive — in the messy, uncertain world of real-world software development.

Recently, the company I work for decided to transition from the New Relic observability stack to the [LGTM](https://grafana.com/about/grafana-stack/ 'LGTM stack') stack (Loki, Grafana, Tempo and Mimir). All teams are expected to migrate their services, although some were given higher priority than others. One of the high-priority teams didn’t have the capacity to handle the migration themselves, so I was asked to take it on. Naturally, I was completely unfamiliar with the codebase I needed to work on.

In this article, I’d like to share some tips and tricks I used during this assignment that really helped me navigate the migration successfully.
