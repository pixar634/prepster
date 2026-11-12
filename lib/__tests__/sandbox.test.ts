import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { loadPyodide } from "pyodide";
import { isWellFormed, score, testsFor } from "../practical";
import type { Lang, Op, Practical, RunRow } from "../types";

/**
 * The exit test for the sample: the real public/runner.js, loaded the way a browser worker loads it (only the
 * Python runtime is the npm build of the same Pyodide version), must pass every test with the reference solution,
 * in both languages.
 */
const task = JSON.parse(readFileSync("data/practical-sample.json", "utf8")) as Practical;
const source = readFileSync("public/runner.js", "utf8");

function worker(): (lang: Lang, code: string, tests: Op[][]) => Promise<RunRow[] | { fatal: string }> {
  const posted: Record<string, unknown>[] = [];
  const self: Record<string, unknown> = {
    postMessage: (m: Record<string, unknown>) => posted.push(m),
    importScripts: () => {},
    loadPyodide: () => loadPyodide(), // the runner asks for the CDN build; the npm build is the same version
    console,
    structuredClone,
    performance,
  };
  self.self = self; // in a worker the global object is `self`, so bare names like importScripts resolve on it
  runInNewContext(source, self);
  let id = 0;
  return async (lang, code, tests) => {
    id += 1;
    await (self.onmessage as (e: unknown) => Promise<void>)({ data: { id, lang, code, name: task.class, tests, mode: "class" } });
    const reply = posted.find((m) => m.id === id)!;
    return "fatal" in reply ? { fatal: String(reply.fatal) } : (reply.results as RunRow[]);
  };
}

async function runLevels(run: ReturnType<typeof worker>, lang: Lang, code: string) {
  const scores = [];
  for (const level of task.levels) {
    const tests = testsFor(level, true);
    const rows = await run(lang, code, tests.map((t) => t.test.ops));
    expect("fatal" in rows ? rows : "ok").toBe("ok");
    scores.push(score(level, rows as RunRow[], true));
  }
  return scores;
}

describe("the sample practical", () => {
  it("is well formed: four levels, 41 tests", () => {
    expect(isWellFormed(task)).toBe(true);
    expect(task.levels.flatMap((l) => testsFor(l, true))).toHaveLength(41);
  });

  for (const lang of ["javascript", "python"] as const) {
    it(`passes every test with the ${lang} reference solution in the sandbox`, async () => {
      const scores = await runLevels(worker(), lang, task.solution[lang]);
      const failed = scores.flatMap((s) => s.results.filter((r) => !r.pass).map((r) => `L${s.level} ${r.name}: ${r.why}`));
      expect(failed).toEqual([]);
      expect(scores.reduce((n, s) => n + s.total, 0)).toBe(41);
    });

    it(`does not pass with the ${lang} starter code`, async () => {
      const scores = await runLevels(worker(), lang, task.starter[lang]);
      expect(scores.reduce((n, s) => n + s.passed, 0)).toBeLessThan(41);
    });
  }

  it("reports a wrong answer with the call that went wrong", async () => {
    const broken = task.solution.javascript.replace("class Inventory {", "class Inventory {\n  static x = 1;").replace(/return true;/, "return false;");
    const [level1] = await runLevels(worker(), "javascript", broken);
    const bad = level1.results.find((r) => !r.pass);
    expect(bad?.why).toMatch(/^call \d+: \w+\(.*returned .*, expected /);
  });

  it("cuts the network from submitted code", async () => {
    const run = worker();
    const code = `class ${task.class} { probe() { return typeof fetch + "," + typeof XMLHttpRequest + "," + typeof WebSocket; } }`;
    const rows = (await run("javascript", code, [[["probe", []]]])) as RunRow[];
    expect(rows[0].out).toEqual(["undefined,undefined,undefined"]);
  });
});
