export type Level = "basic" | "intermediate" | "advanced";
export type Kind = "concept" | "code" | "design" | "scenario" | "behavioural" | "managerial" | "culture";
export type Lang = "python" | "javascript";

export const LEVELS: Level[] = ["basic", "intermediate", "advanced"];
/** Questions answered by talking: these carry a "say" answer in the candidate's own words. */
export const SAY_KINDS: Kind[] = ["behavioural", "culture", "managerial", "scenario", "concept"];

export interface Question {
  q: string;
  level: Level;
  kind: Kind;
  /** What the interviewer is checking. */
  why: string;
  /** The points a strong answer covers, in the order to say them. */
  answer: string[];
  say?: string;
  code?: string;
  followUps: string[];
  pitfalls: string[];
  /** URL the question comes from; empty when it doesn't come from the research. */
  source?: string;
}

export interface Round {
  id: string;
  name: string;
  format: string;
  decides: string;
  questions: Question[];
}

export interface Sourced {
  name: string;
  what: string;
  /** Always a page that was read. Research without one is dropped before it gets here. */
  source?: string;
}

export interface Prep {
  /** True for the built-in sample: invented people and company, so there are no source links. */
  sample: boolean;
  company: string;
  role: string;
  candidate: string;
  overview: string;
  research: { summary: string; products: Sourced[]; values: Sourced[]; stack: string[]; process: Sourced[] };
  needsCoding: boolean;
  rounds: Round[];
}

/** One call in a practical test: [method, [args]]. */
export type Op = [string, unknown[]];
export interface PracticalTest {
  name: string;
  ops: Op[];
  expected: unknown[];
}
export interface PracticalLevel {
  level: number;
  spec: string;
  visible: PracticalTest[];
  hidden: PracticalTest[];
}
export interface Practical {
  title: string;
  class: string;
  minutes: number;
  intro: string;
  levels: PracticalLevel[];
  starter: Record<Lang, string>;
  solution: Record<Lang, string>;
  complexity: string;
}

/** What the sandbox returns for one test: the result of every call, in order. */
export interface RunRow {
  ok: boolean;
  out?: unknown[];
  error?: string;
  ms?: number;
  stdout?: string;
}
export type RunReply = { id: number; results: RunRow[] } | { id: number; fatal: string };
