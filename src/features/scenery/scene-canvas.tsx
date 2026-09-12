"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group } from "three";
import { Mascot } from "./mascot";
import { Island, Tree } from "./island";
import { mapStops } from "./map-layout";

function Welcome({ reducedMotion, pulse }: { reducedMotion: boolean; pulse: number }) {
  const group = useRef<Group>(null);
  const remaining = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => { remaining.current = reducedMotion ? 0 : 1.5; invalidate(); }, [reducedMotion, pulse, invalidate]);
  useFrame((_,delta) => {
    if (!group.current || remaining.current <= 0) return;
    remaining.current = Math.max(0,remaining.current-Math.min(delta,.05));
    group.current.rotation.z = Math.sin(remaining.current*6)*.045*remaining.current;
    group.current.position.y = -.8 + Math.sin(remaining.current*Math.PI)*.08;
    invalidate();
  });
  return <group>
    <Island position={[-.25,-1.58,-.3]} rotation={[.22,0,0]} radius={2.3} />
    <Tree position={[-2.15,-1.3,-.45]} scale={1.0} />
    <Tree position={[1.6,-1.2,-1.1]} scale={1.0} />
    <group ref={group} position={[-.32,-.8,.4]} rotation={[0,-.13,0]}><Mascot scale={.98} /></group>
    {[[-2.6,2.6,-2],[1.7,3.3,-2]].map((p,i)=><group key={i} position={[p[0]!,p[1]!,p[2]!]}> {[-.4,0,.4].map((x,j)=><mesh key={x} position={[x,j===1?.1:0,0]} scale={[.45,.23+j*.015,.18]}><sphereGeometry args={[1,16,12]} /><meshStandardMaterial color="#faffff" /></mesh>)}</group>)}
  </group>;
}

function MapWorld() {
  const { size } = useThree();
  const width = size.width/50;
  const height = size.height/50;
  const scale = Math.min(size.width/440,size.height/350);
  const point = (x:number,y:number): [number,number,number] => [(x/100-.5)*width,(.5-y/100)*height,0];
  return <group>
    {mapStops.slice(0,-1).map((stop,i)=>{
      const next=mapStops[i+1]!;
      const from=point(stop.x,stop.y),to=point(next.x,next.y);
      const dx=to[0]-from[0],dy=to[1]-from[1];
      return <group key={stop.id} position={[(from[0]+to[0])/2,(from[1]+to[1])/2,-.35]} rotation={[0,0,Math.atan2(dy,dx)]}>
        {[-1,1].map(side=><mesh key={side} position={[0,side*.23*scale,.04]}><boxGeometry args={[Math.hypot(dx,dy),.035,.04]} /><meshStandardMaterial color="#97724d" /></mesh>)}
        {Array.from({length:20},(_,j)=><mesh key={j} position={[(j/19-.5)*Math.hypot(dx,dy),Math.sin(j/19*Math.PI)*.16,-.03]} rotation={[.25,0,0]}><boxGeometry args={[Math.hypot(dx,dy)/21,.42*scale,.12]} /><meshStandardMaterial color={j%2 ? "#c99c6c" : "#e4bd88"} /></mesh>)}
      </group>;
    })}
    {mapStops.map((stop,i)=><group key={stop.id} position={point(stop.x,stop.y)}>
      <mesh position={[0,-.64*scale,-1.7]} scale={[2.05*scale,.95*scale,1]}><ringGeometry args={[1,1.03,48]} /><meshBasicMaterial color="#edffff" transparent opacity={.6} /></mesh>
      <Island position={[0,-.3*scale,0]} rotation={[.65,-.12,0]} scale={scale} radius={i===1?1.55:1.75} />
    </group>)}
    <Island position={point(89,83)} rotation={[.65,0,0]} scale={scale*.42} />
    <Island position={point(8,76)} rotation={[.65,0,0]} scale={scale*.35} />
  </group>;
}

function Ready({ onReady, onFailure }: { onReady: () => void; onFailure:()=>void }) {
  const { gl } = useThree();
  const reported=useRef(false);
  useFrame(()=>{if(!reported.current){reported.current=true;queueMicrotask(onReady);}});
  useEffect(()=>{
    const canvas=gl.domElement;
    canvas.addEventListener("webglcontextlost",onFailure);
    return ()=>canvas.removeEventListener("webglcontextlost",onFailure);
  },[gl,onFailure]);
  return null;
}

function CameraRig({ variant }: { variant: "hero" | "map" }) {
  const { size }=useThree();
  return <OrthographicCamera makeDefault position={[0,variant==="hero"?.55:0,20]} zoom={variant==="hero"?Math.min(size.width/5.9,size.height/6.15):50} near={.1} far={80} />;
}

export default function SceneCanvas({ variant, active, reducedMotion, pulse, onReady, onFailure }: {
  variant: "hero" | "map"; active:boolean; reducedMotion: boolean; pulse: number; onReady: () => void; onFailure: () => void;
}) {
  return <Canvas orthographic camera={{position:[0,0,20],zoom:variant==="hero"?78:50,near:.1,far:80}} dpr={[1,1.5]} frameloop={active?"demand":"never"} gl={{ antialias:true,alpha:true,powerPreference:"low-power" }} fallback={null}>
    <ambientLight intensity={1.4} />
    <hemisphereLight args={["#effaff","#a6aa7c",1.3]} />
    <directionalLight position={[-5,8,8]} intensity={3.2} color="#fff4df" />
    <directionalLight position={[6,3,-3]} intensity={1.2} color="#c2f7ff" />
    {variant==="hero" ? <Welcome reducedMotion={reducedMotion} pulse={pulse} /> : <MapWorld />}
    <Ready onReady={onReady} onFailure={onFailure} />
    <CameraRig variant={variant} />
  </Canvas>;
}
