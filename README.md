# Curve Climb

**Live:** [curve-climb.vercel.app](https://curve-climb.vercel.app) · **Repo:** [github.com/Isaaco3349/curve-climb](https://github.com/Isaaco3349/curve-climb)

Browser runner for [vibe/vibe](https://testnet.vibevibe.fun) testnet. The HUD bar is a **live bonding curve** read from Robinhood Chain (V6 factory). You start at the current graduation % and run toward the **graduation gate** — with a snipe-tax zone, buy/sell platforms, and momentum mechanics.

**Pair:** launch with **VIBEVIBE** as quote on the create flow.

## GitHub — do you need it?

**No** for Project Spotlight or launch. Required for spotlight: **working demo**, accurate description, links on your token page.

**Yes, recommended:** public repo helps **Product & Utility** credibility and gives reviewers a feedback surface. Optional link on the vibe project page.

## Local dev

```bash
npm install
npm run dev
```

Open the URL Vite prints. After you launch, play with your token:

`http://localhost:5173/?token=0xYourTokenAddress`

## Deploy

```bash
npm run build
```

Deploy `dist/` to Vercel, Netlify, or GitHub Pages. Set the site URL on your vibe/vibe project page when you launch.

## Testnet

- Gas: [Robinhood testnet faucet](https://faucet.testnet.chain.robinhood.com)
- Launch: [testnet.vibevibe.fun/create](https://testnet.vibevibe.fun/create) → **vibe/vibe** pair → **Product & Utility**
- Testnet tokens have no monetary value. Not financial advice.

## Uniqueness vs other spotlight games

- **Live on-chain curve %** shapes run length and start position (not a static level).
- Teaches **V6 snipe tax (first 20s)** and **buy/sell** as platform types.
- **Candle Climber** uses chart terrain; this uses the **graduation progress bar** as the world.
