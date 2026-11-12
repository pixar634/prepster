import type { Lang, Practical, PracticalLevel, PracticalTest, RunRow } from "./types";

/** Two results are the same if they are the same JSON. Order matters: a list answer is exact. */
export const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export interface TestResult {
  name: string;
  hidden: boolean;
  pass: boolean;
  /** The first call that went wrong, as "call 3: add_product(1, 'A', 2) returned X, expected Y"; empty when it passed. */
  why: string;
}

export function check(test: PracticalTest, row: RunRow, hidden: boolean): TestResult {
  const base = { name: test.name, hidden };
  if (!row.ok) return { ...base, pass: false, why: row.error ?? "The code raised an error." };
  const got = row.out ?? [];
  for (let i = 0; i < test.expected.length; i++) {
    if (!same(got[i], test.expected[i] ?? null)) {
      const [method, args] = test.ops[i];
      return {
        ...base,
        pass: false,
        why: `call ${i + 1}: ${method}(${args.map((a) => JSON.stringify(a)).join(", ")}) returned ${JSON.stringify(got[i] ?? null)}, expected ${JSON.stringify(test.expected[i])}`,
      };
    }
  }
  return { ...base, pass: true, why: "" };
}

/** The tests a level runs while you work (visible) or at submit (visible and hidden). */
export function testsFor(level: PracticalLevel, submit: boolean): { test: PracticalTest; hidden: boolean }[] {
  return [
    ...level.visible.map((test) => ({ test, hidden: false })),
    ...(submit ? level.hidden.map((test) => ({ test, hidden: true })) : []),
  ];
}

export interface LevelScore {
  level: number;
  passed: number;
  total: number;
  results: TestResult[];
}

export function score(level: PracticalLevel, rows: RunRow[], submit: boolean): LevelScore {
  const results = testsFor(level, submit).map(({ test, hidden }, i) => check(test, rows[i] ?? { ok: false, error: "No result." }, hidden));
  return { level: level.level, passed: results.filter((r) => r.pass).length, total: results.length, results };
}

/** Method names in the language: Python is snake_case, JavaScript is the same name in camelCase. */
export const methodName = (name: string, lang: Lang) =>
  lang === "python" ? name : name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** A task survives only with four levels that each keep a spec, enough visible tests and a reference solution. */
export function isWellFormed(p: Practical): boolean {
  return (
    p.levels.length === 4 &&
    p.levels.every((l) => l.spec.trim() && l.visible.length >= 2) &&
    p.solution.python.trim() !== "" &&
    p.solution.javascript.trim() !== ""
  );
}
