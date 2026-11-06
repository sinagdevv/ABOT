import { describe, expect, it } from "vitest";
import { fromStroops, toStroops } from "../src/index";

describe("stroops conversion", () => {
  it("round-trips exact decimal amounts with no floating point", () => {
    expect(toStroops("2.5")).toBe(25_000_000n);
    expect(fromStroops(25_000_000n)).toBe("2.5");
    expect(toStroops("100")).toBe(1_000_000_000n);
    expect(fromStroops(1_000_000_000n)).toBe("100");
  });
});
