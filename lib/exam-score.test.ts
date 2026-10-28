import { describe, expect, it } from "vitest";
import { blankFor, hasMismatch, netOf, suggestedScore, totalsOf } from "./exam-score";

describe("netOf", () => {
  it("applies the LGS rule (3 wrong cancel 1 correct)", () => {
    expect(netOf(15, 3, 3)).toBe(14);
  });
  it("applies the 4-wrong rule", () => {
    expect(netOf(15, 4, 4)).toBe(14);
  });
  it("ignores wrong answers when there is no penalty", () => {
    expect(netOf(15, 4, 0)).toBe(15);
  });
  it("rounds to two decimals", () => {
    expect(netOf(10, 1, 3)).toBe(9.67);
  });
});

describe("hasMismatch", () => {
  it("is false when the question count is unknown", () => {
    expect(hasMismatch({ correct: 3, wrong: 1, blank: 0 })).toBe(false);
  });
  it("flags totals that do not add up to the question count", () => {
    expect(hasMismatch({ correct: 15, wrong: 3, blank: 1, questions: 20 })).toBe(true);
    expect(hasMismatch({ correct: 15, wrong: 3, blank: 2, questions: 20 })).toBe(false);
  });
});

describe("blankFor", () => {
  it("derives blanks from the question count", () => {
    expect(blankFor({ correct: 12, wrong: 5, blank: 0, questions: 20 })).toBe(3);
  });
  it("never goes negative", () => {
    expect(blankFor({ correct: 15, wrong: 10, blank: 0, questions: 20 })).toBe(0);
  });
  it("keeps the typed blank when the question count is unknown", () => {
    expect(blankFor({ correct: 12, wrong: 5, blank: 2 })).toBe(2);
  });
});

describe("totalsOf and suggestedScore", () => {
  const subjects = [
    { correct: 15, wrong: 3, blank: 2, questions: 20 },
    { correct: 10, wrong: 6, blank: 4, questions: 20 },
  ];
  it("adds up every subject", () => {
    expect(totalsOf(subjects, 3)).toEqual({ correct: 25, wrong: 9, blank: 6, questions: 40, net: 22 });
  });
  it("suggests net / questions × 100", () => {
    expect(suggestedScore(subjects, 3)).toBe(55);
  });
  it("suggests nothing for an empty exam and never a negative score", () => {
    expect(suggestedScore([{ correct: 0, wrong: 0, blank: 0 }], 3)).toBeNull();
    expect(suggestedScore([{ correct: 0, wrong: 9, blank: 1, questions: 10 }], 3)).toBe(0);
  });
});
