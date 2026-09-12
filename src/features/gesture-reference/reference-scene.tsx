"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "three";
import { OrbitControls } from "@react-three/drei";
import { useEffect } from "react";
import { HandRig } from "./hand-rig";
import type { GestureReference } from "./types";

function SceneEvents({ fail }: { fail: () => void }) {
  const { gl, camera, size, invalidate } = useThree();
  useEffect(() => {
    if (camera instanceof OrthographicCamera) {
      camera.zoom = Math.min(size.width / 4.8, size.height / 4.1);
      camera.updateProjectionMatrix(); invalidate();
    }
  }, [camera, size, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", fail);
    canvas.dataset.referenceReady = "true";
    return () => { canvas.removeEventListener("webglcontextlost", fail); delete canvas.dataset.referenceReady; };
  }, [gl, fail]);
  return null;
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
