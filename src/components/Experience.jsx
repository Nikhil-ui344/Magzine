import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useAtom } from "jotai";
import { Book } from "./Book";
import { currentViewAtom } from "./UI";

export const Experience = () => {
  const [currentView] = useAtom(currentViewAtom);

  return (
    <>
      {/* Only show book on home page */}
      {currentView === 'home' && (
        <>
          <Float
            rotation-x={-Math.PI / 4}
            floatIntensity={1}
            speed={2}
            rotationIntensity={2}
          >
            <Book />
          </Float>
          <OrbitControls />
          <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial transparent opacity={0.2} />
          </mesh>
        </>
      )}
      <Environment preset="studio"></Environment>
      <directionalLight
        position={[2, 5, 2]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
    </>
  );
};
