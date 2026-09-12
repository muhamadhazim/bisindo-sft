import type { ThreeElements } from "@react-three/fiber";

export function Tree({ position, scale = 1 }: { position: [number,number,number]; scale?: number }) {
  return <group position={position} scale={scale}>
    <mesh position={[0,.38,0]} castShadow><cylinderGeometry args={[.07,.11,.76,7]} /><meshStandardMaterial color="#9b7651" /></mesh>
    {[{y:.82,r:.4},{y:1.14,r:.32},{y:1.43,r:.21}].map(({y,r})=><mesh key={y} position={[0,y,0]} castShadow><sphereGeometry args={[r,12,10]} /><meshStandardMaterial color={y>1 ? "#87bf54" : "#66a743"} roughness={1} /></mesh>)}
  </group>;
}
export function Island({ radius = 1.8, ...props }: ThreeElements["group"] & { radius?: number }) {
  return <group {...props}>
    <mesh position={[0,-.49,0]} castShadow><cylinderGeometry args={[radius*.96,radius*.69,1.1,11]} /><meshStandardMaterial color="#baaa8c" roughness={1} flatShading /></mesh>
    <mesh position={[0,-.09,0]} castShadow><cylinderGeometry args={[radius,radius*.96,.28,32]} /><meshStandardMaterial color="#a3bd6e" roughness={1} /></mesh>
    <mesh position={[0,.025,0]} receiveShadow><cylinderGeometry args={[radius*.98,radius,.17,40]} /><meshStandardMaterial color="#add57a" roughness={1} /></mesh>
    <mesh position={[.12,.13,0]} rotation={[-Math.PI/2,0,.3]}><torusGeometry args={[radius*.58,.09,6,32,Math.PI*1.55]} /><meshStandardMaterial color="#eee4b9" roughness={1} /></mesh>
    {Array.from({length:7},(_,i)=>{const a=i*2.399;return <mesh key={i} position={[Math.cos(a)*radius*.87,-.5,Math.sin(a)*radius*.85]} scale={[.2,.45,.23]}><dodecahedronGeometry args={[1,0]} /><meshStandardMaterial color={i%2 ? "#c8baa0" : "#a49883"} roughness={1} /></mesh>;})}
    {[[-.85,0,-.48],[-.6,0,.65],[.82,0,-.56]].map((p,i)=><Tree key={i} position={[p[0]!*radius*.85,.12,p[2]!*radius*.85]} scale={.65+i*.09} />)}
    {[0,1,2].map(i=><group key={i} position={[radius*.4+i*.14,.16,radius*.51]}>
      <mesh position={[0,.07,0]}><cylinderGeometry args={[.015,.02,.14,5]} /><meshStandardMaterial color="#4e8f42" /></mesh>
      <mesh position={[0,.17,0]}><sphereGeometry args={[.07,8,6]} /><meshStandardMaterial color={i%2 ? "#fff5cf" : "#ffcb57"} /></mesh>
    </group>)}
    <mesh position={[radius*.68,.19,radius*.05]} scale={[.27,.2,.22]}><dodecahedronGeometry args={[1,0]} /><meshStandardMaterial color="#c2c3aa" /></mesh>
  </group>;
}
