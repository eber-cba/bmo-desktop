import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export default function BmoThreeJs({
  physicsDrag,
  onDoubleClick,
  mood = "idle",
}) {
  const mountRef = useRef(null);
  const dragVelRef = useRef({ vx: 0, vy: 0 });

  // Refs para la cara dinámica
  const faceCanvasRef = useRef(document.createElement("canvas"));
  const faceCtxRef = useRef(null);
  const faceTextureRef = useRef(null);

  // Update physics ref on prop change
  useEffect(() => {
    dragVelRef.current = physicsDrag;
  }, [physicsDrag]);

  useEffect(() => {
    if (!mountRef.current) return;

    // ── SCENE & CAMERA ──────────────────────────────────────────────
    const width = 400; // Lienzo ampliado para que las extremidades no se corten
    const height = 500;
    const scene = new THREE.Scene();

    // Orthographic or Perspective. Let's use Perspective for depth.
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, -1, 28); // Cámara más atrás y un poco abajo para encuadrar pies

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    // Limpieza estándar para fondo totalmente transparente
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Forzar que el elemento HTML del canvas no tenga NINGÚN fondo ni borde
    renderer.domElement.style.backgroundColor = "transparent";
    renderer.domElement.style.border = "none";
    renderer.domElement.style.outline = "none";
    renderer.domElement.style.boxShadow = "none";

    mountRef.current.appendChild(renderer.domElement);

    // ── LIGHTING ────────────────────────────────────────────────────
    // Iluminación muy suave y difusa como en el render original
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 15);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, -10, -15);
    scene.add(backLight);

    // ── MATERIALS ───────────────────────────────────────────────────
    // Colores más fieles a la referencia (verde menta brillante)
    const bodyColor = 0x63bda4; // Más claro y vibrante
    const darkSlot = 0x153028;
    const screenColor = 0xd9ffea; // Más brillante para evitar que se vea oscura

    // Usamos StandardMaterial con un poco de brillo para quitar el efecto "opaco/tiza"
    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.3, metalness: 0.1 });
    const darkMat = new THREE.MeshStandardMaterial({ color: darkSlot, roughness: 0.5, metalness: 0.1 });
    const screenMat = new THREE.MeshStandardMaterial({ color: screenColor, roughness: 0.2, metalness: 0.1 });

    // ── BMO GROUP (Container for everything) ─────────────────────────
    const bmoGroup = new THREE.Group();
    scene.add(bmoGroup);

    // 1. BODY
    const w = 6.8,
      h = 9.0,
      d = 3.5; // Cuerpo más ancho

    // RoundedBox para los bordes suaves como en la referencia
    const bodyGeo = new RoundedBoxGeometry(w, h, d, 6, 0.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bmoGroup.add(bodyMesh);

    // 2. SCREEN & FACE
    const sw = 4.8,
      sh = 3.6; // Pantalla ajustada con padding

    // Marco oscuro que da el efecto de hundimiento (bevel/inset) para la pantalla
    const frameGeo = new RoundedBoxGeometry(sw + 0.2, sh + 0.2, 0.1, 4, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x36a887, roughness: 0.5, metalness: 0.1 }); // Verde sombra
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 2.2, d / 2 + 0.05); // Pantalla posicionada arriba
    bmoGroup.add(frameMesh);

    // Pantalla en sí
    const screenGeo = new RoundedBoxGeometry(sw, sh, 0.05, 4, 0.05);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 2.2, d / 2 + 0.06);
    bmoGroup.add(screenMesh);

    // Preparar el CanvasTexture para las caras dinámicas
    faceCanvasRef.current.width = 512;
    faceCanvasRef.current.height = 384;
    faceCtxRef.current = faceCanvasRef.current.getContext("2d");
    faceTextureRef.current = new THREE.CanvasTexture(faceCanvasRef.current);
    faceTextureRef.current.minFilter = THREE.LinearFilter;

    // Plano súper delgado para la cara apoyado sobre la pantalla
    const facePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({
        map: faceTextureRef.current,
        transparent: true,
        opacity: 1.0,
      }),
    );
    facePlane.position.set(0, 0, 0.04);
    screenMesh.add(facePlane);

    // 3. BUTTONS (Front panel)
    // Settings para que todos los botones tengan un relieve biselado perfecto
    const btnExtrudeSettings = {
      depth: 0.15,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };

    // Disc drive slot (con borde hundido)
    const slotW = 2.4,
      slotH = 0.2;
    const slotBorderGeo = new RoundedBoxGeometry(
      slotW + 0.15,
      slotH + 0.15,
      0.05,
      4,
      0.05,
    );
    const slotBorder = new THREE.Mesh(slotBorderGeo, frameMat);
    slotBorder.position.set(-1.2, -0.4, d / 2 + 0.05);
    bmoGroup.add(slotBorder);

    const slotMesh = new THREE.Mesh(
      new RoundedBoxGeometry(slotW, slotH, 0.1, 2, 0.05),
      darkMat,
    );
    slotMesh.position.set(-1.2, -0.4, d / 2 + 0.06);
    bmoGroup.add(slotMesh);

    // Materiales de plástico pulido para los botones
    const btnMatOptions = { roughness: 0.2, metalness: 0.1 };

    // D-Pad (Cruz Amarilla) - Proporción pequeña
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      ...btnMatOptions,
    });
    const dpadShape = new THREE.Shape();
    const dt = 0.14; // Grosor
    const dl = 0.42; // Largo
    dpadShape.moveTo(-dt, -dt);
    dpadShape.lineTo(-dl, -dt);
    dpadShape.lineTo(-dl, dt);
    dpadShape.lineTo(-dt, dt);
    dpadShape.lineTo(-dt, dl);
    dpadShape.lineTo(dt, dl);
    dpadShape.lineTo(dt, dt);
    dpadShape.lineTo(dl, dt);
    dpadShape.lineTo(dl, -dt);
    dpadShape.lineTo(dt, -dt);
    dpadShape.lineTo(dt, -dl);
    dpadShape.lineTo(-dt, -dl);
    dpadShape.lineTo(-dt, -dt);
    const dpadGeo = new THREE.ExtrudeGeometry(dpadShape, btnExtrudeSettings);
    const dpadBtn = new THREE.Mesh(dpadGeo, yellowMat);
    dpadBtn.position.set(-1.8, -2.0, d / 2 + 0.02);
    bmoGroup.add(dpadBtn);

    // Botón Triángulo (Cyan)
    const cyanMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      ...btnMatOptions,
    });
    const triShape = new THREE.Shape();
    const triR = 0.4;
    triShape.moveTo(0, triR);
    triShape.lineTo(
      triR * Math.cos(-Math.PI / 6),
      triR * Math.sin(-Math.PI / 6),
    );
    triShape.lineTo(
      -triR * Math.cos(-Math.PI / 6),
      triR * Math.sin(-Math.PI / 6),
    );
    triShape.lineTo(0, triR);
    const triGeo = new THREE.ExtrudeGeometry(triShape, btnExtrudeSettings);
    const triBtn = new THREE.Mesh(triGeo, cyanMat);
    triBtn.position.set(1.4, -2.0, d / 2 + 0.02);
    bmoGroup.add(triBtn);

    const circleShape = (r) => {
      const s = new THREE.Shape();
      s.absarc(0, 0, r, 0, Math.PI * 2, false);
      return s;
    };

    // Botón Grande Rojo
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      ...btnMatOptions,
    });
    const redGeo = new THREE.ExtrudeGeometry(
      circleShape(0.4),
      btnExtrudeSettings,
    );
    const redBtn = new THREE.Mesh(redGeo, redMat);
    redBtn.position.set(1.6, -2.9, d / 2 + 0.02);
    bmoGroup.add(redBtn);

    // Botones Chicos (Verde y Azul)
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      ...btnMatOptions,
    });
    const greenGeo = new THREE.ExtrudeGeometry(
      circleShape(0.28),
      btnExtrudeSettings,
    );
    const greenBtn = new THREE.Mesh(greenGeo, greenMat);
    greenBtn.position.set(2.5, -2.5, d / 2 + 0.02);
    bmoGroup.add(greenBtn);

    const blueBtnMat = new THREE.MeshStandardMaterial({
      color: 0x2962ff,
      ...btnMatOptions,
    });
    const topBlueGeo = new THREE.ExtrudeGeometry(
      circleShape(0.22),
      btnExtrudeSettings,
    );
    const topBlueBtn = new THREE.Mesh(topBlueGeo, blueBtnMat);
    topBlueBtn.position.set(2.0, -0.4, d / 2 + 0.02);
    bmoGroup.add(topBlueBtn);

    // Botones Select/Start (Píldoras Azules)
    const pillShape = new THREE.Shape();
    pillShape.absarc(-0.2, 0, 0.1, Math.PI / 2, Math.PI * 1.5, false);
    pillShape.absarc(0.2, 0, 0.1, -Math.PI / 2, Math.PI / 2, false);
    const pillGeo = new THREE.ExtrudeGeometry(pillShape, btnExtrudeSettings);

    const selBtn = new THREE.Mesh(pillGeo, blueBtnMat);
    selBtn.position.set(-2.3, -3.2, d / 2 + 0.02);
    bmoGroup.add(selBtn);

    const startBtn = new THREE.Mesh(pillGeo, blueBtnMat);
    startBtn.position.set(-1.3, -3.2, d / 2 + 0.02);
    bmoGroup.add(startBtn);
    bmoGroup.add(startBtn);

    // ── SIDE DETAILS (B M O & Speakers) ─────────────────────────
    const createSideDetails = (sideMultiplier) => {
      const sideGroup = new THREE.Group();
      const letterMat = new THREE.MeshBasicMaterial({ color: darkSlot }); // Material básico para que parezca una calcomanía plana
      const speakerMat = new THREE.MeshBasicMaterial({ color: darkSlot }); // Dark inside

      // Configuración de relieve nulo (plano como un dibujo)
      const extrudeSettings = {
        depth: 0.02, // Apenas grosor para no hacer z-fighting
        bevelEnabled: false,
      };

      // Escala global para las letras, para que sean enormes como en la foto
      const letterScale = 1.6;

      // "O" (Agujero para el brazo)
      const oShape = new THREE.Shape();
      oShape.absarc(0, 0, 0.45, 0, Math.PI * 2, false);
      const oHole = new THREE.Path();
      oHole.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
      oShape.holes.push(oHole);
      const geoO = new THREE.ExtrudeGeometry(oShape, extrudeSettings);
      geoO.computeBoundingBox();
      geoO.translate(0, 0, -0.01);
      const meshO = new THREE.Mesh(geoO, letterMat);
      meshO.scale.set(letterScale, letterScale, 1.0);
      meshO.position.set(0, -2.0, 0); // Mucho más abajo! El brazo saldrá de aquí.
      sideGroup.add(meshO);

      // "M" - Dibujada vectorialmente
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
      geoM.translate(-mCenter.x, -mCenter.y, -0.01);
      const meshM = new THREE.Mesh(geoM, letterMat);
      meshM.scale.set(letterScale, letterScale, 1.0);
      meshM.position.set(0, 0, 0); // Al medio
      sideGroup.add(meshM);

      // "B" - Dibujada vectorialmente
      const bShape = new THREE.Shape();
      bShape.moveTo(0, 0);
      bShape.lineTo(0, 1.1);
      bShape.lineTo(0.5, 1.1);
      bShape.absarc(0.5, 0.825, 0.275, Math.PI / 2, -Math.PI / 2, true);
      bShape.lineTo(0.4, 0.55);
      bShape.lineTo(0.5, 0.55);
      bShape.absarc(0.5, 0.275, 0.275, Math.PI / 2, -Math.PI / 2, true);
      bShape.lineTo(0, 0);
      const topHole = new THREE.Path();
      topHole.moveTo(0.25, 0.7);
      topHole.lineTo(0.5, 0.7);
      topHole.absarc(0.5, 0.825, 0.125, -Math.PI / 2, Math.PI / 2, false);
      topHole.lineTo(0.25, 0.95);
      topHole.lineTo(0.25, 0.7);
      bShape.holes.push(topHole);
      const botHole = new THREE.Path();
      botHole.moveTo(0.25, 0.15);
      botHole.lineTo(0.5, 0.15);
      botHole.absarc(0.5, 0.275, 0.125, -Math.PI / 2, Math.PI / 2, false);
      botHole.lineTo(0.25, 0.4);
      botHole.lineTo(0.25, 0.15);
      bShape.holes.push(botHole);

      const geoB = new THREE.ExtrudeGeometry(bShape, extrudeSettings);
      geoB.computeBoundingBox();
      const bCenter = geoB.boundingBox.getCenter(new THREE.Vector3());
      geoB.translate(-bCenter.x, -bCenter.y, -0.01);
      const meshB = new THREE.Mesh(geoB, letterMat);
      meshB.scale.set(letterScale, letterScale, 1.0);
      meshB.position.set(0, 2.0, 0); // Arriba
      sideGroup.add(meshB);

      // Agujeros de Parlantes (Patrón en forma de H)
      const holes = new THREE.Group();
      const hGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16); // Planitos como huecos reales
      const hexHoles = [
        [-0.45, 0.45],
        [0.45, 0.45], // Fila superior
        [-0.45, 0],
        [0, 0],
        [0.45, 0], // Fila media
        [-0.45, -0.45],
        [0.45, -0.45], // Fila inferior
      ];
      hexHoles.forEach((pos) => {
        const h = new THREE.Mesh(hGeo, speakerMat);
        h.rotation.x = Math.PI / 2;
        h.position.set(pos[0], pos[1], -0.04); // Hundidos en la carcasa
        holes.add(h);
      });
      holes.position.set(0, 3.6, 0); // Bien arriba, alejados de las letras
      sideGroup.add(holes);

      // Posicionar exactamente en la pared lateral del cuerpo
      sideGroup.position.set(sideMultiplier * (w / 2), 0, 0);
      sideGroup.rotation.y = (sideMultiplier * Math.PI) / 2;
      return sideGroup;
    };

    bmoGroup.add(createSideDetails(-1)); // Left
    bmoGroup.add(createSideDetails(1)); // Right

    // ── BACK DETAILS (Vents, Battery, Cartridge Slot) ───────────────
    const createBackDetails = () => {
      const backGroup = new THREE.Group();
      const ventMat = new THREE.MeshLambertMaterial({ color: darkSlot });

      // 1. Top Vents (5 ranuras verticales más gruesas y cortas)
      const ventGeo = new RoundedBoxGeometry(0.35, 2.4, 0.2, 4, 0.15);
      for (let i = -2; i <= 2; i++) {
        const vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(i * 0.9, 3.2, 0);
        backGroup.add(vent);
      }

      // 2. Tapa de Baterías (Centro)
      // Usamos un plano oscuro grande atrás y uno claro un poco más chico adelante para hacer el borde
      const batteryPlateW = 4.8;
      const batteryPlateH = 3.2;

      // Borde oscuro (hundido)
      const borderGeo = new RoundedBoxGeometry(
        batteryPlateW,
        batteryPlateH,
        0.05,
        4,
        0.2,
      );
      const borderMesh = new THREE.Mesh(borderGeo, ventMat);
      borderMesh.position.set(0, 0, 0.02);
      backGroup.add(borderMesh);

      // Placa interior (color cuerpo)
      const batteryPlateGeo = new RoundedBoxGeometry(
        batteryPlateW - 0.2,
        batteryPlateH - 0.2,
        0.1,
        4,
        0.15,
      );
      const batteryPlateMat = new THREE.MeshLambertMaterial({
        color: bodyColor,
      });
      const batteryPlate = new THREE.Mesh(batteryPlateGeo, batteryPlateMat);
      batteryPlate.position.set(0, 0, 0.05);
      backGroup.add(batteryPlate);

      // Tornillos de la tapa (4 agujeros oscuros en las esquinas de la placa interior)
      const screwGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
      const sx = batteryPlateW / 2 - 0.5;
      const sy = batteryPlateH / 2 - 0.5;
      const screws = [
        [-sx, sy],
        [sx, sy],
        [-sx, -sy],
        [sx, -sy],
      ];
      screws.forEach((pos) => {
        const screw = new THREE.Mesh(screwGeo, ventMat);
        screw.rotation.x = Math.PI / 2;
        screw.position.set(pos[0], pos[1], 0.08);
        backGroup.add(screw);
      });

      // 3. Cartridge / IO Slot (Abajo)
      const cartSlotGeo = new RoundedBoxGeometry(3.5, 0.5, 0.2, 4, 0.1);
      const cartSlot = new THREE.Mesh(cartSlotGeo, ventMat);
      cartSlot.position.set(0, -3.2, 0);
      backGroup.add(cartSlot);

      // Posicionar en la parte de atrás del cuerpo (z = -d/2)
      backGroup.position.set(0, 0, -d / 2);
      backGroup.rotation.y = Math.PI; // Rotar 180°
      return backGroup;
    };

    bmoGroup.add(createBackDetails());

    // 4. ARMS & LEGS
    // En la referencia, extremidades usan el mismo color del cuerpo
    const limbMat = bodyMat;

    // Left Arm Group (Viewer's right side)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(w / 2, -2.0, 0); // Ajustado para salir EXACTAMENTE de la "O"

    // Brazo cónico (tapered)
    const leftArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 4.5, 16),
      limbMat,
    );
    leftArmMesh.position.set(0, -2.25, 0);
    leftArmGroup.add(leftArmMesh);
    bmoGroup.add(leftArmGroup);

    // Right Arm Group (Viewer's left side)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(-w / 2, -2.0, 0);
    const rightArmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 4.5, 16),
      limbMat,
    );
    rightArmMesh.position.set(0, -2.25, 0);
    rightArmGroup.add(rightArmMesh);
    bmoGroup.add(rightArmGroup);

    // Left Leg (Viewer's right)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(1.5, -h / 2, 0);
    const leftLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 2.5, 16),
      limbMat,
    );
    leftLegMesh.position.set(0, -1.25, 0);
    leftLegGroup.add(leftLegMesh);

    // Pie redondeado
    const leftFoot = new THREE.Mesh(
      new RoundedBoxGeometry(0.8, 0.4, 1.5, 4, 0.2),
      limbMat,
    );
    leftFoot.position.set(0, -2.6, 0.3);
    leftLegGroup.add(leftFoot);
    bmoGroup.add(leftLegGroup);

    // Right Leg (Viewer's left)
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(-1.5, -h / 2, 0);
    const rightLegMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 2.5, 16),
      limbMat,
    );
    rightLegMesh.position.set(0, -1.25, 0);
    rightLegGroup.add(rightLegMesh);

    const rightFoot = new THREE.Mesh(
      new RoundedBoxGeometry(0.8, 0.4, 1.5, 4, 0.2),
      limbMat,
    );
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

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("dblclick", onDoubleClickNative);

    // 6. ANIMATION & PHYSICS LOOP
    let rafId;
    const clock = new THREE.Clock();

    // Physics state
    let armLAngle = 0,
      armLVel = 0;
    let armRAngle = 0,
      armRVel = 0;
    let legAngle = 0,
      legVel = 0;

    const STIFFNESS = 0.05; // Menos rígido, más propenso a moverse
    const DAMPING = 0.92; // Conserva más el impulso (más "bouncy")
    const MAX_SWING = Math.PI / 2.5; // Permite que los brazos suban más
    const VEL_SCALE = 0.15; // Multiplicador de fuerza al arrastrar la ventana

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

      const accL =
        -STIFFNESS * armLAngle - (1 - DAMPING) * armLVel + armForce * 0.12;
      const accR =
        -(STIFFNESS * 0.85) * armRAngle -
        (1 - DAMPING * 0.95) * armRVel +
        armForce * 0.14;
      const accLeg =
        -STIFFNESS * legAngle - (1 - DAMPING) * legVel + legForce * 0.12;

      armLVel += accL;
      armLAngle = clamp(armLAngle + armLVel);
      armRVel += accR;
      armRAngle = clamp(armRAngle + armRVel);
      legVel += accLeg;
      legAngle = clamp(legAngle + legVel);

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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("dblclick", onDoubleClickNative);

      // Ensure we reset ignore status on unmount
      if (window.bmo && window.bmo.setIgnoreMouseEvents) {
        window.bmo.setIgnoreMouseEvents(false);
      }

      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Dispose geometries/materials
      bodyGeo.dispose();
      bodyMat.dispose();
      screenGeo.dispose();
      screenMat.dispose();
    };
  }, []);

  // ── DIBUJAR CARA DINÁMICA SEGÚN EL MOOD ─────────────────────────
  useEffect(() => {
    const ctx = faceCtxRef.current;
    if (!ctx) return;
    const cw = faceCanvasRef.current.width;
    const ch = faceCanvasRef.current.height;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#222222"; // Ojos y bordes
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const cx = cw / 2;
    const cy = ch / 2 - 20;

    const drawOvalEye = (x, y) => {
      ctx.beginPath();
      ctx.ellipse(x, y, 16, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHappyEye = (x, y) => {
      ctx.beginPath();
      ctx.moveTo(x - 24, y);
      ctx.quadraticCurveTo(x, y - 28, x + 24, y);
      ctx.stroke();
    };

    if (mood === "celebrate" || mood === "happy") {
      // Súper feliz (Ojos cerrados en ^, boca grande abierta con dientes)
      drawHappyEye(cx - 100, cy - 10);
      drawHappyEye(cx + 100, cy - 10);

      // Boca gigante abierta
      ctx.beginPath();
      ctx.moveTo(cx - 60, cy + 30);
      ctx.quadraticCurveTo(cx, cy + 40, cx + 60, cy + 30);
      ctx.bezierCurveTo(cx + 70, cy + 120, cx - 70, cy + 120, cx - 60, cy + 30);
      ctx.fillStyle = "#008a6e"; // Fondo de la boca
      ctx.fill();
      ctx.stroke();

      // Dientes blancos arriba
      ctx.beginPath();
      ctx.moveTo(cx - 56, cy + 34);
      ctx.quadraticCurveTo(cx, cy + 44, cx + 56, cy + 34);
      ctx.quadraticCurveTo(cx + 56, cy + 60, cx, cy + 60);
      ctx.quadraticCurveTo(cx - 56, cy + 60, cx - 56, cy + 34);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.stroke();
    } else if (mood === "talking") {
      // Hablando (Ojos ovalados, boca redonda abierta)
      drawOvalEye(cx - 100, cy - 10);
      drawOvalEye(cx + 100, cy - 10);

      ctx.beginPath();
      ctx.moveTo(cx - 50, cy + 40);
      ctx.quadraticCurveTo(cx, cy + 30, cx + 50, cy + 40);
      ctx.bezierCurveTo(cx + 50, cy + 100, cx - 50, cy + 100, cx - 50, cy + 40);
      ctx.fillStyle = "#008a6e";
      ctx.fill();
      ctx.stroke();
    } else if (mood === "thinking") {
      // Pensando (Ojos ovalados, boca recta de concentración)
      drawOvalEye(cx - 100, cy - 10);
      drawOvalEye(cx + 100, cy - 10);

      ctx.beginPath();
      ctx.moveTo(cx - 40, cy + 50);
      ctx.lineTo(cx + 40, cy + 50);
      ctx.stroke();
    } else if (mood === "error") {
      // Error (Ojos en X, boca ondulada)
      ctx.lineWidth = 12;
      const drawX = (x, y) => {
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 20);
        ctx.lineTo(x + 20, y + 20);
        ctx.moveTo(x + 20, y - 20);
        ctx.lineTo(x - 20, y + 20);
        ctx.stroke();
      };
      drawX(cx - 100, cy - 10);
      drawX(cx + 100, cy - 10);

      ctx.beginPath();
      ctx.moveTo(cx - 40, cy + 50);
      ctx.lineTo(cx - 20, cy + 40);
      ctx.lineTo(cx, cy + 60);
      ctx.lineTo(cx + 20, cy + 40);
      ctx.lineTo(cx + 40, cy + 50);
      ctx.stroke();
    } else {
      // Idle (Ojos ovalados, sonrisa estándar como en la foto)
      drawOvalEye(cx - 100, cy - 10);
      drawOvalEye(cx + 100, cy - 10);

      ctx.beginPath();
      ctx.arc(cx, cy + 20, 60, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
    }

    if (faceTextureRef.current) {
      faceTextureRef.current.needsUpdate = true;
    }
  }, [mood]);

  return (
    <div
      className="bmo-three-wrapper"
      style={{
        width: "400px",
        height: "500px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "transparent",
        boxShadow: "none",
        border: "none",
      }}
    >
      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          background: "transparent",
        }}
      />
    </div>
  );
}
