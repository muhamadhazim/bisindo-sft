import { getPublishableSigns } from "./content";

export type Lesson = { id: string; title: string; signId: string; prerequisiteIds: readonly string[] };
export type Unit = { id: string; title: string; description: string; lessonIds: readonly string[] };

export const lessons: readonly Lesson[] = getPublishableSigns().map((sign) => ({
  id: `huruf-${sign.symbol.toLowerCase()}`,
  title: `Huruf ${sign.symbol}`,
  signId: sign.id,
  prerequisiteIds: [],
}));

export const units: readonly Unit[] = [{
  id: "alfabet-awal",
  title: "Kenali bentuk huruf",
  description: "Amati C, L, dan O dari beberapa contoh referensi. Mulai perlahan, satu huruf setiap kali.",
  lessonIds: lessons.map((lesson) => lesson.id),
}];

export const findLesson = (id: string) => lessons.find((lesson) => lesson.id === id);
export const findSign = (id: string) => getPublishableSigns().find((sign) => sign.id === id);
