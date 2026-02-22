This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Trade-In Provider Setup

The trade-in API endpoint (`/api/trade-in/valuation`) supports live external providers with automatic fallback to internal valuation.

Set one of these in `.env.local`:

```bash
# Provider mode: auto | blackbook | marketcheck | internal
TRADE_IN_PROVIDER=auto

# Optional target currency for provider responses
TRADE_IN_TARGET_CURRENCY=INR
USD_TO_INR_RATE=83
```

### Black Book

```bash
BLACKBOOK_VALUATION_URL=https://<your-blackbook-endpoint>
BLACKBOOK_API_KEY=<your-key>
BLACKBOOK_METHOD=POST
BLACKBOOK_AUTH_HEADER=x-api-key
```

### MarketCheck

```bash
MARKETCHECK_API_KEY=<your-key>
MARKETCHECK_BASE_URL=https://api.marketcheck.com
MARKETCHECK_PRICE_PATH=/v2/predict/car/us/marketcheck_price
MARKETCHECK_ZIP=10001
MARKETCHECK_DEALER_TYPE=independent
MARKETCHECK_IS_CERTIFIED=false
```

Notes:
- MarketCheck price API requires a VIN and a ZIP code.
- If provider keys are missing or provider call fails, the app falls back to internal market-based valuation.
