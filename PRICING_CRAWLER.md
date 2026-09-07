# RAD competitor-price crawler

This tool collects publicly listed comparable products from explicitly configured Iranian shops, matches them to available/draft RAD products, and produces an auditable price recommendation report. It respects each host's `robots.txt`, stays on allow-listed hosts, throttles requests, and never changes the database unless `--apply` is supplied.

## Configure

Copy `pricing.config.example.json` to `pricing.config.json` (the latter remains uncommitted) and replace the sample host and selectors. Sites with valid schema.org `Product` JSON-LD usually need no card selectors. Confirm the site's terms permit automated access. Currency must be `IRT` for toman or `IRR` for rial.

The recommendation is the median of the strongest comparable prices, multiplied by `priceMultiplier` and rounded to `roundToToman`. It is rejected if fewer than `minimumComparables` exist, average similarity is below `minimumConfidence`, or the change exceeds `maximumChangePercent`.

## Preview and apply

Run from the repository root with `DATABASE_URL` set:

```sh
npm run pricing:crawl --workspace @rad/api -- --config pricing.config.json --output pricing-report.json
```

Review every comparison URL and recommendation in `pricing-report.json`, then apply only recommendations that passed all guards:

```sh
npm run pricing:crawl --workspace @rad/api -- --config pricing.config.json --output pricing-report.json --apply
```

Only `available` and `draft` products are considered. Updating a toman price also recalculates the existing USD display price using the application's current 85,000 toman convention.
