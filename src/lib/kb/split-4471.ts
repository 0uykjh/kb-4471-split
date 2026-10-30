// What #4471 turned out to hold. causes.ts decides from channel and tenant, which is all intake
// records; it cannot read a body. A one-day shift and a month flip both arrive as "the date is
// wrong", so causes.ts files both under `parser`. The shift is only visible in the words, and the
// desk had already written those ids down in desk-notes.json under `oneDayMove`.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `clock` is the third problem: the booking keeps its date but moves one day, which is what a
// date built in one timezone and read in another does. It is not the parser and not the hint.
export type Problem = Cause | 'clock';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'clock'];

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // What intake guessed for these reports: tag → count.
  taggedAs: Record<string, number>;
};

// A report belongs to the problem its body describes. Where the body says a one-day shift, that
// wins over the cause channel and tenant imply.
export function problemOf(r: Report, t: Tenant | undefined, shifted: readonly string[]): Problem | null {
  return shifted.includes(r.id) ? 'clock' : causeOf(r, t);
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), shifted) ?? 'unplaced';
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
        taggedAs: rs.reduce<Record<string, number>>(
          (n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }),
          {},
        ),
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// How often intake's guess was not the problem the report turned out to be.
export function misTagged(groups: ProblemGroup[]): number {
  return groups.reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0);
}

// Rows the export sent twice, because its pages overlap. Counted once, reported here.
export function duplicateRows(raw: Report[], unique: Report[]): number {
  return raw.length - unique.length;
}
