"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { features } from "@/lib/config/features";
import { SceneFallback } from "./scene-fallback";

const SceneCanvas=dynamic(()=>import("./scene-canvas"),{ssr:false,loading:()=>null});
class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void },{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(){this.props.onFailure();}
  render(){return this.state.failed?null:this.props.children;}
}
export function DecorativeScene({ variant }: { variant: "hero" | "map" }) {
  const host=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [activated,setActivated]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(true);
  const [failed,setFailed]=useState(false);
  const [ready,setReady]=useState(false);
  const [flat,setFlat]=useState(false);
  const [pulse,setPulse]=useState(0);
  const onFailure=useCallback(()=>{setFailed(true);setReady(false);},[]);
  const onReady=useCallback(()=>setReady(true),[]);
  useEffect(()=>{
    const element=host.current;
    if(!element || !features.ENABLE_3D_DECORATION) return;
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    const motion=()=>setReducedMotion(media.matches); motion();media.addEventListener("change",motion);
    let inView=false;
    let checked=false;
    const sync=()=>{const active=inView&&!document.hidden;setVisible(active);if(active)setActivated(true);};
    const observer=new IntersectionObserver(entries=>{
      inView=entries[0]?.isIntersecting??false;
      if(inView&&!checked){
        checked=true;
        try {
          const context=document.createElement("canvas").getContext("webgl2");
          if(!context) onFailure();
          context?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { onFailure(); }
      }
      sync();
    },{threshold:.05});
    observer.observe(element);document.addEventListener("visibilitychange",sync);
    return ()=>{observer.disconnect();media.removeEventListener("change",motion);document.removeEventListener("visibilitychange",sync);};
  },[onFailure]);
  const render3D=activated&&!failed&&!flat&&features.ENABLE_3D_DECORATION;
  return <div ref={host} className={`decorative-scene scene-${variant}`} data-scene-state={failed?"fallback":flat?"2d":ready&&render3D?"ready":"loading"}>
    <div className={`scene-poster ${ready&&render3D?"poster-hidden":""}`}><SceneFallback variant={variant} /></div>
    {render3D&&<div className="scene-canvas" aria-hidden="true"><SceneBoundary onFailure={onFailure}><SceneCanvas variant={variant} active={visible} reducedMotion={reducedMotion} pulse={pulse} onReady={onReady} onFailure={onFailure} /></SceneBoundary></div>}
    <div className="scene-controls">
      {variant==="hero"&&ready&&render3D&&<button type="button" className="scene-wave" onClick={()=>setPulse(p=>p+1)} onPointerEnter={()=>setPulse(p=>p+1)} aria-label="Sapa maskot">Sapa! ♡</button>}
      {!failed&&features.ENABLE_3D_DECORATION?<button type="button" className="scene-toggle" aria-pressed={flat} onClick={()=>{setReady(false);setFlat(v=>!v);}}>{flat?"Tampilan 3D":"Tampilan 2D"}</button>:<span className="scene-mode">Tampilan 2D</span>}
    </div>
  </div>;
}
