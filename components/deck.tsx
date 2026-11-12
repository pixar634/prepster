"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { afterMark, newDeck, pick, type DeckState, type Mark } from "@/lib/deck";
import { cn } from "@/lib/utils";
import { SAY_KINDS, type Round } from "@/lib/types";

export type Marks = Record<string, Mark>;
const DIFFICULTY = ["Basic", "Intermediate", "Advanced"];

interface Props {
  round: Round;
  roundNumber: number;
  roundCount: number;
  marks: Marks;
  onMarks: (next: Marks) => void;
  /** What comes after this round, e.g. "Start round 2". */
  nextLabel: string;
  onNext: () => void;
}

/**
 * One round as an adaptive deck: it opens on the round's brief, then serves one question at a time. Marking a
 * question records it and moves on; two "got it" in a row make the next ones harder, "review again" eases off.
 */
export function Deck({ round, roundNumber, roundCount, marks, onMarks, nextLabel, onNext }: Props) {
  const [deck, setDeck] = useState<DeckState>(newDeck);
  /** -1 is the brief; deck.order.length is the end of the round. */
  const [at, setAt] = useState(-1);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState("");

  const key = (i: number) => `${round.id}:${i}`;
  const total = round.questions.length;
  const finished = at >= deck.order.length && deck.order.length === total;
  const current = at >= 0 && at < deck.order.length ? deck.order[at] : -1;

  const go = useCallback(
    (step: 1 | -1) => {
      setRevealed(false);
      if (step < 0) return setAt((a) => Math.max(-1, a - 1));
      if (at < deck.order.length - 1) return setAt(at + 1);
      const next = pick(round.questions, deck.order, deck.target);
      if (next < 0) return setAt(deck.order.length);
      setDeck({ ...deck, order: [...deck.order, next] });
      setAt(deck.order.length);
    },
    [at, deck, round.questions],
  );

  const mark = useCallback(
    (m: Mark) => {
      if (current < 0) return;
      const k = key(current);
      const fresh = !marks[k];
      onMarks({ ...marks, [k]: m });
      let d = deck;
      if (fresh) {
        const r = afterMark(deck, m);
        d = r.deck;
        setNotice(r.shift > 0 ? "Two in a row. The questions get harder." : r.shift < 0 ? "Easing off a level." : "");
      }
      setRevealed(false);
      const next = at < d.order.length - 1 ? -2 : pick(round.questions, d.order, d.target);
      if (next === -2) {
        setDeck(d);
        setAt(at + 1);
      } else if (next < 0) {
        setDeck(d);
        setAt(d.order.length);
      } else {
        setDeck({ ...d, order: [...d.order, next] });
        setAt(d.order.length);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [at, current, deck, marks, onMarks, round],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName ?? "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (/^(BUTTON|A)$/.test(tag) && (e.key === "Enter" || e.key === " ")) return; // the focused button handles it
      if (at < 0 || finished) return;
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (k === "g") mark("got");
      else if (k === "r") mark("again");
      else if (k === "arrowright") {
        e.preventDefault();
        go(1);
      } else if (k === "arrowleft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, finished, go, mark]);

  const restart = () => {
    setDeck(newDeck());
    setAt(-1);
    setRevealed(false);
    setNotice("");
  };

  const got = round.questions.filter((_, i) => marks[key(i)] === "got").length;

  return (
    <section className="rounded-lg border border-border bg-card" aria-label={`Round ${roundNumber}: ${round.name}`}>
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground sm:px-6">
        <span>
          Round {roundNumber} of {roundCount} · {round.name}
        </span>
        <span className="whitespace-nowrap">{at < 0 ? `${total} questions` : finished ? "Round complete" : `Q ${at + 1} / ${total}`}</span>
      </div>

      <ol className="flex gap-1 px-4 pt-4 sm:px-6" aria-label="Questions in this round">
        {round.questions.map((_, slot) => {
          const idx = deck.order[slot];
          const m = idx === undefined ? undefined : marks[key(idx)];
          return (
            <li
              key={slot}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-muted",
                idx !== undefined && "bg-foreground/40",
                m === "got" && "bg-emerald-500",
                m === "again" && "bg-amber-500",
                slot === at && "ring-2 ring-foreground/60",
              )}
            />
          );
        })}
      </ol>

      <div className="min-h-72 px-4 py-6 sm:px-6">
        {at < 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold sm:text-3xl">{round.name}</h2>
            <p className="text-muted-foreground">{round.format}</p>
            <p className="text-sm">
              <b>What it decides:</b> {round.decides}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => go(1)}>
                Begin round {roundNumber} <ArrowRight className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Questions get harder as you get them right.</span>
            </div>
          </div>
        )}

        {current >= 0 && (
          <Question
            key={current}
            q={round.questions[current]}
            mark={marks[key(current)]}
            revealed={revealed}
            onReveal={() => setRevealed((r) => !r)}
          />
        )}

        {finished && (
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Round {roundNumber} complete · {got} of {total} got it
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">{nextLabel}</h2>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onNext}>
                Continue <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={restart}>
                <RotateCcw className="size-4" /> Run this round again
              </Button>
            </div>
          </div>
        )}
      </div>

      {current >= 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 sm:px-6">
          <Button size="sm" variant="ghost" onClick={() => go(-1)} aria-keyshortcuts="ArrowLeft">
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRevealed((r) => !r)} aria-keyshortcuts="Space">
            {revealed ? "Hide answer" : "Reveal answer"} <kbd className="text-xs text-muted-foreground">Space</kbd>
          </Button>
          <span className="flex-1 text-xs text-muted-foreground" aria-live="polite">
            {notice || `Difficulty: ${DIFFICULTY[deck.target]}`}
          </span>
          <Button size="sm" variant="warn" onClick={() => mark("again")} aria-keyshortcuts="r">
            Review again <kbd className="text-xs">R</kbd>
          </Button>
          <Button size="sm" variant="good" onClick={() => mark("got")} aria-keyshortcuts="g">
            <Check className="size-4" /> Got it <kbd className="text-xs">G</kbd>
          </Button>
        </div>
      )}
    </section>
  );
}

function Question({ q, mark, revealed, onReveal }: { q: Round["questions"][number]; mark?: Mark; revealed: boolean; onReveal: () => void }) {
  const talking = SAY_KINDS.includes(q.kind);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-border px-2 py-0.5">{q.level}</span>
        <span className="rounded-full border border-border px-2 py-0.5">{q.kind}</span>
        {mark && (
          <span className={cn("rounded-full px-2 py-0.5", mark === "got" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400")}>
            {mark === "got" ? "Got it" : "To review"}
          </span>
        )}
      </div>
      <h2 className="text-xl font-semibold leading-snug sm:text-2xl">{q.q}</h2>
      {q.why && (
        <p className="text-sm text-muted-foreground">
          <b className="text-foreground">Why they ask:</b> {q.why}
        </p>
      )}

      {!revealed && (
        <div>
          <Button variant="outline" onClick={onReveal}>
            Reveal answer
          </Button>
        </div>
      )}

      {revealed && (
        <div className="flex flex-col gap-5 border-t border-border pt-5">
          {q.say && (
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">What you could say</p>
              <p className="leading-relaxed">{q.say}</p>
            </div>
          )}
          {q.answer.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{q.say || talking ? "Points to hit" : "Model answer"}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {q.answer.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
            </div>
          )}
          {q.code && (
            <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-4 text-sm">
              <code>{q.code}</code>
            </pre>
          )}
          {q.followUps.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Follow-ups</p>
              <ul className="list-disc space-y-1 pl-5">
                {q.followUps.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {q.pitfalls.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-amber-400">Pitfalls</p>
              <ul className="list-disc space-y-1 pl-5 text-amber-200/90">
                {q.pitfalls.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {q.source && (
            <a className="text-sm underline underline-offset-4" href={q.source} target="_blank" rel="noopener noreferrer">
              Where this comes from
            </a>
          )}
        </div>
      )}
    </div>
  );
}
