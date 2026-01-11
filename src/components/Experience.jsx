import { Environment, OrbitControls } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import PlaneTexture from "./PlaneTexture";
import PlaneTextureInstanced from "./PlaneTextureInstanced";
import { useRef } from "react";
extend({
  MeshBasicNodeMaterial: THREE.MeshBasicNodeMaterial,
  MeshStandardNodeMaterial: THREE.MeshStandardNodeMaterial,
});

export const Experience = () => {
  // Calculate positions based on grid logic from PlaneTextureInstanced
  const instanceCount = 20; // Number of planes
  const gridSize = Math.ceil(Math.sqrt(instanceCount));
  const spacing = 1.5; // Fixed spacing instead of random
  const mouseRef = useRef(new THREE.Vector2(1000, -1000));
  const { camera } = useThree();

  const planes = [];
  const images = [
    { front: "/images/1.jpg", back: "/images/2.jpg" },
    { front: "/images/2.jpg", back: "/images/3.jpg" },
    { front: "/images/3.jpg", back: "/images/4.jpg" },
    { front: "/images/4.jpg", back: "/images/5.jpg" },
    { front: "/images/5.jpg", back: "/images/6.jpg" },
    { front: "/images/6.jpg", back: "/images/7.jpg" },
    { front: "/images/7.jpg", back: "/images/1.jpg" },
  ];

  for (let i = 0; i < instanceCount; i++) {
    const x = (i % gridSize) - (gridSize - 1) / 2;
    const z = Math.floor(i / gridSize) - (gridSize - 1) / 2;

    // Calculate position similar to PlaneTextureInstanced
    const posX = x * spacing;
    const posY = z * 0.8; // Simplified Y position
    const posZ = z * 1;

    const imageIndex = i % images.length;
    const startDelay = (i / instanceCount) * 0.5;

    planes.push({
      id: i,
      imageUrl: images[imageIndex].front,
      backImageUrl: images[imageIndex].back,
      position: [posX, posY, posZ],
      startDelay,
      rotationDirection: Math.random() > 0.5 ? 1 : -1,
    });
  }

  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state) => {
    mouseRef.current.x = state.pointer.x;
    mouseRef.current.y = state.pointer.y;

    targetPosition.current.set(
      mouseRef.current.x * 0.1,
      camera.position.y,
      camera.position.z
    );
    camera.position.lerp(targetPosition.current, 0.1);
  });

  return (
    <>
      <directionalLight position={[5, 5, -5]} intensity={0.5} castShadow />
      <Environment preset="sunset" environmentIntensity={0.5} />
      {/* <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} /> */}

      {/* Instanced version using WebGPU compute instances */}
      {/* <PlaneTextureInstanced
        imageUrl="/images/1.jpg"
        backImageUrl="/images/2.jpg"
        instanceCount={25}
        startDelay={0}
      /> */}

      {/* Planes positioned in grid layout with unique IDs for animation */}
      {planes.map((plane) => (
        <PlaneTexture
          key={plane.id}
          imageUrl={plane.imageUrl}
          backImageUrl={plane.backImageUrl}
          position={plane.position}
          startDelay={plane.startDelay}
          uniqueId={plane.id}
          rotationDirection={plane.rotationDirection}
        />
      ))}
    </>
  );
};
