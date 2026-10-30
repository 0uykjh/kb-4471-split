<script lang="ts">
  import raw from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, misTagged, duplicateRows } from '#lib/kb/split-4471';
  import { tenantOf } from '#lib/kb/locales';

  // `issues` maps a problem moved out of the ticket to the ticket now holding it; a problem with
  // no entry stays in `ticket`. Issue numbers cannot be computed, so the page passes them; every
  // count on this page is computed here.
  let { ticket, repo, issues }: { ticket: number; repo: string; issues: Record<string, number> } = $props();

  const all = $derived(uniqueById(raw as Report[]));
  // Everything that was merged into the ticket: what is still there, and what moved out of it.
  const homes = $derived(new Set([ticket, ...Object.values(issues)]));
  const merged = $derived(all.filter((r) => r.mergedInto !== null && homes.has(r.mergedInto)));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const dupes = $derived(duplicateRows(raw as Report[], all));
  const wrongTag = $derived(misTagged(groups));
  const label: Record<string, string> = {
    parser: 'parser reads dates month first',
    hint: 'booking-v3 prints the wrong date hint',
    clock: 'booking moves one day',
    unplaced: 'no tenant on file',
  };
  const tags = (g: { taggedAs: Record<string, number> }) =>
    Object.entries(g.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code> — {label[g.problem]}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="tags">{tags(g)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}
            <a href="https://github.com/{repo}/issues/{issues[g.problem]}">#{issues[g.problem]}</a>
          {:else}#{ticket}{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Intake's tag was not the problem the report turned out to be <strong>{wrongTag}</strong> times, so the tag
  is a guess and not evidence. The export sent <strong>{dupes}</strong> rows twice, because its pages overlap;
  they are counted once here.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .tags { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
