---
title: "Case Study: BoyaxDev, a Marketplace Website Design for Buying Ready-Made Websites"
seoTitle: "Marketplace Website Design Case Study: BoyaxDev UI"
description: "A marketplace website design case study: how I designed BoyaxDev, a UI prototype for buying ready-made websites, from faceted search to a gated NDA flow."
date: 2026-10-08
tags: Case study, Planning, Business
coverIcon: storefront
coverLabel: Case study · UI prototype
coverAccent: "#4fdbc8"
imageAlt: "Marketplace website design case study cover for BoyaxDev, a UI prototype for buying ready-made websites"
---

Picture someone about to spend serious money on a website they've never touched. They can't kick the tyres. They can't see the code yet. All they have is a listing page, and that page has about thirty seconds to answer one question: *can I trust this?*

That question shaped every screen of **BoyaxDev Marketplace**, a marketplace website design for buying ready-to-launch websites and SaaS platforms. This case study walks through the problem, the screens, the decisions and trade-offs, and the lessons you can borrow for any marketplace, directory or listings site.

- **Live prototype:** [boyaxdev-marketplace-ui.vercel.app](https://boyaxdev-marketplace-ui.vercel.app/)

```callout note What stage this project is at
BoyaxDev is a **UI prototype and design exploration**: four clickable HTML screens plus a documented design system. It is not a live marketplace. The names, prices, numbers and listings in the screens are placeholders, so there are no real sales, users or results to report here, and I won't pretend otherwise.
```

## The problem: selling something people can't try first

Buying an existing website is a bit like buying a small business. The buyer is weighing up code quality, how the site makes money, how much traffic it gets, and what they will actually receive on handover day.

That creates three tensions a marketplace has to solve:

1. **Discovery vs. detail.** Buyers want to scan lots of options fast, but each option has a lot of technical detail behind it (framework, backend, database, hosting).
2. **Openness vs. confidentiality.** Sellers want to show enough to attract buyers, but not hand their traffic numbers and codebase to anyone with a browser.
3. **Speed vs. trust.** A smooth "buy now" button feels modern, but for a high-value digital asset, too little friction looks suspicious.

## Who it's for

The design targets two groups:

- **Buyers:** founders, agencies and operators who would rather buy a working platform in a niche (health, finance, SaaS, e-commerce) than build from zero.
- **The marketplace operator:** someone who lists assets, approves serious buyers and manages handovers, and needs that process to feel orderly, not like a pile of emails.

## Marketplace website design at a glance

The prototype has four screens, each with one clear job:

| Screen | Its job |
| --- | --- |
| **Home hub** | Explain what's sold, show featured inventory, niche collections, a four-step "how the handoff works" section, what every asset includes, and a buyer FAQ |
| **Asset inventory** | Let buyers narrow the list with filters: niche, tech stack, backend runtime, monetization model, traffic range, price range and status |
| **Asset detail** | One listing in depth: gallery, tabs, tech stack specs, a "what's included" checklist, documentation previews, a five-step transfer process and asset facts |
| **Request buyer access** | A four-step form (identity, interest, access and compliance, review) that ends with agreeing to an NDA before the data room opens |

Everything sits on a dark "glass" design system I documented as **Liquid Glass Aero**: colour tokens, a type scale, spacing, rounded corners and component rules, all written down in a design spec so a developer can build from it.

## Key features

### Faceted search that matches how buyers think

"Faceted search" just means filters that work together: tick *Technology & SaaS*, then *Node.js*, then *Available*, and the list narrows with each choice. The inventory screen shows the active filters as removable chips at the top, with a "Clear all" link, so buyers never lose track of why they're seeing what they're seeing.

The filter groups follow the questions a buyer actually asks, in roughly the order they ask them: *What market? What's it built with? How does it make money? How busy is it? What does it cost? Can I buy it today?*

### Listing cards that show the same facts in the same place

Every card shows status (Available, Reserved or In Progress), niche, stack tags, monetization, backend and price in an identical layout. When the facts sit in the same spot on every card, comparing six options takes seconds instead of minutes.

### A detail page built around "what do I actually get?"

The asset page leads with a **what's included** checklist: frontend codebase, backend and API, database migrations, deployment configs, architecture docs, SOP playbooks, domain transfer, and a post-sale support window. Below that sit documentation previews and a numbered transfer process, from verification and NDA through to repository transfer and escrow release.

**Escrow**, if you haven't met the term, is when a neutral third party holds the buyer's money until the seller hands over what was promised. The design references it as a trust signal on the detail page; in a real build, it would be connected to an actual escrow provider.

### Gated data, by design

On the detail page, the performance section is deliberately locked: *"Data room access required."* A **data room** is a private area holding the sensitive stuff, such as real traffic, revenue and the full codebase. Buyers see enough to get interested, then request access.

### A buyer-access flow with a progress bar

The access request is split into four short steps with a visible progress indicator: who you are, what you're looking for (niches, budget band, timeline), the NDA and due-diligence terms, then a review. There's a "Save draft" button, because people step away from long forms.

### Designed states, not just the happy path

This is the part most prototypes skip. The inventory screen includes **loading skeletons** (grey placeholder cards while results load) and an **empty state** ("No assets match these filters" with a one-click reset). The access form documents six input states: default, focused, filled, error, disabled and confirmation.

## Decisions and trade-offs, in plain English

### 1. Friction on purpose

The obvious e-commerce move is "add to cart". I went the other way: for an asset like this, a short verification step *increases* trust. It tells sellers their data is protected and tells buyers other buyers are vetted too.

**The trade-off:** every extra step loses some people. That's why the form is split into four small steps with a progress bar and a save option, rather than one long page. You keep the friction that builds trust and remove the friction that just annoys.

### 2. Show the shape of the data before showing the data

The detail page lists *which* facts exist (niche, stack, hosting, monetization, age, transfer window) even when the values are behind the data room. Buyers can judge whether a listing is worth requesting access for, and sellers don't over-share.

**Lesson for your business:** if you sell something high-value, tell people exactly what they'll see after the next step. Uncertainty kills more conversions than friction does.

### 3. Placeholder content, clearly labelled

Every screen carries a footer note that it's a design prototype with placeholder content. It would have been easy to fill the screens with made-up revenue figures and five-star reviews to make the shots look busier. On a marketplace that sells on trust, fake numbers in a demo send exactly the wrong message.

### 4. Accessibility states written into the system

The error state pairs a red outline with a written message ("Valid corporate domain required"), not colour alone. The focused state has a visible focus ring. These match long-standing rules in the W3C's accessibility guidelines ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)): errors must be identified in text (*Error Identification*), keyboard focus must be visible (*Focus Visible*), and form fields need labels (*Labels or Instructions*).

**Lesson:** accessibility is cheapest at the design stage. Deciding what an error looks like *once* in a design system is far cheaper than fixing forty forms later.

### 5. A design tool for speed, a written spec for consistency

I used **Google Stitch** (an AI-assisted UI design tool) to move fast on layouts, then wrote the rules down in the design spec: colours, type sizes, spacing and component behaviour. The tool gets you a first draft quickly. The written system is what stops screen five from drifting away from screen one.

## What was hard

- **Density without clutter.** A buyer needs a lot of technical detail per listing. Fitting stack, backend, monetization and price onto a card without it becoming a wall of text took several passes. The answer was strict, repeated placement plus small monospace labels for technical facts.
- **A dark interface that stays readable.** Glassy, dark designs look great in screenshots and can be hard to read in real life. WCAG's *Contrast (Minimum)* rule asks for a contrast ratio of at least 4.5:1 for normal body text, so text colours had to be chosen against the actual dark surfaces, not against a white artboard.
- **Making a form feel short when it isn't.** Identity, preferences and legal agreement is a lot to ask. Splitting it into steps, asking only for essentials (company is optional), and letting people save a draft does most of the work.

## Lessons you can apply to your own marketplace or listings site

Whether you run a property directory, a used-equipment site, a talent marketplace or a booking platform, these carry over:

1. **Build filters around your buyer's questions,** in the order they ask them, not around how your database is organised.
2. **Put the same facts in the same place on every listing.** Consistency is what makes comparison fast.
3. **Answer "what do I get?" above the fold** on every detail page.
4. **Use friction deliberately.** Add steps where they build trust; remove them everywhere else.
5. **Design the empty, loading and error states** before launch. Users will see them; make sure they help.
6. **Never fake proof.** Placeholder content is fine in a prototype if it's labelled. Invented reviews and numbers are not.

If you're still deciding what kind of product you need in the first place, my guide on [website vs. web app vs. mobile app](/blog/website-vs-web-app-vs-mobile-app/) is a good starting point. A marketplace like this is firmly a web app.

## What's next

To turn this prototype into a working marketplace, the next steps would be:

- **A real backend:** listings, accounts, saved searches and an admin panel to approve buyer requests.
- **E-signature for the NDA** and secure, logged access to each data room.
- **An escrow integration** with a licensed provider, rather than building money handling yourself.
- **Usability testing** of the filters and the access form with real buyers before adding more features.

If that list feels long, that's normal. My post on [what to prepare before hiring a developer](/blog/what-to-prepare-before-hiring-a-developer/) shows how to turn a prototype like this into a clear brief, and [how I plan a project](/blog/how-i-plan-a-project/) explains how the work gets broken into phases.

## FAQ

```faq
Q: What makes a good marketplace website design?
A: Fast, reliable filtering, consistent listing cards, a detail page that clearly says what the buyer gets, visible trust signals (verification, escrow, policies), and well-designed empty, loading and error states. Build it around the questions your buyers ask, in the order they ask them.
Q: What is faceted search on a marketplace?
A: Faceted search is a set of filters that work together, such as category, price range and status. Each choice narrows the results, and active filters are usually shown as removable chips so users can see and undo them easily.
Q: What is a data room when buying a website?
A: A data room is a private, access-controlled area where a seller shares sensitive information, such as real traffic, revenue reports and the codebase, with vetted buyers. Access is usually granted after the buyer signs an NDA.
Q: Should a marketplace ask buyers to verify before seeing details?
A: For high-value or confidential listings, yes. A short verification step protects sellers and signals that other buyers are vetted too. For low-value items, keep it frictionless. Split any verification into small steps with a progress bar.
Q: How long does it take to design a marketplace prototype?
A: A focused prototype with a few core screens and a documented design system typically takes a few weeks, depending on how many screens and states you need and how quickly feedback comes back. Building the working marketplace behind it takes considerably longer.
Q: Is BoyaxDev a real marketplace I can buy websites on?
A: No. BoyaxDev Marketplace is a UI prototype and design exploration with placeholder content. It shows how such a marketplace could look and work; it does not list or sell real websites.
```

**Planning a marketplace, directory or listings platform** and want the trust and the filters right from day one? [Send me a message](/#contact) with what you're selling and who's buying, or [estimate your project](/#estimate) first.

## Sources

Checked on **October 8, 2026**:

1. [BoyaxDev Marketplace live prototype](https://boyaxdev-marketplace-ui.vercel.app/) (home hub, asset inventory, asset detail and buyer-access screens)
2. BoyaxDev Marketplace project documentation: README and the Liquid Glass Aero design spec (DESIGN.md) in the project folder
3. [W3C: Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) (Error Identification, Focus Visible, Labels or Instructions, Contrast (Minimum))
