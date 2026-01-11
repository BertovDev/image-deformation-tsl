import { Html, Scroll, ScrollControls, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Experience } from "./components/Experience";

import * as THREE from "three/webgpu";
import { Leva } from "leva";

function App() {
  return (
    <>
      <Stats />

      <Canvas
        gl={(canvas) => {
          const renderer = new THREE.WebGPURenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance",
          });
          renderer.init().then(() => {
            console.log("Renderer initialized");
          });
          return renderer;
        }}
        className="fixed z-100 inset-0  pointer-events-auto"
        shadows
        camera={{ position: [0, 0, 3], fov: 45 }}
      >
        <Html
          fullscreen
          className="z-100 w-full h-full  pointer-events-none absolute top-0 left-0"
        >
          <div className="absolute flex justify-center   flex-col top-5 left-25 z-100">
            <h2 className="font-bold  text-lg  text-black itali uppercase">
              TSL / Webgpu
            </h2>
            <p className="text-sm "> Image deformation / Intanced</p>
          </div>
          <div
            style={{ width: "2000px" }}
            className="absolute   translate-x-1/2  top-0   right-[50%] h-35 bg-linear-to-b from-[#f8f8f8] to-transparent z-5"
          ></div>
          <div
            style={{ width: "2000px" }}
            className="absolute  translate-x-1/2 bottom-0 right-[50%] h-35 bg-linear-to-t from-[#f8f8f8] to-transparent z-5"
          ></div>
        </Html>
        <color attach="background" args={["#eadfd0"]} />
        <Suspense>
          {/* <ScrollControls pages={3}> */}
          {/* <Scroll> */}
          <Experience />
          <Leva hidden/>
          {/* </Scroll> */}
          {/* </ScrollControls> */}
        </Suspense>
      </Canvas>
    </>
  );
}
export default App;
