# Vincent Inferido — Portfolio

Full-stack product builder: business systems and CRMs, web apps and Web3. Designed in Figma, built with Next.js and TypeScript, shipped end to end.

**Live site:** https://vincentinferido-a11y.github.io

![Portfolio hero](docs/projects/portfolio.jpg)

## Highlights

- **Multichain live data:** a network switcher with Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain and Solana. It shows live gas (or TPS on Solana) and block height (or slot) from public RPCs, and falls back to a backup endpoint automatically if one is slow or down.
- **Read-only wallet connection:** EVM wallets (EIP-1193, e.g. MetaMask) and Solana wallets (Phantom, Solflare). It only requests the public address, never signatures or transactions. Picking a chain asks a connected EVM wallet to switch networks.
- **Projects:** filterable by Systems / CRM, Full-Stack, UX/UI and Web3, followed by a concept showcase.
- **Accessibility and performance:** static HTML, compiled Tailwind (no CDN runtime), keyboard-navigable menus, reduced-motion support, and no tracking.

## Tech

Plain HTML · Tailwind CSS 3 (compiled) · vanilla JavaScript · Google Fonts · GitHub Pages

## Run locally

```bash
npm install
npm run dev      # rebuilds docs/styles.css on change
npm run serve    # http://localhost:5173
```

## Deploy

GitHub Pages serves the `docs/` folder from the `main` branch. After editing HTML classes, run `npm run build` and commit the updated `docs/styles.css`.

## Customize

| What | Where |
| --- | --- |
| Content (hero, projects, about, FAQ) | `docs/index.html` |
| Contact email, form endpoint, chains, RPC endpoints, rotating roles | `CONFIG` at the top of `docs/main.js` |
| Design tokens (colors, type, spacing) | `tailwind.config.js` and [DESIGN.md](DESIGN.md) |

## Projects featured

- [Overland Ready](https://github.com/vincentinferido-a11y/overland-ready): Next.js 16 and Sanity CMS gear review site
- [RemitOtter](https://github.com/vincentinferido-a11y/remitotter): Solana meme-coin platform demo (Next.js 15, MongoDB, buyback-and-burn engine)
- [TS Task Control](https://github.com/vincentinferido-a11y/ts-task-control-ui): operations dashboard UI system
- [BoyaxDev Marketplace](https://github.com/vincentinferido-a11y/boyaxdev-marketplace-ui): website marketplace UI system
- [SkinStack](https://github.com/vincentinferido-a11y/skinstack-ui): skincare review site UI system

## Licensing & access

Copyright © 2026 Vincent Inferido. All rights reserved. This project is shared for portfolio viewing only; copying, modifying, deploying or redistributing it requires written permission. See [LICENSE](LICENSE).

**Want to use it, see more, or have something similar built?** Source access, commercial licensing and custom builds are available on request: [vincent.inferido@gmail.com](mailto:vincent.inferido@gmail.com?subject=Access%20request%3A%20Portfolio)

## Author

[Vincent Inferido](https://github.com/vincentinferido-a11y) · [LinkedIn](https://www.linkedin.com/in/vincentci/)
