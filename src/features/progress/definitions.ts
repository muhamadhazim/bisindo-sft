import { units } from "@/features/curriculum/curriculum";

export const curriculumVersion = "alphabet-v1";

export const achievementDefinitions = [
  { id: "first-sign", title: "Langkah Pertama", description: "Menyelesaikan latihan huruf pertama." },
  { id: "level-1", title: "Penjelajah Level 1", description: "Menyelesaikan kelompok A–F." },
  { id: "level-2", title: "Penjelajah Level 2", description: "Menyelesaikan kelompok G–L." },
  { id: "level-3", title: "Penjelajah Level 3", description: "Menyelesaikan kelompok M–R." },
  { id: "steady-three", title: "Konsisten", description: "Belajar selama tiga hari berturut-turut." },
  { id: "name-speller", title: "Eja Namaku", description: "Menyelesaikan latihan ejaan nama." },
  { id: "alphabet-explorer", title: "Penjelajah Alfabet", description: "Menyelesaikan seluruh alfabet A–Z." },
] as const;

export function completedLevelCount(completedLessonIds: ReadonlySet<string>) {
  let count = 0;
  for (const unit of units) {
    if (!unit.lessonIds.every((lessonId) => completedLessonIds.has(lessonId))) break;
    count++;
  }
  return count;
}

export function isUnitUnlocked(unitIndex: number, completedLessonIds: ReadonlySet<string>) {
  return unitIndex <= completedLevelCount(completedLessonIds);
}

export function normalizeNameSequence(value: string) {
  return [...value.normalize("NFKC").toUpperCase()].filter((character) => character >= "A" && character <= "Z");
}
