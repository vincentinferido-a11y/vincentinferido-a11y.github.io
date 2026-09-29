---
title: "Case Study: Building Overland Ready, a Review Site Editors Can Run Without a Developer"
description: How I designed and built an evidence-based gear review site with Next.js and Sanity CMS, including the problems I solved, the decisions behind them, and the lessons you can apply to your own content site.
date: 2026-09-29
tags: Case study, Content sites, Tech choices
coverIcon: landscape
coverLabel: Case study
coverAccent: "#ffb86b"
---

**Overland Ready** is a gear review site for car campers and overlanders, focused on honest, evidence-based buying guides for first-time and budget-conscious buyers. I designed and built it end to end.

- **Live site:** [overland-ready-eta.vercel.app](https://overland-ready-eta.vercel.app)
- **Source code:** [github.com/vincentinferido-a11y/overland-ready](https://github.com/vincentinferido-a11y/overland-ready)

This case study walks through the problems, the decisions, and the lessons, most of which apply to **any** business that publishes content: blogs, product catalogs, menus, listings or guides.

## The challenge

A review and affiliate site has three jobs that pull in different directions:

1. **Publishing must be easy.** Reviews and product links change all the time. If every update needs a developer, the content goes stale and the site dies.
2. **Trust must be built in.** Readers (and affiliate programs) expect clear disclosures, an editorial policy and an explanation of how products are evaluated. A review site without these looks like an ad farm.
3. **It has to be fast and look credible**, on phones first, because that's where most readers arrive from search.

## The solution at a glance

| Need | What I built |
| --- | --- |
| Easy publishing | A **Sanity CMS** editor embedded in the site at `/studio`, where editors add reviews and products without touching code |
| Consistent review pages | **Dynamic review pages**: each review is written once in the CMS and automatically gets its own page and a place in the review index |
| Trust and compliance | A site-wide **affiliate disclosure banner**, plus **Disclosure**, **Editorial Policy**, **Testing Methodology**, **Privacy** and **Terms** pages |
| Affiliate links that don't break | All product links built from **one configurable affiliate ID**, so changing it updates every link at once |
| Speed and credibility | **Next.js** with a custom design system, deployed on **Vercel** |

## Key decisions (and why)

### 1. A headless CMS instead of a traditional website builder
The content (reviews, products, ratings) lives in **Sanity**, a headless CMS, while the site itself is built with **Next.js**. This separation means:

- Editors get a clean, purpose-built editing screen with the exact fields a review needs.
- The public site stays fast, and its design isn't limited by a theme.
- Content could later feed other channels (newsletters, apps) without rebuilding it.

**Lesson for your business:** if your team updates content often, invest in an editor designed around *your* content, not a generic page builder.

### 2. The editor lives inside the site, but stays separate from it
Sanity Studio runs at `/studio` on the same project, which is convenient. Early on, though, the public site's header, footer and disclosure banner were also appearing inside the editor. I fixed this by giving the **public site and the editor separate layouts** (Next.js route groups), so each has exactly the chrome it needs.

**Lesson:** small structural decisions like this keep a product clean as it grows. It's much cheaper to separate things early than to untangle them later.

### 3. Trust pages are features, not afterthoughts
Disclosure, editorial policy and testing methodology pages were built as first-class parts of the site, with a disclosure banner visible across the site. For a review business, **credibility is the product**.

**Lesson:** whatever your industry, identify what makes customers trust you (guarantees, policies, credentials, reviews) and design it into the site from day one.

### 4. One setting for every affiliate link
Instead of pasting tracking codes into every product link, links are generated from a **single configuration value**. When the affiliate account ID is set or changes, every link updates at once, with no hunting through pages.

**Lesson:** anything you'd otherwise copy-paste in many places (prices, contact details, tracking codes) should live in one place.

### 5. A design system, not just a design
The visual style, a bright "Frutiger Aero" look, was turned into **design tokens** (colors, spacing, typography) in Tailwind CSS. Every page draws from the same system, so new pages look consistent automatically.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Sanity CMS (Studio, GROQ queries, image pipeline) · Vercel

## What I'd do next

If Overland Ready were to grow, the next steps I'd prioritise are:

- **Search and filters** across reviews (by budget, vehicle type, use case)
- **Comparison tables** between products in the same category
- **Structured data for reviews** so search engines can show richer results
- **An email newsletter** fed directly from the CMS

## Takeaways you can use

1. **Make publishing easy**, or your content will stop.
2. **Build trust into the product**, not the footer.
3. **Keep one source of truth** for anything repeated across the site.
4. **Separate what editors see from what customers see.**
5. **Design a system, not just pages**, so the site stays consistent as it grows.

**Running a content-heavy business** (listings, catalogs, menus, guides or reviews) and tired of waiting on a developer for every update? [Book a free 30-minute call](/#contact) and let's talk about an editor built around your content, or [estimate your project](/#estimate).
