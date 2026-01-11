import React from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three/webgpu";
import {
  texture,
  uv,
  Fn,
  vec3,
  positionLocal,
  uniform,
  rotate,
  vec2,
  mix,
  sin,
  instanceIndex,
  attribute,
} from "three/tsl";
import { useScroll, useTexture } from "@react-three/drei";
import { easeInOutQuad } from "tsl-easings";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

type Props = {
  imageUrl: string;
  backImageUrl: string;
  instanceCount?: number;
  startDelay?: number;
};

export default function PlaneTextureInstanced({
  imageUrl,
  backImageUrl,
  instanceCount = 20,
  startDelay = 0,
}: Props) {
  const data = useScroll();
  const image = useTexture(imageUrl);
  const backImage = useTexture(backImageUrl);
  const frontMeshRef = useRef<THREE.InstancedMesh>(null);
  const backMeshRef = useRef<THREE.InstancedMesh>(null);

  const { progress: progressValue } = useControls({
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

  let time = uniform(0);
  let mouse = uniform(vec2(0, 0));
  let progress = uniform(0);

  image.colorSpace = THREE.SRGBColorSpace;
  backImage.colorSpace = THREE.SRGBColorSpace;

  // Create instance position attributes
  const instancePositions = useMemo(() => {
    const positions = new Float32Array(instanceCount * 3);
    const gridSize = Math.ceil(Math.sqrt(instanceCount));
    const spacing = 2 * Math.random() + 0.5;

    for (let i = 0; i < instanceCount; i++) {
      const x = (i % gridSize) - (gridSize - 1) / 2;
      const z = Math.floor(i / gridSize) - (gridSize - 1) / 2;
      positions[i * 3] = x * spacing;
      positions[i * 3 + 1] = z * Math.random() * 1.5;
      positions[i * 3 + 2] = z * 0.5;
    }

    return positions;
  }, [instanceCount]);

  // Create instance rotation attributes
  const instanceRotations = useMemo(() => {
    const rotations = new Float32Array(instanceCount);
    for (let i = 0; i < instanceCount; i++) {
      // rotations[i] = (i / instanceCount) * Math.PI * 2;
    }
    return rotations;
  }, [instanceCount]);

  // Create instance scale attributes
  const instanceScales = useMemo(() => {
    const scales = new Float32Array(instanceCount);
    for (let i = 0; i < instanceCount; i++) {
      scales[i] = 0.5;
    }
    return scales;
  }, [instanceCount]);

  // Create instance delays for scroll animation
  const instanceDelays = useMemo(() => {
    const delays = new Float32Array(instanceCount);
    for (let i = 0; i < instanceCount; i++) {
      delays[i] = (i / instanceCount) * 0.5;
    }
    return delays;
  }, [instanceCount]);

  const getPositionNode = () => {
    return Fn(() => {
      const timeVar = time.toVar();
      const instanceId = instanceIndex;

      // Get instance-specific attributes
      const instancePos = attribute("instancePosition", "vec3");
      const instanceRot = attribute("instanceRotation", "float");
      const instanceDelay = attribute("instanceDelay", "float");
      const instanceScale = attribute("instanceScale", "float");

      let pos = positionLocal.toVar();
      pos.z = pos.z.mul(-1.5).toVar();

      // Use instance-specific delay for scroll animation
      const adjustedProgress = progress.sub(instanceDelay).clamp(0, 1);
      let jump = sin(adjustedProgress.mul(10.0));
      let offsetY = uv().y.oneMinus().mul(0.5).toVar();
      let smoothProgress = adjustedProgress.sub(offsetY).div(0.4).clamp(0, 1);
      let center = vec3(0, 0.3, 0);
      let easedProgress = easeInOutQuad(
        smoothProgress.mul(-Math.PI).mul(0.4) as any
      );

      pos = rotate(pos.sub(center), vec3(easedProgress, 0, 0)).toVar();
      pos = rotate(pos.add(center).mul(1.5), vec3(0, 0, 1)).toVar();
      pos = pos.add(center).toVar();

      pos = mix(pos, pos.add(vec3(0, 0, 0)), smoothProgress).toVar();
      pos.z = pos.z.sub(jump).toVar();

      // Apply instance transformations: scale, rotation, then position
      pos = pos.mul(instanceScale).toVar();
      pos = rotate(pos, vec3(0, instanceRot, 0)).toVar();

      // Add time-based animation offset (compute shader-like behavior)
      const instanceIdFloat = instanceId.toVar();
      const animOffsetX = sin(timeVar.mul(0.5).add(instanceIdFloat)).mul(0.2);
      const animOffsetY = sin(timeVar.mul(0.3).add(instanceIdFloat)).mul(0.1);
      const animOffsetZ = sin(timeVar.mul(0.4).add(instanceIdFloat)).mul(0.15);
      pos = pos.add(vec3(animOffsetX, animOffsetY, animOffsetZ)).toVar();

      // Apply instance position
      pos = pos.add(instancePos).toVar();

      return pos;
    })();
  };

  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({
      wireframe: false,
    });

    m.colorNode = Fn(() => {
      return texture(image as any, uv());
    })();

    m.positionNode = getPositionNode();

    return m;
  }, [image, progress, mouse, data]);

  const backMaterial = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      wireframe: false,
    });

    m.colorNode = Fn(() => {
      return texture(backImage as any, uv());
    })();

    m.positionNode = getPositionNode();

    return m;
  }, [backImage, progress, mouse, data]);

  // Create geometry with instance attributes
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1, 100, 100);

    // Add all instance attributes for shader-based positioning
    geo.setAttribute(
      "instancePosition",
      new THREE.InstancedBufferAttribute(instancePositions, 3, false)
    );
    geo.setAttribute(
      "instanceRotation",
      new THREE.InstancedBufferAttribute(instanceRotations, 1, false)
    );
    geo.setAttribute(
      "instanceScale",
      new THREE.InstancedBufferAttribute(instanceScales, 1, false)
    );
    geo.setAttribute(
      "instanceDelay",
      new THREE.InstancedBufferAttribute(instanceDelays, 1, false)
    );

    return geo;
  }, [instancePositions, instanceRotations, instanceScales, instanceDelays]);

  useFrame((state) => {
    const { x, y } = state.pointer;
    const { width, height } = state.viewport;
    mouse.value = vec2(x / width, y / height);
    const elapsedTime = state.clock.elapsedTime;
    time.value = elapsedTime;
    // progress.value = data.range(startDelay, 1 / 3);
  });

  return (
    <group>
      <instancedMesh
        ref={frontMeshRef}
        args={[geometry, material, instanceCount]}
      />
      <instancedMesh
        ref={backMeshRef}
        args={[geometry, backMaterial, instanceCount]}
      />
    </group>
  );
}
