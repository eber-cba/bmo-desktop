import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export default function BmoThreeJs({
  onDoubleClick = null,
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
    const width = 350; // Lienzo compacto para no chocar con el borde de la ventana
    const height = 450; 
    const scene = new THREE.Scene();
    
    // Orthographic or Perspective. Let's use Perspective for depth.
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 24); // Cámara mucho más cerca para que BMO sea masivo

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
    // Hack para Electron/Windows: usar blanco transparente en lugar de negro para evitar el halo gris
    renderer.setClearColor(0xffffff, 0); 
    renderer.setClearAlpha(0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Forzar que el elemento HTML del canvas no tenga NINGÚN fondo ni borde
    renderer.domElement.style.backgroundColor = 'transparent';
    renderer.domElement.style.border = 'none';
    renderer.domElement.style.outline = 'none';
    renderer.domElement.style.boxShadow = 'none';
    renderer.domElement.style.opacity = '0.999'; // Hack adicional para forzar recomposición limpia
    
    mountRef.current.appendChild(renderer.domElement);

    // ── LIGHTING ────────────────────────────────────────────────────
    // Iluminación plana y brillante tipo juguete
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4); // Incrementado para mayor brillo global
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3); // Mayor contraste frontal
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, -10, -15);
    scene.add(backLight);

    // ── MATERIALS ───────────────────────────────────────────────────
    // Colores más fieles a la referencia (verde menta brillante)
    const bodyColor = 0x6be0bd; // Aclarado para que se vea mucho más vivo y menos apagado
    const darkSlot = 0x1c3831;
    const screenColor = 0xeafaf1;

    // Usamos Lambert para un look más plano y "cartoon"
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: darkSlot });
    const screenMat = new THREE.MeshLambertMaterial({ color: screenColor });

    // ── BMO GROUP (Container for everything) ─────────────────────────
    const bmoGroup = new THREE.Group();
    scene.add(bmoGroup);

    // 1. BODY
    const w = 7.5, h = 10, d = 5;
    
    // RoundedBox para los bordes suaves como en la referencia
    const bodyGeo = new RoundedBoxGeometry(w, h, d, 6, 0.4);
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
    const slotMesh = new THREE.Mesh(new RoundedBoxGeometry(3.5, 0.3, 0.2, 2, 0.1), darkMat);
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

    // ── SIDE DETAILS (B M O & Speakers) ─────────────────────────
    const createSideDetails = (sideMultiplier) => {
      const sideGroup = new THREE.Group();
      const letterMat = new THREE.MeshLambertMaterial({ color: darkSlot });
      const speakerMat = new THREE.MeshBasicMaterial({ color: darkSlot }); // Dark inside
      
      // Configuración de relieve para que parezca una fuente de alta calidad
      const extrudeSettings = { 
        depth: 0.1, 
        bevelEnabled: true, 
        bevelSegments: 3, 
        steps: 1, 
        bevelSize: 0.03, 
        bevelThickness: 0.03 
      };

      // "O" (Forma extruida para que haga juego con el relieve del resto)
      const oShape = new THREE.Shape();
      oShape.absarc(0, 0, 0.45, 0, Math.PI * 2, false);
      const oHole = new THREE.Path();
      oHole.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
      oShape.holes.push(oHole);
      const geoO = new THREE.ExtrudeGeometry(oShape, extrudeSettings);
      geoO.computeBoundingBox();
      geoO.translate(0, 0, -0.05);
      const meshO = new THREE.Mesh(geoO, letterMat);
      meshO.position.set(0, -1.0, 0); 
      sideGroup.add(meshO);

      // "M" - Dibujada vectorialmente para curvas perfectas
      const mShape = new THREE.Shape();
      mShape.moveTo(0, 0);
      mShape.lineTo(0, 1.0);
      mShape.lineTo(0.3, 1.0);
      mShape.lineTo(0.5, 0.4);
      mShape.lineTo(0.7, 1.0);
      mShape.lineTo(1.0, 1.0);
      mShape.lineTo(1.0, 0);
      mShape.lineTo(0.75, 0);
      mShape.lineTo(0.75, 0.7);
      mShape.lineTo(0.5, 0.1);
      mShape.lineTo(0.25, 0.7);
      mShape.lineTo(0.25, 0);
      mShape.lineTo(0, 0);
      const geoM = new THREE.ExtrudeGeometry(mShape, extrudeSettings);
      geoM.computeBoundingBox();
      const mCenter = geoM.boundingBox.getCenter(new THREE.Vector3());
      geoM.translate(-mCenter.x, -mCenter.y, -0.05);
      const meshM = new THREE.Mesh(geoM, letterMat);
      meshM.position.set(0, 0.4, 0); // Más junto a la O
      sideGroup.add(meshM);

      // "B" - Dibujada vectorialmente para aros suaves
      const bShape = new THREE.Shape();
      bShape.moveTo(0, 0);
      bShape.lineTo(0, 1.1);
      bShape.lineTo(0.5, 1.1);
      bShape.absarc(0.5, 0.825, 0.275, Math.PI/2, -Math.PI/2, true);
      bShape.lineTo(0.4, 0.55);
      bShape.lineTo(0.5, 0.55);
      bShape.absarc(0.5, 0.275, 0.275, Math.PI/2, -Math.PI/2, true);
      bShape.lineTo(0, 0);

      const topHole = new THREE.Path();
      topHole.moveTo(0.25, 0.70);
      topHole.lineTo(0.5, 0.70);
      topHole.absarc(0.5, 0.825, 0.125, -Math.PI/2, Math.PI/2, false);
      topHole.lineTo(0.25, 0.95);
      topHole.lineTo(0.25, 0.70);
      bShape.holes.push(topHole);

      const botHole = new THREE.Path();
      botHole.moveTo(0.25, 0.15);
      botHole.lineTo(0.5, 0.15);
      botHole.absarc(0.5, 0.275, 0.125, -Math.PI/2, Math.PI/2, false);
      botHole.lineTo(0.25, 0.40);
      botHole.lineTo(0.25, 0.15);
      bShape.holes.push(botHole);

      const geoB = new THREE.ExtrudeGeometry(bShape, extrudeSettings);
      geoB.computeBoundingBox();
      const bCenter = geoB.boundingBox.getCenter(new THREE.Vector3());
      geoB.translate(-bCenter.x, -bCenter.y, -0.05);
      const meshB = new THREE.Mesh(geoB, letterMat);
      meshB.position.set(0, 1.8, 0); // Más junto a la M
      sideGroup.add(meshB);

      // Agujeros de Parlantes (Hexágono)
      const holes = new THREE.Group();
      const hGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16);
      const hexHoles = [
        [0, 0], [0.3, 0.2], [-0.3, 0.2], [0.3, -0.2], [-0.3, -0.2], [0, 0.4], [0, -0.4]
      ];
      hexHoles.forEach(pos => {
        const h = new THREE.Mesh(hGeo, speakerMat);
        h.rotation.x = Math.PI / 2;
        h.position.set(pos[0], pos[1], 0);
        holes.add(h);
      });
      holes.position.set(0, 3.4, 0); // Más junto a la B
      sideGroup.add(holes);

      // Posicionar exactamente en la pared lateral del cuerpo
      sideGroup.position.set(sideMultiplier * (w / 2), 0, 0);
      sideGroup.rotation.y = sideMultiplier * Math.PI / 2;
      return sideGroup;
    };
    
    bmoGroup.add(createSideDetails(1));  // Costado derecho
    bmoGroup.add(createSideDetails(-1)); // Costado izquierdo

    // 4. ARMS & LEGS
    // En la referencia, extremidades usan el mismo color del cuerpo
    const limbMat = bodyMat; 
    
    // Left Arm Group (Viewer's right side)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(w / 2, -1.0, 0); // Pegado exactamente a la pared para salir de la "O"
    
    // Brazo cónico (tapered)
    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 4.5, 16), limbMat);
    leftArmMesh.position.set(0, -2.25, 0);
    leftArmGroup.add(leftArmMesh);
    bmoGroup.add(leftArmGroup);

    // Right Arm Group (Viewer's left side)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-w / 2, -1.0, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 4.5, 16), limbMat);
    rightArmMesh.position.set(0, -2.25, 0);
    rightArmGroup.add(rightArmMesh);
    bmoGroup.add(rightArmGroup);

    // Left Leg (Viewer's right)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(1.5, -h / 2, 0); 
    const leftLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 16), limbMat);
    leftLegMesh.position.set(0, -1.25, 0);
    leftLegGroup.add(leftLegMesh);
    
    // Pie redondeado
    const leftFoot = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.4, 1.5, 4, 0.2), limbMat);
    leftFoot.position.set(0, -2.6, 0.3);
    leftLegGroup.add(leftFoot);
    bmoGroup.add(leftLegGroup);

    // Right Leg (Viewer's left)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-1.5, -h / 2, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 16), limbMat);
    rightLegMesh.position.set(0, -1.25, 0);
    rightLegGroup.add(rightLegMesh);

    const rightFoot = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.4, 1.5, 4, 0.2), limbMat);
    rightFoot.position.set(0, -2.6, 0.3);
    rightLegGroup.add(rightFoot);
    bmoGroup.add(rightLegGroup);

    // 5. MOUSE INTERACTION & RAYCASTER
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isHovering = false;
    let isDraggingBmo = false;
    let prevMouse = { x: 0, y: 0 };

    const checkHover = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      // Mouse position in normalized device coordinates (-1 to +1)
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bmoGroup.children, true);
      
      const currentlyHovering = intersects.length > 0;
      
      if (currentlyHovering !== isHovering) {
        isHovering = currentlyHovering;
        // Si no estamos sobre BMO, dejamos que el click pase de largo al escritorio
        if (window.bmo && window.bmo.setIgnoreMouseEvents) {
          window.bmo.setIgnoreMouseEvents(!isHovering, { forward: true });
        }
      }
      return currentlyHovering;
    };

    const onPointerDown = (e) => {
      if (!isHovering) return; // Ignore if not on BMO
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
      // Check raycaster on every move to update click-through status
      checkHover(e);

      if (isDraggingBmo && e.buttons === 2) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        
        bmoGroup.rotation.y += deltaX * 0.01;
        bmoGroup.rotation.x += deltaY * 0.01;
        
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onDoubleClickNative = (e) => {
      if (isHovering && onDoubleClick) {
        onDoubleClick();
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('dblclick', onDoubleClickNative);

    // 6. ANIMATION & PHYSICS LOOP
    let rafId;
    const clock = new THREE.Clock();

    // Physics state
    let armLAngle = 0, armLVel = 0;
    let armRAngle = 0, armRVel = 0;
    let legAngle = 0, legVel = 0;

    const STIFFNESS = 0.05;  // Menos rígido, más propenso a moverse
    const DAMPING = 0.92;    // Conserva más el impulso (más "bouncy")
    const MAX_SWING = Math.PI / 2.5; // Permite que los brazos suban más
    const VEL_SCALE = 0.15;  // Multiplicador de fuerza al arrastrar la ventana

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
      // Brazo izquierdo (Viewer's right) - apuntando hacia adelante y apenas afuera
      leftArmGroup.rotation.z = 0.35 + idleArmL; 
      leftArmGroup.rotation.x = 0.5 + armLAngle; // 0.5 para apuntar adelante

      // Brazo derecho (Viewer's left)
      rightArmGroup.rotation.z = -0.35 + idleArmR;
      rightArmGroup.rotation.x = 0.5 + armRAngle;

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
      renderer.domElement.removeEventListener('dblclick', onDoubleClickNative);
      
      // Ensure we reset ignore status on unmount
      if (window.bmo && window.bmo.setIgnoreMouseEvents) {
        window.bmo.setIgnoreMouseEvents(false);
      }

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
        width: '350px', 
        height: '450px', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        boxShadow: 'none',
        border: 'none'
      }}
    >
      {/* 3D Canvas Container */}
      <div 
        ref={mountRef} 
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          background: 'transparent'
        }}
      />
      
      {/* HTML Screen Overlay (Tracks roughly over the 3D screen face) */}
      {screenContent && (
        <div style={{
          position: 'absolute',
          top: '32%', 
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
