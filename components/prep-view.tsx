"use client";

import { useState } from "react";
import { Deck, type Marks } from "@/components/deck";
import { PracticalView } from "@/components/practical";
import { useStored } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Practical, Prep } from "@/lib/types";

const NO_MARKS: Marks = {};

/** One prep: the company, each round as a practice deck, and (for roles that code) the practical. */
export function PrepView({ prep, practical, storageId }: { prep: Prep; practical: Practical; storageId: string }) {
  const [tab, setTab] = useState("company");
  const [marks, setMarks] = useStored<Marks>(`prepster:marks:${storageId}`, NO_MARKS);

  const tabs = [
    { id: "company", label: "Company" },
    ...prep.rounds.map((r, i) => ({ id: r.id, label: `Round ${i + 1}` })),
    ...(prep.needsCoding ? [{ id: "practical", label: "Practical" }] : []),
  ];
  const total = prep.rounds.reduce((n, r) => n + r.questions.length, 0);
  const got = Object.values(marks).filter((m) => m === "got").length;
  const r = prep.research;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Interview prep</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {prep.role} at {prep.company}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">For {prep.candidate}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Got it: <b className="text-foreground">{got}</b>/{total}
        </p>
      </header>

      {prep.sample && (
        <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <b className="text-foreground">This is a sample.</b> {prep.candidate} and {prep.company} are invented, so nothing here links to a source. A real prep
          links every fact about the company to the page it came from, and drops any it can&apos;t source.
        </p>
      )}

      <div role="tablist" aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium",
              tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="flex flex-col gap-6">
          <p className="text-lg leading-relaxed">{prep.overview}</p>
          <Block title="The company">
            <p>{r.summary}</p>
          </Block>
          <div className="grid gap-6 sm:grid-cols-2">
            <Block title="What they build">
              <Items items={r.products} />
            </Block>
            <Block title="What they value">
              <Items items={r.values} />
            </Block>
          </div>
          <Block title="How they interview">
            <Items items={r.process} numbered />
          </Block>
          <Block title="Their stack">
            <p>{r.stack.join(", ")}</p>
          </Block>
          <div>
            <button className="text-sm underline underline-offset-4" onClick={() => setTab(prep.rounds[0].id)}>
              Start round 1
            </button>
          </div>
        </div>
      )}

      {prep.rounds.map((round, i) => {
        if (tab !== round.id) return null;
        const next = prep.rounds[i + 1];
        const after = next ? next.name : prep.needsCoding ? "Practical assessment" : "Interview complete";
        return (
          <Deck
            key={round.id}
            round={round}
            roundNumber={i + 1}
            roundCount={prep.rounds.length}
            marks={marks}
            onMarks={setMarks}
            nextLabel={after}
            onNext={() => setTab(next ? next.id : prep.needsCoding ? "practical" : "company")}
          />
        );
      })}

      {tab === "practical" && <PracticalView task={practical} />}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Items({ items, numbered }: { items: { name: string; what: string; source?: string }[]; numbered?: boolean }) {
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className={cn("space-y-2 pl-5", numbered ? "list-decimal" : "list-disc")}>
      {items.map((it) => (
        <li key={it.name}>
          <b>{it.name}</b>: {it.what}
          {it.source && (
            <>
              {" "}
              <a className="underline underline-offset-4" href={it.source} target="_blank" rel="noopener noreferrer">
                source
              </a>
            </>
          )}
        </li>
      ))}
    </Tag>
  );
}
