import { describe, expect, it } from "vitest";
import { afterMark, newDeck, pick } from "../deck";

const qs = [{ level: "basic" }, { level: "basic" }, { level: "intermediate" }, { level: "advanced" }] as const;

describe("the adaptive deck", () => {
  it("starts at basic and serves the nearest difficulty to the target", () => {
    expect(pick([...qs], [], 0)).toBe(0);
    expect(pick([...qs], [0], 0)).toBe(1);
    expect(pick([...qs], [0, 1], 0)).toBe(2); // no basic left: the nearest to basic
    expect(pick([...qs], [], 2)).toBe(3);
  });

  it("returns -1 when everything has been shown", () => {
    expect(pick([...qs], [0, 1, 2, 3], 1)).toBe(-1);
  });

  it("raises the target after two 'got it' in a row, and not before", () => {
    const one = afterMark(newDeck(), "got");
    expect(one.shift).toBe(0);
    expect(one.deck.streak).toBe(1);
    const two = afterMark(one.deck, "got");
    expect(two.shift).toBe(1);
    expect(two.deck).toMatchObject({ target: 1, streak: 0 });
  });

  it("never goes above advanced or below basic", () => {
    let d = { target: 2, streak: 1, order: [] as number[] };
    expect(afterMark(d, "got").shift).toBe(0);
    d = { target: 0, streak: 1, order: [] };
    const r = afterMark(d, "again");
    expect(r.shift).toBe(0);
    expect(r.deck.streak).toBe(0);
  });

  it("lowers the target and resets the streak on 'review again'", () => {
    const r = afterMark({ target: 2, streak: 1, order: [] }, "again");
    expect(r).toMatchObject({ shift: -1, deck: { target: 1, streak: 0 } });
  });
});
