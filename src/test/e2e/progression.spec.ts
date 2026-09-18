import { expect, test } from "@playwright/test";
import { lessons } from "../../features/curriculum/curriculum";
import { completedLevelCount, isUnitUnlocked, normalizeNameSequence } from "../../features/progress/definitions";

test("level progression follows the four curriculum groups", () => {
  const firstLevel = new Set(lessons.slice(0, 6).map((lesson) => lesson.id));
  expect(completedLevelCount(firstLevel)).toBe(1);
  expect(isUnitUnlocked(0, firstLevel)).toBe(true);
  expect(isUnitUnlocked(1, firstLevel)).toBe(true);
  expect(isUnitUnlocked(2, firstLevel)).toBe(false);
});

test("name challenge normalizes separators without persisting them", () => {
  expect(normalizeNameSequence("Sinyal-A 12")).toEqual(["S", "I", "N", "Y", "A", "L", "A"]);
});
