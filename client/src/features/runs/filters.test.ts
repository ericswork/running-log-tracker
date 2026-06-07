import { describe, it, expect } from "vitest";
import {
  defaultFilterState,
  isFilterActive,
  noTypesSelected,
  toApiFilters,
} from "./filters";
import type { RunType } from "@/api/runs";

describe("toApiFilters", () => {
  it("omits type when all types are selected (the default)", () => {
    expect(toApiFilters(defaultFilterState).type).toBeUndefined();
  });

  it("passes the selected subset of types", () => {
    const state = {
      ...defaultFilterState,
      selectedTypes: ["Easy", "Tempo"] as RunType[],
    };
    expect(toApiFilters(state).type).toEqual(["Easy", "Tempo"]);
  });

  it("parses distance strings to numbers and blanks to undefined", () => {
    const r = toApiFilters({
      ...defaultFilterState,
      minDistanceKm: "5",
      maxDistanceKm: "  ",
    });
    expect(r.minDistanceKm).toBe(5);
    expect(r.maxDistanceKm).toBeUndefined();
  });

  it("passes date bounds through", () => {
    const r = toApiFilters({
      ...defaultFilterState,
      from: "2026-06-01",
      to: "2026-06-07",
    });
    expect(r.from).toBe("2026-06-01");
    expect(r.to).toBe("2026-06-07");
  });
});

describe("isFilterActive", () => {
  it("is false for the default state", () => {
    expect(isFilterActive(defaultFilterState)).toBe(false);
  });

  it("is true when a run-type subset is selected", () => {
    expect(
      isFilterActive({ ...defaultFilterState, selectedTypes: ["Easy"] }),
    ).toBe(true);
  });

  it("is true when a distance bound is set", () => {
    expect(isFilterActive({ ...defaultFilterState, minDistanceKm: "5" })).toBe(
      true,
    );
  });
});

describe("noTypesSelected", () => {
  it("is true only when zero types are selected", () => {
    expect(noTypesSelected(defaultFilterState)).toBe(false);
    expect(noTypesSelected({ ...defaultFilterState, selectedTypes: [] })).toBe(
      true,
    );
  });
});
