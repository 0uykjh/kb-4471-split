# #4471, split

The support desk merged 412 reports about wrong dates into one ticket, #4471, and marked it
known. Reading the bodies shows it holds three problems, not one. Each has a ticket here:

| problem | reports | ticket |
|---|---|---|
| parser reads dates month first | 374 | [#1](https://github.com/0uykjh/kb-4471-split/issues/1) |
| booking-v3 prints a month-first date hint | 33 | [#2](https://github.com/0uykjh/kb-4471-split/issues/2) |
| booking moves one day | 5 | [#3](https://github.com/0uykjh/kb-4471-split/issues/3) |

374 + 33 + 5 = 412. Every report is counted once.

## The page

- the `.svx`: [`src/routes/kb/incidents/4471/split/+page.svx`](src/routes/kb/incidents/4471/split/+page.svx)
- the page as the desk will see it: [`rendered/kb-incidents-4471-split.html`](rendered/kb-incidents-4471-split.html)

Per the kb's conventions, no count is typed into the page. They are computed at render time by
`src/lib/kb/ProblemTable.svelte` from `src/lib/kb/split-4471.ts`, over the export in
`src/lib/data/`. The page is signed, so it carries a desk ref.

## Rebuilding the rendered page

The export shipped without a build. `package.json`, `vite.config.js` and `render/entry.js` are
the smallest setup that renders a kb page exactly as the kb defines it — the real `runbook`
layout, the real components, the real data.

```
npm install
npx vite build --ssr render/entry.js --outDir render/out
PAGE=4471/split OUT=rendered/kb-incidents-4471-split.html node render/out/entry.js
```

Everything under `src/` except the files listed below is the desk's export, unchanged.

## What was added

- `src/routes/kb/incidents/4471/split/+page.svx` — the page
- `src/lib/kb/split-4471.ts` — the logic that separates the three problems
- `src/lib/kb/ProblemTable.svelte` — the component that counts them
- `package.json`, `vite.config.js`, `render/entry.js` — the build that renders a page
- `rendered/` — the rendered page
