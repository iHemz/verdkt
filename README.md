# Verdkt

**Is your backtest lying to you?** Verdkt takes a trade log and returns an honest verdict on whether a strategy has a real, robust edge, or whether the result is noise.

Most backtests report a single number: total profit, win rate, a smooth equity curve. Verdkt runs the checks those numbers hide. It is deliberately built to prove a strategy *wrong*, because that is the only way a positive result means anything.

The whole thing runs in the browser. Your trades are parsed and analysed on your device and never leave it.

## What it checks

1. **Expectancy in R.** Average risk-adjusted result per trade, not total profit. A high win rate with fat losers gets caught here.
2. **Out-of-sample stability.** Splits the trades in half by time. If the edge flips sign across the halves, it is a regime artifact, not a strategy. This is the single most common way a backtest fools its author.
3. **Significance.** A two-sided t-test of the average trade against zero. If the result is not separable from luck plus costs, you are told.
4. **Sample size.** Small samples routinely show fake edges. Verdkt is blunt about when there simply are not enough trades to conclude anything.

The verdict is one of: `EDGE HOLDS UP`, `PROMISING BUT THIN`, `NO ROBUST EDGE`, `NO EDGE`, or `NOT ENOUGH DATA`.

The method comes from the essay [How to Build a Backtest That Can Prove You Wrong](https://williamsab.dev/writing/how-to-build-a-backtest-that-can-prove-you-wrong).

## Supported inputs

A CSV export of closed trades. Auto-detects the profit/loss, R-multiple and date columns across the common formats: MT4/MT5, cTrader, TradingView strategy-tester exports, and hand-kept logs. Currency symbols, accounting-style negatives, thousands separators and European decimals are all handled.

## Tech

- **Next.js 16** (App Router, React 19, static export) + **TypeScript**
- **Tailwind CSS 4**, on "The Build Log" design system (shared with [williamsab.dev](https://williamsab.dev))
- **pnpm** for package management
- **Vitest** + Testing Library for unit and component tests
- **Playwright** for end-to-end tests

### Project layout

```
src/
  app/                     # routes, layout, global styles
  components/
    analyzer/              # feature: input + verdict UI (client + presentational)
    site/                  # header, footer, method grid
    ui/                    # shared primitives (Button)
  lib/
    analysis/              # domain logic: parse -> Trade[] -> analyze -> Analysis
      csv.ts               #   low-level CSV/number/date parsing
      parse.ts             #   trade-log parsing + column detection
      stats.ts             #   pure statistics (mean, stdev, t-stat, drawdown)
      analyze.ts           #   the edge-analysis engine
      sample.ts            #   deterministic demo log
      types.ts             #   shared domain types
    format.ts              # presentation-layer formatting helpers
e2e/                       # Playwright specs
```

Domain logic is pure and side-effect-free, colocated with unit tests. UI imports from `@/lib/analysis` (the barrel), never from internal files.

## Commands

```bash
pnpm dev          # start the dev server
pnpm test         # unit + component tests (Vitest)
pnpm test:e2e     # end-to-end tests (Playwright)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm build        # production build
pnpm check        # typecheck + lint + test + build
```

## Disclaimer

Verdkt is an analysis tool, not financial advice. A passing verdict is not a recommendation to trade.
