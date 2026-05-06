import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export default function BmoThreeJs({
  onTriangleClick = null,
  onFaceClick = null,
  onLeftArmClick = null,
  onRightArmClick = null,
  onLeftLegClick = null,
  onRightLegClick = null,
  onBodyClick = null,
  screenContent = null,
  mood = 'neutral',
  physicsDrag = { vx: 0, vy: 0 },
}) {
  const mountRef = useRef(null);
  const dragVelRef = useRef({ vx: 0, vy: 0 });

  // Update physics ref on prop change
  useEffect(() => {
    dragVelRef.current = physicsDrag;
  }, [physicsDrag]);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── SCENE & CAMERA ──────────────────────────────────────────────
    const width = 450;
    const height = 550;
    const scene = new THREE.Scene();
    
    // Orthographic or Perspective. Let's use Perspective for depth.
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // ── LIGHTING ────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-10, -10, -15);
    scene.add(backLight);

    // ── MATERIALS ───────────────────────────────────────────────────
    const bodyColor = 0x6fcaa7;
    const outlineColor = 0x075636;
    const screenColor = 0xd7fae2;

    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 });
    const outlineMat = new THREE.MeshStandardMaterial({ color: outlineColor, roughness: 0.8 });
    const screenMat = new THREE.MeshStandardMaterial({ color: screenColor, roughness: 0.3 });

    // ── BMO GROUP (Container for everything) ─────────────────────────
    const bmoGroup = new THREE.Group();
    scene.add(bmoGroup);

    // 1. BODY
    // Dimensions mimicking CSS (14em w x 18.5em h x 10em d)
    // Scale: 1em ~ 0.5 units -> 7w x 9.25h x 5d
    const w = 7.5, h = 10, d = 5;
    
    // Rounded box simulation (using standard BoxGeometry for now, can add edges later)
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bmoGroup.add(bodyMesh);

    // 2. SCREEN & FACE
    const sw = 5.8, sh = 4.4;
    const screenGeo = new THREE.PlaneGeometry(sw, sh);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.8, d / 2 + 0.01);
    bmoGroup.add(screenMesh);

    // Face features
    const eyeGeo = new THREE.CircleGeometry(0.2, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-1.2, 0.2, 0.02);
    screenMesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(1.2, 0.2, 0.02);
    screenMesh.add(rightEye);

    // Mouth
    const curve = new THREE.EllipseCurve(0, -0.2, 0.6, 0.4, 0, Math.PI, false, 0);
    const points = curve.getPoints(20);
    const mouthGeo = new THREE.BufferGeometry().setFromPoints(points);
    const mouthMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const mouth = new THREE.Line(mouthGeo, mouthMat);
    mouth.rotation.x = Math.PI; // Flip to smile
    mouth.position.set(0, 0, 0.02);
    screenMesh.add(mouth);

    // 3. BUTTONS (Front panel)
    // Disc drive slot
    const slotMesh = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 0.2), outlineMat);
    slotMesh.position.set(-0.8, -1.2, d / 2 + 0.05);
    bmoGroup.add(slotMesh);

    // Yellow D-Pad
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
    const dpadGroup = new THREE.Group();
    dpadGroup.position.set(-1.8, -3.0, d / 2 + 0.1);
    const dpadV = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.1, 0.2), yellowMat);
    const dpadH = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 0.2), yellowMat);
    dpadGroup.add(dpadV, dpadH);
    bmoGroup.add(dpadGroup);

    // Triangle button (Cyan)
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x00d8ff, roughness: 0.4 });
    const triGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 3);
    const triBtn = new THREE.Mesh(triGeo, cyanMat);
    triBtn.rotation.x = Math.PI / 2;
    triBtn.rotation.y = Math.PI / 6; // Orient point up
    triBtn.position.set(0.6, -2.5, d / 2 + 0.1);
    bmoGroup.add(triBtn);

    // Round button (Red)
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.4 });
    const roundBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16), redMat);
    roundBtn.rotation.x = Math.PI / 2;
    roundBtn.position.set(2.2, -3.5, d / 2 + 0.1);
    bmoGroup.add(roundBtn);
    
    // Small round button (Green)
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.4 });
    const smallBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), greenMat);
    smallBtn.rotation.x = Math.PI / 2;
    smallBtn.position.set(2.8, -2.5, d / 2 + 0.1);
    bmoGroup.add(smallBtn);

    // Select/Start buttons (Blue)
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0000aa, roughness: 0.4 });
    const selBtn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.2), blueMat);
    selBtn.position.set(-1.8, -4.5, d / 2 + 0.1);
    bmoGroup.add(selBtn);
    
    const startBtn = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.2), blueMat);
    startBtn.position.set(-0.6, -4.5, d / 2 + 0.1);
    bmoGroup.add(startBtn);

    // 4. ARMS & LEGS
    const armMat = new THREE.MeshStandardMaterial({ color: 0x4a8f8e, roughness: 0.6 });
    
    // Left Arm Group (Viewer's right side)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(w / 2 + 0.2, -0.5, 0); // Shoulder joint
    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 3.5, 16), armMat);
    leftArmMesh.position.set(0, -1.75, 0);
    leftArmGroup.add(leftArmMesh);
    
    // Fingers/Hand stub
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), armMat);
    leftHand.position.set(0, -3.5, 0);
    leftArmGroup.add(leftHand);
    bmoGroup.add(leftArmGroup);

    // Right Arm Group (Viewer's left side)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-w / 2 - 0.2, -0.5, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 3.5, 16), armMat);
    rightArmMesh.position.set(0, -1.75, 0);
    rightArmGroup.add(rightArmMesh);
    
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), armMat);
    rightHand.position.set(0, -3.5, 0);
    rightArmGroup.add(rightHand);
    bmoGroup.add(rightArmGroup);

    // Left Leg (Viewer's right)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(1.5, -h / 2, 0); // Hip joint
    const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5, 16), outlineMat);
    leftLegMesh.position.set(0, -1.75, 0);
    leftLegGroup.add(leftLegMesh);
    
    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.2), outlineMat);
    leftFoot.position.set(0, -3.5, 0.3);
    leftLegGroup.add(leftFoot);
    bmoGroup.add(leftLegGroup);

    // Right Leg (Viewer's left)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-1.5, -h / 2, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5, 16), outlineMat);
    rightLegMesh.position.set(0, -1.75, 0);
    rightLegGroup.add(rightLegMesh);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.2), outlineMat);
    rightFoot.position.set(0, -3.5, 0.3);
    rightLegGroup.add(rightFoot);
    bmoGroup.add(rightLegGroup);

    // 5. MOUSE INTERACTION (Right-click rotate)
    let isDraggingBmo = false;
    let prevMouse = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      if (e.button === 2) {
        isDraggingBmo = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e) => {
      if (e.button === 2) {
        isDraggingBmo = false;
      }
    };

    const onPointerMove = (e) => {
      if (isDraggingBmo && e.buttons === 2) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        
        bmoGroup.rotation.y += deltaX * 0.01;
        bmoGroup.rotation.x += deltaY * 0.01;
        
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    // 6. ANIMATION & PHYSICS LOOP
    let rafId;
    const clock = new THREE.Clock();

    // Physics state
    let armLAngle = 0, armLVel = 0;
    let armRAngle = 0, armRVel = 0;
    let legAngle = 0, legVel = 0;

    const STIFFNESS = 0.18;
    const DAMPING = 0.72;
    const MAX_SWING = Math.PI / 4; // ~45 deg
    const VEL_SCALE = 0.05;

    const clamp = (v) => Math.max(-MAX_SWING, Math.min(MAX_SWING, v));

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Idle breathing/hover
      bmoGroup.position.y = Math.sin(t * 2) * 0.15;
      
      // Idle arm sway
      const idleArmL = Math.sin(t * 1.5) * 0.05;
      const idleArmR = Math.sin(t * 1.5 + Math.PI) * 0.05;

      // Spring physics (from window dragging)
      const { vx, vy } = dragVelRef.current;
      const armForce = vy * VEL_SCALE;
      const legForce = vx * VEL_SCALE;

      const accL = -STIFFNESS * armLAngle - (1 - DAMPING) * armLVel + armForce * 0.12;
      const accR = -(STIFFNESS * 0.85) * armRAngle - (1 - DAMPING * 0.95) * armRVel + armForce * 0.14;
      const accLeg = -STIFFNESS * legAngle - (1 - DAMPING) * legVel + legForce * 0.12;

      armLVel += accL; armLAngle = clamp(armLAngle + armLVel);
      armRVel += accR; armRAngle = clamp(armRAngle + armRVel);
      legVel += accLeg; legAngle = clamp(legAngle + legVel);

      // Apply rotations
      leftArmGroup.rotation.x = armLAngle + idleArmL;
      leftArmGroup.rotation.z = 0.1; // Slight outward splay

      rightArmGroup.rotation.x = armRAngle + idleArmR;
      rightArmGroup.rotation.z = -0.1;

      leftLegGroup.rotation.z = -legAngle;
      rightLegGroup.rotation.z = -legAngle;

      renderer.render(scene, camera);
    };

    animate();

    // 7. CLEANUP
    return () => {
      cancelAnimationFrame(rafId);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries/materials
      bodyGeo.dispose(); bodyMat.dispose();
      screenGeo.dispose(); screenMat.dispose();
      // ... (other disposals omitted for brevity, but WebGL context is cleaned up by renderer.dispose)
    };
  }, []);

  return (
    <div 
      className="bmo-three-wrapper"
      style={{
        width: '450px',
        height: '550px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 3D Canvas Container */}
      <div 
        ref={mountRef} 
        className="positioning" // Mimic class used in App.jsx to avoid context menu / drag issues
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab'
        }}
      />
      
      {/* HTML Screen Overlay (Tracks roughly over the 3D screen face) */}
      {screenContent && (
        <div style={{
          position: 'absolute',
          top: '18%', 
          left: '26%',
          width: '48%',
          height: '24%',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          {screenContent}
        </div>
      )}
    </div>
  );
}
