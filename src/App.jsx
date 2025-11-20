import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import Auth from "./components/Auth";

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <UI />
          <Loader />
          <Canvas shadows camera={{
              position: [-0.5, 1, window.innerWidth > 800 ? 4 : 9],
              fov: 45,
            }}>
            <group position-y={0}>
              <Suspense fallback={null}>
                <Experience />
              </Suspense>
            </group>
          </Canvas>
        </>
      } />
      <Route path="/admin" element={<Auth />} />
    </Routes>
  );
}

export default App;
