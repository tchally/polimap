# Interactive U.S. Political Empathy Map

This is a [Next.js](https://nextjs.org) project that provides an interactive web application for exploring political perspectives across the United States. The application allows users to explore political leanings and perspectives by state and county, promoting understanding of regional political priorities.

## Political Leanings Methodology

### County-Level Political Leanings

County political leanings are calculated from presidential election results using the following methodology:

1. **Data Source**: Presidential election results from 2000-2024 are aggregated for each county
2. **Time Period**: Uses the **most recent 3 presidential elections** (typically 2024, 2020, 2016) for calculation
3. **Vote Aggregation**: Democratic and Republican votes are summed across these elections
4. **Classification Thresholds**:
   - **Strongly Democratic**: >60% Democratic vote share
   - **Democratic**: 55-60% Democratic vote share
   - **Swing**: <5% margin between parties, or 45-55% Democratic vote share
   - **Republican**: 55-60% Republican vote share
   - **Strongly Republican**: >60% Republican vote share

This methodology is implemented in `utils/electionDataParser.ts` in the `calculatePoliticalLean()` function.

### State-Level Political Leanings

State political leanings are calculated by aggregating county-level election results:

1. **County Aggregation**: All county election results within a state are combined
2. **Time Period**: Uses the **most recent 3 presidential elections** for calculation
3. **Vote Summation**: Democratic and Republican votes from all counties are totaled
4. **Classification**: Same thresholds as county-level classifications
5. **Calculation**: Total Democratic votes divided by total Democratic + Republican votes

This methodology is implemented in `data/stateElectionData.ts` in the `calculateStateLean()` function.

### Data Source

**Election Data**:
- **Source**: MIT Election Data and Science Lab, 2018, "County Presidential Election Returns 2000-2024", https://doi.org/10.7910/DVN/VOQCHQ, Harvard Dataverse, V17, UNF:6:s3ckPK5+Wl9H9iX98Ea6gw== [fileUNF]
- **File**: `countypres_2000-2024.tab` (located in `public/data/`)
- **Coverage**: All U.S. counties for presidential elections from 2000-2024
- **Data Points**: Candidate names, party affiliations, vote counts, and total votes by county

The election data is parsed and processed by `utils/electionDataParser.ts` and accessed through `data/electionData.ts`.

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
