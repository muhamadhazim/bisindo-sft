import { getPublishableSigns } from "./content";

export type Lesson = { id: string; title: string; signId: string; prerequisiteIds: readonly string[] };
export type Unit = { id: string; title: string; description: string; lessonIds: readonly string[] };
const signs = getPublishableSigns();
export const lessons: readonly Lesson[] = signs.map(sign => ({
  id: `huruf-${sign.symbol.toLowerCase()}`, title: `Huruf ${sign.symbol}`, signId: sign.id, prerequisiteIds: [],
}));
export const units: readonly Unit[] = ["ABCDEF", "GHIJKL", "MNOPQR", "STUVWXYZ"].map(symbols => ({
  id: `alfabet-${symbols[0]!.toLowerCase()}-${symbols.at(-1)!.toLowerCase()}`,
  title: `Huruf ${symbols[0]}–${symbols.at(-1)}`,
  description: "Amati karakter tangan, coba bentuk diam, lalu lanjut setelah perayaan kecilmu.",
  lessonIds: lessons.filter(lesson => symbols.includes(signs.find(sign => sign.id === lesson.signId)!.symbol)).map(lesson => lesson.id),
}));
export const findLesson = (id: string) => lessons.find(lesson => lesson.id === id);
export const findSign = (id: string) => signs.find(sign => sign.id === id);
export const unitForSign = (id: string) => units.find(unit => unit.lessonIds.some(lessonId => findLesson(lessonId)?.signId === id));
export const findUnit = (id: string): Unit | undefined => id === "alfabet-awal" ? {
  id, title: "Semua huruf A–Z", description: "Pilih huruf untuk memulai sesi kelompoknya.", lessonIds: lessons.map(lesson => lesson.id),
} : units.find(unit => unit.id === id);
