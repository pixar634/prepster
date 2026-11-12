"use client";

import { useEffect, useState } from "react";
import { Check, Play, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { score, testsFor, type LevelScore } from "@/lib/practical";
import { runClass } from "@/lib/sandbox";
import { cn } from "@/lib/utils";
import type { Lang, Practical, RunRow } from "@/lib/types";

const LANG_LABEL: Record<Lang, string> = { python: "Python", javascript: "JavaScript" };

/**
 * The practical assessment: one project built up over four levels against a clock. Your code runs in a Web Worker in
 * this browser; nothing you write is sent anywhere. Visible tests run while you work; hidden ones run at submit.
 */
export function PracticalView({ task }: { task: Practical }) {
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState<Record<Lang, string>>(task.starter);
  const [level, setLevel] = useState(1);
  const [scores, setScores] = useState<LevelScore[]>([]);
  const [ranSubmit, setRanSubmit] = useState(false);
  const [busy, setBusy] = useState("");
  const [fatal, setFatal] = useState("");
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    if (endsAt === null || ranSubmit) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt, ranSubmit]);

  const lv = task.levels[level - 1];
  const left = endsAt === null ? task.minutes * 60 : Math.max(0, Math.round((endsAt - now) / 1000));
  const clock = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  async function run(submit: boolean) {
    setFatal("");
    setBusy(submit ? "Running every test, including the hidden ones" : "Running the visible tests");
    const levels = task.levels.filter((l) => submit || l.level <= level);
    const tests = levels.flatMap((l) => testsFor(l, submit).map((t) => t.test.ops));
    const res = await runClass(lang, code[lang], task.class, tests);
    setBusy("");
    if ("fatal" in res) {
      setScores([]);
      return setFatal(res.fatal);
    }
    let at = 0;
    const next: LevelScore[] = [];
    for (const l of levels) {
      const n = testsFor(l, submit).length;
      next.push(score(l, res.results.slice(at, at + n) as RunRow[], submit));
      at += n;
    }
    setScores(next);
    setRanSubmit(submit);
  }

  const total = scores.reduce((n, s) => n + s.total, 0);
  const passed = scores.reduce((n, s) => n + s.passed, 0);
  const timeUp = endsAt !== null && left === 0;

  return (
    <section className="flex flex-col gap-4" aria-label="Practical assessment">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Practical assessment · {task.minutes} minutes</p>
            <h2 className="mt-1 text-2xl font-semibold">{task.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("font-mono text-2xl tabular-nums", timeUp && "text-amber-400")} aria-label="Time left">
              {clock}
            </span>
            {endsAt === null && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEndsAt(Date.now() + task.minutes * 60_000);
                  setNow(Date.now());
                }}
              >
                Start the clock
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-muted-foreground">{task.intro}</p>
        <p className="mt-2 text-sm text-muted-foreground">Your code runs in this browser and is never sent anywhere.</p>
      </div>

      <div role="tablist" aria-label="Levels" className="flex gap-1 overflow-x-auto">
        {task.levels.map((l) => (
          <button
            key={l.level}
            role="tab"
            aria-selected={l.level === level}
            onClick={() => setLevel(l.level)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm",
              l.level === level ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Level {l.level}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Level {level} spec</h3>
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{lv.spec}</pre>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Language" className="flex gap-1">
              {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                <Button key={l} size="sm" variant={l === lang ? "primary" : "outline"} onClick={() => setLang(l)} aria-pressed={l === lang}>
                  {LANG_LABEL[l]}
                </Button>
              ))}
            </div>
            <span className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => setCode({ ...code, [lang]: task.starter[lang] })}>
              Reset code
            </Button>
          </div>
          <label className="sr-only" htmlFor="code">
            Your {LANG_LABEL[lang]} code
          </label>
          <textarea
            id="code"
            value={code[lang]}
            onChange={(e) => setCode({ ...code, [lang]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key !== "Tab" || e.shiftKey) return;
              e.preventDefault(); // Tab indents; Esc then Tab moves on
              const el = e.currentTarget;
              const { selectionStart: a, selectionEnd: b, value } = el;
              const v = `${value.slice(0, a)}    ${value.slice(b)}`;
              setCode({ ...code, [lang]: v });
              requestAnimationFrame(() => el.setSelectionRange(a + 4, a + 4));
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="h-96 w-full resize-y rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => run(false)} disabled={!!busy}>
              <Play className="size-4" /> Run level {level === 1 ? "1" : `1 to ${level}`} tests
            </Button>
            <Button onClick={() => run(true)} disabled={!!busy}>
              <Send className="size-4" /> Submit
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {busy}
              {busy && lang === "python" && " (the first Python run downloads the runtime)"}
            </span>
          </div>
        </div>
      </div>

      {fatal && (
        <pre role="alert" className="whitespace-pre-wrap rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-200">
          {fatal}
        </pre>
      )}

      {scores.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6" aria-live="polite">
          <h3 className="text-lg font-semibold">
            {ranSubmit ? "Submitted" : "Visible tests"}: {passed} of {total} passed
          </h3>
          {ranSubmit && (
            <p className="mt-1 text-sm text-muted-foreground">
              Hidden tests show only whether they passed. They are the edge cases and the interactions with earlier levels.
            </p>
          )}
          <div className="mt-4 flex flex-col gap-4">
            {scores.map((s) => (
              <div key={s.level}>
                <p className="mb-2 text-sm font-medium">
                  Level {s.level}: {s.passed} of {s.total}
                </p>
                <ul className="flex flex-col gap-1 text-sm">
                  {s.results.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      {r.pass ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-label="passed" /> : <X className="mt-0.5 size-4 shrink-0 text-amber-400" aria-label="failed" />}
                      <span>
                        {r.hidden ? `Hidden test ${i + 1 - task.levels[s.level - 1].visible.length}` : r.name}
                        {!r.pass && !r.hidden && <span className="block font-mono text-xs text-muted-foreground">{r.why}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {ranSubmit && (
            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                A written review of your code (breakdown, readability, complexity, how you explain it) needs your own Anthropic key and arrives with real preps.
              </p>
              <div>
                <Button size="sm" variant="outline" onClick={() => setShowSolution((s) => !s)}>
                  {showSolution ? "Hide" : "Show"} the reference solution
                </Button>
              </div>
              {showSolution && (
                <>
                  <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-4 text-sm">
                    <code>{task.solution[lang]}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground">Complexity: {task.complexity}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
