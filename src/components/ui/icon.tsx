import type { CSSProperties } from "react";

export type IconName = "hand" | "home" | "book" | "camera" | "arrow" | "leaf" | "shield" | "spark" | "lock" | "check" | "heart";
const paths: Record<IconName, string> = {
  hand: "M8 13V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-2a1.5 1.5 0 0 1 3 0v5c0 4-2.5 7-7 7-3 0-5-1.5-6.5-4L4 13a1.6 1.6 0 0 1 2.5-2L9 14m3 2 2 2 3-4",
  home: "m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9",
  book: "M12 5C8 2 4 3 3 4v15c3-2 6-1 9 1 3-2 6-3 9-1V4c-3-2-6-1-9 1v15M6 8h3m-3 4h3m6-4h3m-3 4h3",
  camera: "M8 6 9 3h6l1 3h4a2 2 0 0 1 2 2v11H2V8a2 2 0 0 1 2-2h4m8 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  leaf: "M20 3C8 1 2 7 5 15s17 6 15-12ZM4 21l11-12",
  shield: "m12 2 9 4v6c0 5-6 9-9 10-3-1-9-5-9-10V6l9-4Zm-4 9 3 3 5-6",
  spark: "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z",
  lock: "M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10m7 5v2",
  check: "m5 12 4 4L19 6",
  heart: "M12 21S1 14 2 7c1-6 8-5 10-1 2-4 9-5 10 1 1 7-10 14-10 14Z",
};
export function Icon({ name, size = 22, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
