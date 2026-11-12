# Prepster

**Walk into the interview knowing the questions.** Upload your CV and the job description. Prepster researches the
company, plans the rounds you're likely to face and writes answers from your real experience. Then you practise.

> **Status: early.** The project was just set up; none of the features below work yet. Progress and the plan are in
> [docs/DESIGN.md](docs/DESIGN.md).

## What it will do

- **Company research, with sources.** What the company builds, its stack, its values and how it interviews for your
  role. Every fact links to the page it came from; what can't be found stays empty.
- **The rounds you'll face.** A screen, the deep round, and a leadership and culture round built on the company's own
  values, planned from its real process where that's public.
- **Answers from your real CV.** Model answers use only what your CV says and are honest about gaps.
- **Practice that adapts.** One question at a time, harder as you get them right.
- **Coding practice in your browser.** For roles that code: a coding test and a timed, multi-level practical, run in a
  sandbox in your browser. Your code never runs on a server.
- **A spoken mock interview** (optional): the interviewer asks out loud, you answer out loud, and you see which points
  you covered.

The interview engine comes from [JobMagnet](https://github.com/pixar634/jobmagnet), a local job-search app by the same
author; Prepster makes it a web app anyone can use.

## Your data and your key

- Your CV and your preps stay in your browser. There are no accounts and no database.
- Prepster runs on your own [Anthropic API key](https://console.anthropic.com), kept in your browser and sent only with
  your own requests. The server never stores or logs it.
- A built-in sample works with no key at all.

## Run it locally

Needs Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # optional: lets the server use your own key, see the comments inside
npm run dev                  # http://localhost:3000
```

Before pushing: `npm run check` (lint with zero warnings, typecheck, build). CI runs the same.

## Stack

Next.js (App Router), React, Tailwind CSS, shadcn/ui. Claude through the official Anthropic SDK.

## Licence

[MIT](LICENSE)
