import { MascotSticker } from "@/components/mascot-sticker";
import { mapStops } from "./map-layout";

export function SceneFallback({ variant }: { variant: "hero" | "map" }) {
  if(variant==="hero") return <div className="hero-fallback"><svg viewBox="0 0 600 200" className="fallback-ground" aria-hidden="true"><ellipse cx="285" cy="95" rx="220" ry="70" fill="#99c875" /><path d="M65 95q220 135 440 0v22q-230 145-440 0Z" fill="#b0a081" /><ellipse cx="285" cy="86" rx="220" ry="65" fill="#b5dd89" /></svg><MascotSticker className="hero-mascot-static" /></div>;
  return <svg className="map-fallback" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
    <path d={`M${mapStops.map(s=>`${s.x*10},${s.y*7}`).join(" L")}`} fill="none" stroke="#d2b082" strokeWidth="22" strokeDasharray="5 3" />
    {mapStops.map((stop)=><g key={stop.id} transform={`translate(${stop.x*10} ${stop.y*7})`}>
      <ellipse cy="62" rx="160" ry="73" fill="none" stroke="#c9f6f2" strokeWidth="3" />
      <path d="M-150 0v51q150 117 300 0V0" fill="#b1a28c" />
      <path d="m-115 33 9 67m56-53 8 74m105-83-6 68m55-76-6 58" stroke="#cbbb9c" strokeWidth="18" />
      <ellipse rx="150" ry="76" fill="#a4c876" /><ellipse cy="-8" rx="150" ry="70" fill="#b4db89" />
      {[[-106,-27],[89,-42],[107,17]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="M0-12V9" stroke="#9b8056" strokeWidth="9" /><ellipse cy="-37" rx="22" ry="34" fill="#6bb557" /><ellipse cy="-55" rx="17" ry="27" fill="#85c461" /></g>)}
      <ellipse cx="-62" cy="33" rx="18" ry="11" fill="#c4c7aa" /><circle cx="70" cy="24" r="5" fill="#ffe292" />
    </g>)}
  </svg>;
}
