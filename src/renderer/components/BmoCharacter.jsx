import { useEffect, useRef, useCallback } from 'react'

// ── Paleta de colores de BMO ────────────────────────────────────────
const COLORS = {
  body: '#4ecdc4',
  bodyShade: '#3ab5ac',
  screen: '#c8f0e8',
  screenBorder: '#2c9e8e',
  eye: '#1a2c3d',
  eyeShine: '#ffffff',
  mouth: '#1a2c3d',
  button1: '#e74c3c',
  button2: '#f39c12',
  button3: '#2ecc71',
  outline: '#2c3e50',
}

const W = 160
const H = 180

/**
 * Dibuja a BMO en el canvas 2D.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} blinkProgress - 0 = ojos abiertos, 1 = ojos cerrados
 */
function drawBmo(ctx, blinkProgress = 0) {
  ctx.clearRect(0, 0, W, H)

  // Sombra debajo del cuerpo
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 5

  // Cuerpo
  ctx.fillStyle = COLORS.body
  ctx.beginPath()
  ctx.roundRect(10, 8, 140, 158, [16, 16, 12, 12])
  ctx.fill()
  ctx.restore()

  // Contorno del cuerpo
  ctx.strokeStyle = COLORS.outline
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.roundRect(10, 8, 140, 158, [16, 16, 12, 12])
  ctx.stroke()

  // Pantalla (borde)
  ctx.fillStyle = COLORS.screenBorder
  ctx.beginPath()
  ctx.roundRect(24, 22, 112, 88, 8)
  ctx.fill()

  // Pantalla (interior)
  ctx.fillStyle = COLORS.screen
  ctx.beginPath()
  ctx.roundRect(27, 25, 106, 82, 6)
  ctx.fill()

  // Ojos con parpadeo
  const eyeOpenH = 12
  const eyeH = eyeOpenH * (1 - blinkProgress)

  // Ojo izquierdo
  ctx.fillStyle = COLORS.eye
  ctx.beginPath()
  ctx.ellipse(62, 68, 10, Math.max(eyeH, 1), 0, 0, Math.PI * 2)
  ctx.fill()
  if (blinkProgress < 0.5) {
    ctx.fillStyle = COLORS.eyeShine
    ctx.beginPath()
    ctx.ellipse(58, 64, 3, 3 * (1 - blinkProgress * 2), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Ojo derecho
  ctx.fillStyle = COLORS.eye
  ctx.beginPath()
  ctx.ellipse(98, 68, 10, Math.max(eyeH, 1), 0, 0, Math.PI * 2)
  ctx.fill()
  if (blinkProgress < 0.5) {
    ctx.fillStyle = COLORS.eyeShine
    ctx.beginPath()
    ctx.ellipse(94, 64, 3, 3 * (1 - blinkProgress * 2), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Boca
  ctx.strokeStyle = COLORS.mouth
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(80, 90, 10, 0.1 * Math.PI, 0.9 * Math.PI)
  ctx.stroke()

  // Botón lateral (rojo)
  ctx.fillStyle = COLORS.button1
  ctx.beginPath()
  ctx.ellipse(155, 80, 7, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = COLORS.outline
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Botones frontales
  const btnY = 122
  const btnColors = [COLORS.button1, COLORS.button2, COLORS.button3]
  const btnX = [52, 80, 108]
  btnColors.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(btnX[i], btnY, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = COLORS.outline
    ctx.lineWidth = 1.2
    ctx.stroke()
  })

  // Patas
  ctx.fillStyle = COLORS.bodyShade
  ;[[28, 155, 30, 20], [102, 155, 30, 20]].forEach(([x, y, w, h]) => {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, [0, 0, 6, 6])
    ctx.fill()
    ctx.strokeStyle = COLORS.outline
    ctx.lineWidth = 1.5
    ctx.stroke()
  })
}

export default function BmoCharacter({ onClick, bubbleText }) {
  const canvasRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, lastX: 0, lastY: 0 })
  const animRef = useRef({ frameId: null, blinkTimer: 0, blinkProgress: 0, isBlinking: false })

  // ── Verificar que el puente IPC está disponible ─────────────────
  useEffect(() => {
    if (!window.bmo) {
      console.warn('[BMO Renderer] ⚠️ window.bmo no está disponible. El preload no cargó.')
    } else {
      console.log('[BMO Renderer] ✅ window.bmo disponible, drag habilitado')
    }
  }, [])

  // ── Animación idle: parpadeo periódico ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let lastTime = performance.now()

    const animate = (now) => {
      const delta = now - lastTime
      lastTime = now
      const anim = animRef.current

      anim.blinkTimer += delta
      if (!anim.isBlinking && anim.blinkTimer > 3000) {
        anim.isBlinking = true
        anim.blinkProgress = 0
        anim.blinkTimer = 0
      }

      if (anim.isBlinking) {
        anim.blinkProgress += delta / 80
        if (anim.blinkProgress >= 2) {
          anim.isBlinking = false
          anim.blinkProgress = 0
        }
      }

      const blink = anim.isBlinking
        ? anim.blinkProgress <= 1
          ? anim.blinkProgress
          : 2 - anim.blinkProgress
        : 0

      drawBmo(ctx, blink)
      anim.frameId = requestAnimationFrame(animate)
    }

    animRef.current.frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current.frameId)
  }, [])

  // ── Drag ────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    dragRef.current = { 
      isDragging: true, 
      startX: e.screenX, 
      startY: e.screenY,
      lastX: e.screenX, 
      lastY: e.screenY 
    }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    e.preventDefault()
  }, [])

  const onMouseMove = useCallback((e) => {
    const drag = dragRef.current
    if (!drag.isDragging) return

    const deltaX = e.screenX - drag.lastX
    const deltaY = e.screenY - drag.lastY
    drag.lastX = e.screenX
    drag.lastY = e.screenY

    // Usar IPC bridge si está disponible, fallback silencioso si no
    if (window.bmo?.drag) {
      window.bmo.drag({ deltaX, deltaY })
    }
  }, [])

  const onMouseUp = useCallback((e) => {
    const drag = dragRef.current
    if (!drag.isDragging) return
    
    drag.isDragging = false
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    
    // Detectar si fue click o drag
    const moveDistance = Math.abs(e.screenX - drag.startX) + Math.abs(e.screenY - drag.startY)
    if (moveDistance < 5 && onClick) {
      onClick()
    }
  }, [onClick])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  return (
    <div className="bmo-wrapper">
      {bubbleText && <div className="bmo-bubble">{bubbleText}</div>}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onMouseDown={onMouseDown}
        style={{ cursor: 'grab', display: 'block' }}
        title="¡Hola! Soy BMO 👾 — arrastrame o haz click en mi"
      />
    </div>
  )
}
