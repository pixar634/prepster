import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

const REPO = "https://github.com/pixar634/prepster";

const COMING = [
  {
    title: "Company research, with sources",
    body: "What the company builds, its stack, its values and how it interviews for your role. Every fact links to the page it came from; what can't be found stays empty.",
  },
  {
    title: "The rounds you'll face",
    body: "A screen, the deep round and a leadership and culture round, planned from the company's real process where it's public.",
  },
  {
    title: "Answers from your real CV",
    body: "Model answers that use only what your CV says, honest about gaps. Then practise one question at a time, harder as you get them right.",
  },
  {
    title: "Coding practice in your browser",
    body: "For roles that code: a coding test and a timed practical, run in a sandbox in your browser. Your code never runs on our servers.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 px-4 py-16 sm:px-6">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Prepster</p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Walk into the interview knowing the questions.
        </h1>
        <p className="text-lg text-muted-foreground">
          Upload your CV and the job description. Prepster researches the company, plans the rounds you&apos;re
          likely to face and writes answers from your real experience. Then you practise.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {COMING.map((c) => (
          <li key={c.title} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-medium">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/sample" className={buttonClass({ size: "lg" })}>
          Try the sample
        </Link>
        <span className="text-sm text-muted-foreground">No key and no sign-up. Invented people, real practice.</span>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="rounded-full border border-border px-3 py-1">Early: preps for your own CV are not built yet</span>
        <a className="underline underline-offset-4 hover:text-foreground" href={REPO}>
          Follow along on GitHub
        </a>
      </footer>
    </main>
  );
}
