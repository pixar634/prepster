import type { Lang, Op, RunReply, RunRow } from "./types";

/**
 * The page's side of the sandbox. Each language gets its own Web Worker (public/runner.js), so a worker that has
 * loaded Python never runs JavaScript, and one that's stuck in a loop is simply terminated. The worker has no network
 * once it has loaded.
 */
const FIRST_PYTHON_MS = 60_000; // loading Python the first time downloads it
const RUN_MS = 10_000;

interface Slot {
  worker: Worker;
  warm: boolean;
}
const slots: Partial<Record<Lang, Slot>> = {};
let next = 1;

function slot(lang: Lang): Slot {
  let s = slots[lang];
  if (!s) {
    s = { worker: new Worker("/runner.js"), warm: false };
    slots[lang] = s;
  }
  return s;
}

export type RunResult = { results: RunRow[] } | { fatal: string };

/** Make a fresh object per test and call its methods in order. Resolves with the results, or why it couldn't run. */
export function runClass(lang: Lang, code: string, name: string, tests: Op[][]): Promise<RunResult> {
  const s = slot(lang);
  const id = next++;
  const limit = lang === "python" && !s.warm ? FIRST_PYTHON_MS : RUN_MS;
  return new Promise((resolve) => {
    const stop = (fatal: string) => {
      s.worker.terminate();
      delete slots[lang];
      resolve({ fatal });
    };
    const timer = setTimeout(
      () => stop(`The run took longer than ${limit / 1000} seconds and was stopped. Check for an infinite loop.`),
      limit,
    );
    s.worker.onmessage = ({ data }: MessageEvent<RunReply>) => {
      if (data.id !== id) return;
      clearTimeout(timer);
      s.warm = true;
      resolve("fatal" in data ? { fatal: data.fatal } : { results: data.results });
    };
    s.worker.onerror = (e) => {
      clearTimeout(timer);
      stop(e.message || "The sandbox failed to start.");
    };
    s.worker.postMessage({ id, lang, code, name, tests, mode: "class" });
  });
}
