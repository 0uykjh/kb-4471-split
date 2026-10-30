// What #4471 turned out to hold. causes.ts decides from channel and tenant, which is all intake
// records; it cannot read a body. A one-day shift and a month flip both arrive as "the date is
// wrong", so causes.ts files both under `parser`. The shift is only visible in the words, and the
// desk had already written those ids down in desk-notes.json under `oneDayMove`.
import { causeOf, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// `clock` is the third problem: the booking keeps its date but moves one day, which is what a
// date built in one timezone and read in another does. It is not the parser and not the hint.
// It is counted where the desk files it, under the cause its tenant and channel imply, and
// reported here as its own problem: the desk's rule is to count a report once, where it is filed.
export type Problem = Cause | 'clock';

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  // What intake guessed for these reports: tag → count.
  taggedAs: Record<string, number>;
  // Set on a problem whose reports are also counted under another one.
  countedUnder?: ProblemGroup['problem'];
};

function describe(problem: ProblemGroup['problem'], rs: Report[]): ProblemGroup {
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
}

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  shifted: readonly string[],
): ProblemGroup[] {
  const byCause = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const c = causeOf(r, tenantOf(r)) ?? 'unplaced';
    byCause.set(c, [...(byCause.get(c) ?? []), r]);
  }
  const groups = [...byCause.entries()].map(([c, rs]) => describe(c, rs));
  const clock = reports.filter((r) => shifted.includes(r.id));
  if (clock.length) {
    // Where the desk files these, so the page says where the count already sits.
    const filed = causeOf(clock[0], tenantOf(clock[0])) ?? 'unplaced';
    groups.push({ ...describe('clock', clock), countedUnder: filed });
  }
  return groups.sort((a, b) => b.reports.length - a.reports.length);
}

// How often intake's guess was not the cause the report turned out to have.
export function misTagged(groups: ProblemGroup[]): number {
  return groups
    .filter((g) => !g.countedUnder)
    .reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0);
}

// Rows the export sent twice, because its pages overlap. Counted once, reported here.
export function duplicateRows(raw: Report[], unique: Report[]): number {
  return raw.length - unique.length;
}
