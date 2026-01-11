import React from "react";
import { useMemo } from "react";
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
  instanceIndex,
} from "three/tsl";
import { useScroll, useTexture } from "@react-three/drei";
import { easeInOutQuad } from "tsl-easings";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

type Props = {
  images: string[];
};

export default function PlaneInstancedMesh({ images }: Props) {
  const data = useScroll();
  const textures = useTexture(images);
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
  //   progress.value = progressValue;

  textures.forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
  });

  const textureArray = useMemo(() => {
    return textures.map((tex) => texture(tex as any, uv()));
  }, [textures]);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      wireframe: false,
    });

    m.colorNode = Fn(() => {
      const instanceId = instanceIndex;
      const textureIndex = instanceId.mod(textureArray.length);
      return textureArray[textureIndex.toVar() as any].sample(uv());
    })();

    m.positionNode = Fn(() => {
      const timeVar = time.toVar();
      let pos = positionLocal.toVar();
      let offset = uv().y.oneMinus().mul(0.4);
      let smoothProgress = progress.sub(offset).div(0.6).clamp(0, 1);
      let center = vec3(0, 0, 0);
      let easedProgress = easeInOutQuad(
        smoothProgress.mul(-Math.PI).mul(0.4) as any
      );

      pos = rotate(pos.sub(center), vec3(easedProgress, 0, 0)).toVar();
      pos = pos.add(center).toVar();

      pos = mix(pos, pos.add(vec3(0, 0, 0)), smoothProgress).toVar();

      //mouse
      return pos;
    })();

    return m;
  }, [progress, mouse, data]);

  useFrame((state) => {
    const { x, y } = state.pointer;
    const { width, height } = state.viewport;
    mouse.value = vec2(x / width, y / height);
    const elapsedTime = state.clock.elapsedTime;
    time.value = elapsedTime;
    progress.value = data.range(0, 1 / 3);
  });

  return (
    <mesh>
      <planeGeometry args={[1, 1, 10, 10]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
