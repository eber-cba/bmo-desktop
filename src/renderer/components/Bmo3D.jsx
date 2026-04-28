import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Cylinder, Float, Environment, ContactShadows, Text, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'

// ─── COLORES ─────────────────────────────────────────────────────────────────
const C = {
  bodyTeal: '#4DD9C8',
  screenMint: '#C8EDE8',
  btnYellow: '#FFD166',
  btnBlue: '#2C3E50',
  btnGreen: '#4CD964',
  btnRed: '#E84040',
  armTeal: '#2A8A7C',
  black: '#1A1A1A'
}

// ─── DIBUJO DE LA CARA (2D a 3D Texture) ─────────────────────────────────────
function drawFace(ctx, t, mood, w, h) {
  ctx.fillStyle = C.screenMint
  ctx.fillRect(0, 0, w, h)

  const cx = w / 2
  const eyeLy = h * 0.45, eyeRy = h * 0.45
  const eyeLx = w * 0.35, eyeRx = w * 0.65

  const drawEye = (x, y, r, blink) => {
    ctx.fillStyle = '#1A1A1A'
    ctx.beginPath()
    if (blink) {
      ctx.ellipse(x, y, r, r * 0.15, 0, 0, Math.PI * 2)
    } else {
      ctx.arc(x, y, r, 0, Math.PI * 2)
    }
    ctx.fill()
  }

  const drawSmile = (cx, y, width, open) => {
    ctx.strokeStyle = '#1A1A1A'
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    if (open) {
      ctx.fillStyle = '#1A1A1A'
      ctx.beginPath()
      ctx.ellipse(cx, y + 10, width, 25, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(cx, y - 10, width, 0.2 * Math.PI, 0.8 * Math.PI)
      ctx.stroke()
    }
  }

  if (mood === 'idle') {
    const blink = (t % 180 < 6)
    drawEye(eyeLx, eyeLy, 14, blink)
    drawEye(eyeRx, eyeRy, 14, blink)
    drawSmile(cx, h * 0.65, 30, false)
  } else if (mood === 'talking') {
    const blink = (t % 120 < 5)
    drawEye(eyeLx, eyeLy, 14, blink)
    drawEye(eyeRx, eyeRy, 14, blink)
    const open = (Math.sin(t * 0.25) > 0)
    drawSmile(cx, h * 0.65, 30, open)
  } else if (mood === 'happy') {
    drawEye(eyeLx, eyeLy, 16, false)
    drawEye(eyeRx, eyeRy, 16, false)
    drawSmile(cx, h * 0.65, 35, true)
  } else if (mood === 'sleepy') {
    drawEye(eyeLx, eyeLy + 10, 14, true)
    drawEye(eyeRx, eyeRy + 10, 14, true)
    drawSmile(cx, h * 0.65, 20, false)
  } else if (mood === 'thinking') {
    drawEye(eyeLx + Math.cos(t * 0.1) * 5, eyeLy + Math.sin(t * 0.1) * 5, 12, false)
    drawEye(eyeRx + Math.cos(t * 0.1 + 0.5) * 5, eyeRy + Math.sin(t * 0.1 + 0.5) * 5, 12, false)
    drawSmile(cx, h * 0.65, 15, false)
  } else if (mood === 'confused') {
    drawEye(eyeLx, eyeLy, 18, false)
    drawEye(eyeRx, eyeRy, 10, false)
    ctx.strokeStyle = '#1A1A1A'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 20, h * 0.65)
    for (let x = -20; x <= 20; x += 5) {
      ctx.lineTo(cx + x, h * 0.65 + Math.sin((x + t) * 0.2) * 5)
    }
    ctx.stroke()
  }
}

// ─── MODELO 3D DE BMO ────────────────────────────────────────────────────────
function BmoModel({ mood }) {
  const groupRef = useRef()
  
  // Textura dinámica para la cara
  const canvasRef = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 384
    return c
  }, [])
  const textureRef = useMemo(() => new THREE.CanvasTexture(canvasRef), [canvasRef])
  textureRef.colorSpace = THREE.SRGBColorSpace

  useFrame((state) => {
    const t = state.clock.elapsedTime * 60
    const ctx = canvasRef.getContext('2d')
    drawFace(ctx, t, mood, canvasRef.width, canvasRef.height)
    textureRef.needsUpdate = true

    // Leve rotación del cuerpo siguiendo el mouse
    if (groupRef.current) {
      const mouseX = (state.pointer.x * Math.PI) / 6
      const mouseY = (state.pointer.y * Math.PI) / 8
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseX, 0.1)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseY, 0.1)
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
        
        {/* Cuerpo Principal */}
        <RoundedBox args={[3.2, 4.5, 2.2]} radius={0.3} smoothness={4}>
          <meshStandardMaterial color={C.bodyTeal} roughness={0.3} metalness={0.1} />
        </RoundedBox>

        {/* Pantalla (con la textura 2D animada) */}
        <RoundedBox args={[2.6, 2.0, 0.1]} position={[0, 0.9, 1.12]} radius={0.1} smoothness={4}>
          <meshStandardMaterial map={textureRef} emissive={C.screenMint} emissiveIntensity={0.2} roughness={0.2} />
        </RoundedBox>

        {/* Ranura del disquete */}
        <RoundedBox args={[2.0, 0.15, 0.2]} position={[0, -0.3, 1.11]} radius={0.05}>
          <meshStandardMaterial color={C.black} roughness={0.8} />
        </RoundedBox>

        {/* D-Pad (Cruz Amarilla) */}
        <group position={[-0.8, -1.2, 1.15]}>
          <RoundedBox args={[0.3, 0.9, 0.1]} radius={0.05}><meshStandardMaterial color={C.btnYellow} roughness={0.4} /></RoundedBox>
          <RoundedBox args={[0.9, 0.3, 0.1]} radius={0.05}><meshStandardMaterial color={C.btnYellow} roughness={0.4} /></RoundedBox>
        </group>

        {/* Botón Triángulo Azul */}
        <Cylinder args={[0.2, 0.2, 0.1, 3]} position={[0.4, -0.9, 1.15]} rotation={[Math.PI/2, 0, Math.PI/6]}>
          <meshStandardMaterial color={C.btnBlue} roughness={0.4} />
        </Cylinder>

        {/* Botón Verde Chico */}
        <Cylinder args={[0.15, 0.15, 0.1, 32]} position={[1.0, -1.0, 1.15]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color={C.btnGreen} roughness={0.4} />
        </Cylinder>

        {/* Botón Rojo Grande */}
        <Cylinder args={[0.35, 0.35, 0.1, 32]} position={[0.8, -1.5, 1.15]} rotation={[Math.PI/2, 0, 0]}>
          <meshStandardMaterial color={C.btnRed} roughness={0.4} />
        </Cylinder>

        {/* Puertos frontales (2 pequeños abajo) */}
        <RoundedBox args={[0.4, 0.12, 0.1]} position={[-0.4, -1.9, 1.11]} radius={0.05}><meshStandardMaterial color={C.btnBlue} /></RoundedBox>
        <RoundedBox args={[0.4, 0.12, 0.1]} position={[0.2, -1.9, 1.11]} radius={0.05}><meshStandardMaterial color={C.btnBlue} /></RoundedBox>

        {/* Brazos */}
        <Cylinder args={[0.12, 0.1, 1.5, 16]} position={[-1.8, -1.0, 0]} rotation={[0, 0, Math.PI/4]}>
          <meshStandardMaterial color={C.armTeal} roughness={0.6} />
        </Cylinder>
        <Cylinder args={[0.12, 0.1, 1.5, 16]} position={[1.8, -1.0, 0]} rotation={[0, 0, -Math.PI/4]}>
          <meshStandardMaterial color={C.armTeal} roughness={0.6} />
        </Cylinder>

        {/* Piernas */}
        <Cylinder args={[0.15, 0.15, 1.2, 16]} position={[-0.6, -2.6, 0.5]} rotation={[Math.PI/2.5, 0, 0]}>
          <meshStandardMaterial color={C.armTeal} roughness={0.6} />
        </Cylinder>
        <Cylinder args={[0.15, 0.15, 1.2, 16]} position={[0.6, -2.6, 0.5]} rotation={[Math.PI/2.5, 0, 0]}>
          <meshStandardMaterial color={C.armTeal} roughness={0.6} />
        </Cylinder>

        {/* Texto Lateral "BMO" */}
        <Text position={[-1.61, 0, 0]} rotation={[0, -Math.PI/2, -Math.PI/2]} fontSize={0.8} color={C.armTeal} font="https://fonts.gstatic.com/s/bangers/v20/FeVQS0BTqb0h60ACH55Q2A.woff">
          BMO
        </Text>

      </Float>
    </group>
  )
}

// ─── COMPONENTE PRINCIPAL (Reemplaza al Canvas 2D) ───────────────────────────
export default function Bmo3D({ onClick, bubbleText, mood = 'idle' }) {
  return (
    <div 
      style={{ width: '300px', height: '350px', cursor: 'pointer' }}
      onClick={onClick}
    >
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-5, 5, 5]} intensity={0.8} />
        <Environment preset="city" />
        
        <BmoModel mood={mood} />
        
        {/* Sombra realista en el piso */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  )
}
