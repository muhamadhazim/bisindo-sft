import { RoundedBox } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type Vec3 = [number, number, number];
function Blob({ position, scale, color, rotation }: { position: Vec3; scale: Vec3; color: string; rotation?: Vec3 }) {
  return <mesh position={position} scale={scale} rotation={rotation} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={color} roughness={.78} /></mesh>;
}
function Finger({ position, length, angle = 0 }: { position: Vec3; length: number; angle?: number }) {
  return <mesh position={position} rotation={[0, 0, angle]} castShadow><capsuleGeometry args={[.22, length, 8, 20]} /><meshStandardMaterial color="#ffc391" roughness={.75} /></mesh>;
}

/** Decorative original character, deliberately separate from gesture references. */
export function Mascot(props: ThreeElements["group"]) {
  return <group {...props}>
    <Blob position={[0,1.04,-.18]} scale={[.83,.83,.42]} color="#19535a" />
    <Blob position={[-.35,-.03,0]} scale={[.27,.55,.28]} color="#24384b" rotation={[0,0,-.23]} />
    <Blob position={[.34,-.05,0]} scale={[.27,.56,.28]} color="#24384b" rotation={[0,0,.16]} />
    {[-1,1].map(side => <group key={side} position={[side*.43,-.47,.19]} rotation={[0,side*-.16,0]}>
      <RoundedBox args={[.58,.27,.84]} radius={.12} smoothness={4} castShadow><meshStandardMaterial color="#fff7e8" /></RoundedBox>
      <RoundedBox args={[.59,.1,.84]} radius={.045} position={[0,-.12,0]} smoothness={3}><meshStandardMaterial color="#dbe6d8" /></RoundedBox>
      <Blob position={[0,.12,-.1]} scale={[.24,.15,.25]} color="#099670" />
      {[0,.12,.24].map(z => <mesh key={z} position={[0,.14,z]} rotation={[0,0,Math.PI/2]}><capsuleGeometry args={[.018,.26,3,8]} /><meshStandardMaterial color="#fff8e9" /></mesh>)}
    </group>)}
    <Blob position={[0,.79,0]} scale={[.77,.83,.48]} color="#00996c" />
    <Blob position={[0,.53,.4]} scale={[.44,.27,.1]} color="#00875f" />
    <Blob position={[-.87,1.06,.02]} scale={[.27,.52,.28]} color="#00a477" rotation={[0,0,-.68]} />
    <Blob position={[.86,.86,.02]} scale={[.26,.46,.26]} color="#008e65" rotation={[0,0,.77]} />
    <Blob position={[-1.1,1.38,.11]} scale={[.27,.3,.24]} color="#ffc391" />
    <Blob position={[1.09,.64,.12]} scale={[.27,.28,.24]} color="#ffc391" />
    <mesh position={[0,1.43,.01]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.48,.16,12,32]} /><meshStandardMaterial color="#007f59" /></mesh>
    {[-1,1].map(side=><mesh key={side} position={[side*.26,1.02,.46]} rotation={[0,0,side*.1]}><capsuleGeometry args={[.034,.5,4,8]} /><meshStandardMaterial color="#fffbe8" /></mesh>)}
    <Blob position={[.46,.91,.38]} scale={[.08,.11,.025]} color="#ecfff5" />
    <group position={[0,2.13,.05]} rotation={[0,0,-.08]}>
      <Blob position={[0,0,0]} scale={[.86,.81,.37]} color="#ffc391" />
      <Finger position={[-.68,.83,0]} length={.68} angle={.3} />
      <Finger position={[-.22,1.14,0]} length={1.04} angle={.08} />
      <Finger position={[.26,1.06,0]} length={.94} angle={-.12} />
      <Finger position={[.68,.78,0]} length={.64} angle={-.3} />
      <Finger position={[-.9,.08,.03]} length={.36} angle={.76} />
      {[-1,1].map(side=><group key={side}>
        <Blob position={[side*.34,.1,.344]} scale={[.215,.285,.075]} color="#fffefa" />
        <Blob position={[side*.32,.09,.408]} scale={[.137,.195,.049]} color="#242832" />
        <Blob position={[side*.32-.037,.166,.448]} scale={[.048,.063,.015]} color="white" />
        <Blob position={[side*.58,-.19,.3]} scale={[.15,.087,.036]} color="#f59382" />
        <Blob position={[side*.34,.48,.305]} scale={[.19,.055,.045]} color="#6e4634" rotation={[0,0,side*-.14]} />
      </group>)}
      <Blob position={[0,-.07,.398]} scale={[.082,.069,.068]} color="#f2a375" />
      <Blob position={[0,-.35,.34]} scale={[.245,.235,.049]} color="#6b302d" />
      <Blob position={[.025,-.465,.384]} scale={[.139,.089,.018]} color="#f68787" />
      <Blob position={[-.02,-.21,.385]} scale={[.177,.04,.021]} color="#fffaf0" />
    </group>
  </group>;
}
