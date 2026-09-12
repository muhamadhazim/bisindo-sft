import { useEffect, useMemo } from "react";
import { Vector3, Quaternion } from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import type { GestureHand, PosePoint } from "./types";

const chains = [[0, 1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];

function Bone({ from, to, radius, color }: { from: PosePoint; to: PosePoint; radius: number; color: string }) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const delta = b.clone().sub(a);
  const center = a.clone().add(b).multiplyScalar(.5);
  const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), delta.clone().normalize());
  return <group>
    <mesh position={center} quaternion={orientation}><cylinderGeometry args={[radius * .94, radius, delta.length(), 12]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
    <mesh position={to}><sphereGeometry args={[radius * .94, 12, 10]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
  </group>;
}

export function HandRig({ hand }: { hand: GestureHand }) {
  const palm = useMemo(() => new ConvexGeometry([0, 1, 5, 9, 13, 17].flatMap(i => [-.055, .055].map(z => {
    const p = hand.joints[i]!; return new Vector3(p[0], p[1], p[2] + z);
  }))), [hand]);
  useEffect(() => () => palm.dispose(), [palm]);
  const color = hand.side === "RIGHT" ? "#ffc391" : "#ffd7ad";
  const wrist = hand.joints[0]!;
  return <group>
    <mesh geometry={palm}><meshStandardMaterial color={color} roughness={.8} /></mesh>
    {chains.flatMap(chain => chain.slice(1).map((end, i) => <Bone key={end} from={hand.joints[chain[i]!]!} to={hand.joints[end]!} radius={i === 0 ? .105 : .085} color={color} />))}
    <group position={[wrist[0], wrist[1] - .12, wrist[2] + .03]}>
      <mesh><boxGeometry args={[.38, .26, .17]} /><meshStandardMaterial color="#007857" /></mesh>
      {[-.075, .075].map(x => <mesh key={x} position={[x, .03, .095]}><sphereGeometry args={[.024, 10, 8]} /><meshBasicMaterial color="white" /></mesh>)}
      <mesh position={[0, -.055, .095]} rotation={[0, 0, Math.PI]}><torusGeometry args={[.05, .01, 5, 12, Math.PI]} /><meshBasicMaterial color="white" /></mesh>
    </group>
  </group>;
}
