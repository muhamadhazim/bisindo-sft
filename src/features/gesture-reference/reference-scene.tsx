"use client";

import { Canvas, useThree } from "@react-three/fiber";

import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useEffect } from "react";
import { HandRig } from "./hand-rig";
import type { GestureReference } from "./types";

function SceneEvents({ fail }: { fail: () => void }) {
  const { gl, size } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", fail);
    canvas.setAttribute("data-reference-ready", "true");
    return () => { canvas.removeEventListener("webglcontextlost", fail); canvas.removeAttribute("data-reference-ready"); };
  }, [gl, fail]);
  return <OrthographicCamera makeDefault position={[0, 0, 8]} zoom={Math.min(size.width / 4.8, size.height / 4.1)} near={.1} far={30} />;
}

export default function ReferenceScene({ pose, angle, fail }: { pose: GestureReference; angle: number; fail: () => void }) {
  return <Canvas orthographic camera={{ position: [0, 0, 8], zoom: 85, near: .1, far: 30 }} dpr={[1, 1.5]} frameloop="demand" gl={{ powerPreference: "low-power", antialias: true }} fallback={null}>
    <color attach="background" args={["#f0fbf5"]} />
    <ambientLight intensity={1.8} /><directionalLight position={[-3, 5, 6]} intensity={2.3} />
    <group rotation={[0, angle, 0]}>{pose.hands.map(hand => <HandRig key={hand.side} hand={hand} />)}</group>
    <OrbitControls key={angle} enablePan={false} enableZoom={false} minAzimuthAngle={-.4} maxAzimuthAngle={.4} minPolarAngle={1.3} maxPolarAngle={1.8} enableDamping={false} />
    <SceneEvents fail={fail} />
  </Canvas>;
}
