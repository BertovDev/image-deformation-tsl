import React, { useState } from "react";
import { useMemo, useRef, useCallback } from "react";
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
} from "three/tsl";
import { useTexture } from "@react-three/drei";
import { easeInOutQuad } from "tsl-easings";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import gsap from "gsap";

type Props = {
  imageUrl: string;
  backImageUrl: string;
  position: [number, number, number];
  startDelay: number;
  uniqueId?: number;
  rotationDirection?: -1 | 1;
};
export default function PlaneTexture({
  imageUrl,
  backImageUrl,
  position,
  startDelay,
  uniqueId = 0,
  rotationDirection = 1,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const image = useTexture(imageUrl);
  const backImage = useTexture(backImageUrl);
  const { progress: progressValue } = useControls({
    progress: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
    },
  });

  // Track progress value for GSAP animation
  const progressRef = useRef({ value: 0 });
  const animationRef = useRef<gsap.core.Tween | null>(null);

  let time = uniform(0);
  let mouse = uniform(vec2(0, 0));
  let progress = uniform(0);
  let uDirection = uniform(rotationDirection);
  let uniqueIdUniform = uniform(uniqueId);

  image.colorSpace = THREE.SRGBColorSpace;

  const getPositionNode = () => {
    return Fn(() => {
      const timeVar = time.toVar();
      // Use uniqueId to create different animation offset for each plane
      const instanceIdFloat = uniqueIdUniform.toVar();
      let pos = positionLocal.toVar();
      pos.z = pos.z.mul(-1.5).toVar();
      let jump = sin(progress.mul(10.0));
      let offsetY = uv().y.oneMinus().mul(0.2).toVar();
      let smoothProgress = progress.sub(offsetY).div(0.4).clamp(0, 1);
      let center = vec3(0, 0, -0.1);
      let easedProgress = easeInOutQuad(
        smoothProgress.mul(-Math.PI).mul(0.4) as any
      );

      easedProgress = easedProgress.mul(uDirection as any);

      pos = rotate(pos.sub(center), vec3(easedProgress, 0, 0)).toVar();
      pos = rotate(pos.add(center).mul(1.5), vec3(0, 0, -0.5)).toVar();
      pos = pos.add(center).toVar();

      pos = mix(pos, pos.add(vec3(0, 0, 0)), smoothProgress).toVar();

      // Add time-based animation offset (different for each plane based on uniqueId)
      const animateOffset = sin(timeVar.mul(0.7).add(instanceIdFloat)).mul(0.2);
      const animateOffsetY = sin(timeVar.mul(0.5).add(instanceIdFloat)).mul(
        0.1
      );
      const animateOffsetZ = sin(timeVar.mul(0.5).add(instanceIdFloat)).mul(
        0.15
      );
      pos = pos
        .add(vec3(animateOffset, animateOffsetY, animateOffsetZ))
        .toVar();

      pos.z = pos.z.sub(jump).mul(0.4).toVar();

      return pos;
    })();
  };

  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({
      //   side: THREE.DoubleSide,
      wireframe: false,
    });

    m.colorNode = Fn(() => {
      return texture(image as any, uv());
    })();

    m.positionNode = getPositionNode();
    //mouse
    return m;
  }, [progress, mouse, uniqueId]);

  const backMaterial = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      wireframe: false,
    });

    m.colorNode = Fn(() => {
      return texture(backImage as any, uv());
    })();

    m.positionNode = getPositionNode();
    // like this

    return m;
  }, [backImage, progress, mouse, uniqueId]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();

    // Kill any existing animation
    if (animationRef.current) {
      animationRef.current.kill();
    }

    // Animate progress from current value to 1
    animationRef.current = gsap.to(progressRef.current, {
      value: 1,
      duration: 2,
      ease: "power2.inOut",
    });
  }, []);

  const handleOver = useCallback(
    (e: any) => {
      e.stopPropagation();
      setIsHovered(true);

      animationRef.current = gsap.to(progressRef.current, {
        value: !isHovered ? 0.3 : 0,
        duration: 1.5,
        ease: "power2.inOut",
      });
    },
    [isHovered]
  );

  const handleOut = useCallback(
    (e: any) => {
      e.stopPropagation();

      if (!isHovered) {
        animationRef.current = gsap.to(progressRef.current, {
          value: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }
    },
    [isHovered]
  );

  useFrame((state) => {
    const { x, y } = state.pointer;
    const { width, height } = state.viewport;
    mouse.value = vec2(x / width, y / height);
    const elapsedTime = state.clock.elapsedTime;
    time.value = elapsedTime;

    // Update progress uniform from animated value
    progress.value = progressRef.current.value;
  });

  return (
    <group
      position={position}
      scale={0.5}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        // document.body.style.cursor = "pointer";
        // handleOver(e);
        // setIsHovered(true);

        // animationRef.current = gsap.to(progressRef.current, {
        //   value: 0.3,
        //   duration: 1,
        //   ease: "power2.inOut",
        // });
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        // if (!isHovered) return;
        // // handleOver(e);

        // animationRef.current = gsap.to(progressRef.current, {
        //   value: 0,
        //   duration: 0.7,
        //   ease: "power2.inOut",
        // });
      }}
    >
      <mesh>
        <planeGeometry args={[1, 1.5, 100, 100]} />
        <primitive object={material} attach="material" />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[1, 1.5, 100, 100]} />
        <primitive object={backMaterial} attach="material" />
      </mesh>
    </group>
  );
}
