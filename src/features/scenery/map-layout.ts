import { units } from "@/features/curriculum/curriculum";

// Four group anchors, shared by semantic links, SVG and decorative 3D.
const anchors = [{ x: 26, y: 30 }, { x: 74, y: 42 }, { x: 27, y: 64 }, { x: 73, y: 81 }];
export const mapStops = units.map((unit, index) => ({
  ...anchors[index]!, id: unit.id, href: `/learn/${unit.id}`, symbol: unit.title.replace("Huruf ", ""), title: unit.title,
}));
