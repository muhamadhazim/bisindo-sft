import { expect, test } from "@playwright/test";
import { lessons } from "../../features/curriculum/curriculum";
import { completedLevelCount, isLessonUnlocked, isUnitUnlocked, normalizeNameSequence } from "../../features/progress/definitions";

test("level progression follows the four curriculum groups", () => {
  const firstLevel = new Set(lessons.slice(0, 6).map((lesson) => lesson.id));
  expect(completedLevelCount(firstLevel)).toBe(1);
  expect(isUnitUnlocked(0, firstLevel)).toBe(true);
  expect(isUnitUnlocked(1, firstLevel)).toBe(true);
  expect(isUnitUnlocked(2, firstLevel)).toBe(false);
  expect(isLessonUnlocked("huruf-g", firstLevel)).toBe(true);
  expect(isLessonUnlocked("huruf-m", firstLevel)).toBe(false);
});

test("a partial first level does not unlock G-L", () => {
  const incompleteFirstLevel = new Set(lessons.slice(0, 5).map((lesson) => lesson.id));
  expect(completedLevelCount(incompleteFirstLevel)).toBe(0);
  expect(isUnitUnlocked(1, incompleteFirstLevel)).toBe(false);
  expect(isLessonUnlocked("huruf-g", incompleteFirstLevel)).toBe(false);
});

test("name challenge normalizes separators without persisting them", () => {
  expect(normalizeNameSequence("Sinyal-A 12")).toEqual(["S", "I", "N", "Y", "A", "L", "A"]);
});
