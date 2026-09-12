import { lessons, findSign } from "@/features/curriculum/curriculum";

// Screen-space anchors are shared by DOM links, SVG fallback and 3D scenery.
export const mapStops = lessons.map((lesson, index) => {
  const anchors = [{ x: 26, y: 35 }, { x: 74, y: 43 }, { x: 43, y: 76 }];
  const anchor = anchors[index % anchors.length]!;
  return { ...anchor, id: lesson.id, href: `/lesson/${lesson.id}`, symbol: findSign(lesson.signId)?.symbol ?? "", title: lesson.title };
});
