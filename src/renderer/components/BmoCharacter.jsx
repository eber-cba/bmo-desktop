import { useEffect, useRef } from 'react'

// ─── Paleta fiel a Adventure Time ───────────────────────────────────────────
const C = {
  bodyTeal:      '#3CB9A8',
  bodyTealDark:  '#2A8A7C',
  bodyTealLight: '#4DD9C8',
  screenMint:    '#C8EDE8',
  screenDark:    '#A0D4CE',
  outline:       '#1A3A36',
  eyeWhite:      '#FFFFFF',
  eyePupil:      '#1A1A1A',
  eyeShine:      '#FFFFFF',
  mouthColor:    '#1A3A36',
  btnRed:        '#E84040',
  btnOrange:     '#F5A623',
  btnGreen:      '#4CD964',
  footTeal:      '#2E9A8B',
  sideBtn:       '#E84040',
  blush:         'rgba(255,120,120,0.35)',
  screenGlow:    'rgba(72,220,200,0.15)',
  star:          '#FFD700',
}

/**
 * Dibuja BMO fiel al diseño de Adventure Time con estados de ánimo animados.
 * mood: 'idle' | 'thinking' | 'talking' | 'happy' | 'sleepy' | 'confused'
 */
export default function BmoCharacter({ onClick, bubbleText, mood = 'idle' }) {
  const canvasRef = useRef(null)
  const frameRef  = useRef(0)
  const tickRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let animId

    const draw = () => {
      tickRef.current++
      const t = tickRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Float animation (subtle up/down) ────────────────────────────────
      const floatY = mood === 'happy'
        ? Math.sin(t * 0.18) * 6
        : Math.sin(t * 0.04) * 2.5

      ctx.save()
      ctx.translate(0, floatY)

      // ── Shadow ──────────────────────────────────────────────────────────
      ctx.save()
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.beginPath()
      ctx.ellipse(100, 198 - floatY, 52, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // ── Body ────────────────────────────────────────────────────────────
      drawRoundRect(ctx, 18, 10, 164, 175, 22, C.bodyTeal, C.outline, 3.5)

      // Body highlight (top left sheen)
      ctx.save()
      const sheen = ctx.createLinearGradient(18, 10, 80, 90)
      sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
      sheen.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = sheen
      drawRoundRectPath(ctx, 18, 10, 164, 175, 22)
      ctx.fill()
      ctx.restore()

      // ── Screen ──────────────────────────────────────────────────────────
      drawRoundRect(ctx, 32, 22, 136, 106, 12, C.screenMint, C.outline, 2.5)

      // Screen inner glow
      ctx.save()
      ctx.fillStyle = C.screenGlow
      drawRoundRectPath(ctx, 35, 25, 130, 100, 10)
      ctx.fill()
      ctx.restore()

      // ── MOOD-BASED SCREEN CONTENT ────────────────────────────────────────
      drawScreen(ctx, t, mood)

      // ── Buttons row ─────────────────────────────────────────────────────
      // Red button
      drawCircleButton(ctx, 60, 148, 11, C.btnRed)
      // Orange button
      drawCircleButton(ctx, 100, 148, 11, C.btnOrange)
      // Green button
      drawCircleButton(ctx, 140, 148, 11, C.btnGreen)

      // D-pad left side (2 small rectangles)
      drawRoundRect(ctx, 22, 75, 6, 18, 3, C.bodyTealDark, C.outline, 1.5)
      drawRoundRect(ctx, 22, 98, 6, 18, 3, C.bodyTealDark, C.outline, 1.5)

      // Side button (right side, orange/red)
      drawRoundRect(ctx, 172, 80, 10, 22, 4, C.sideBtn, C.outline, 2)

      // ── Feet ────────────────────────────────────────────────────────────
      drawRoundRect(ctx, 42, 178, 40, 18, 6, C.footTeal, C.outline, 2.5)
      drawRoundRect(ctx, 118, 178, 40, 18, 6, C.footTeal, C.outline, 2.5)

      // Blush (shows when happy or talking)
      if (mood === 'happy' || mood === 'talking') {
        ctx.save()
        ctx.globalAlpha = mood === 'happy' ? 0.7 : 0.4
        ctx.fillStyle = C.blush
        ctx.beginPath(); ctx.ellipse(55, 90, 14, 9, -0.3, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(145, 90, 14, 9, 0.3, 0, Math.PI*2); ctx.fill()
        ctx.restore()
      }

      ctx.restore() // end float

      // ── Speech Bubble ───────────────────────────────────────────────────
      if (bubbleText) drawBubble(ctx, bubbleText, canvas.width)

      // ── Happy sparkles ──────────────────────────────────────────────────
      if (mood === 'happy') drawSparkles(ctx, t)

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [mood, bubbleText])

  return (
    <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
      <canvas
        ref={canvasRef}
        width={200}
        height={210}
        onClick={onClick}
        style={{ display: 'block' }}
      />
    </div>
  )
}

// ─── SCREEN RENDERER ─────────────────────────────────────────────────────────
function drawScreen(ctx, t, mood) {
  const cx = 100 // screen center x
  const eyeLy = 68, eyeRy = 68
  const eyeLx = 72, eyeRx = 128

  if (mood === 'idle') {
    const blink = (t % 180 < 6) // blink every ~3s
    drawEye(ctx, eyeLx, eyeLy, 15, blink)
    drawEye(ctx, eyeRx, eyeRy, 15, blink)
    // Pupils look slightly left/right over time
    const lookX = Math.sin(t * 0.02) * 3
    drawPupil(ctx, eyeLx + lookX, eyeLy, 7)
    drawPupil(ctx, eyeRx + lookX, eyeRy, 7)
    drawSmile(ctx, cx, 94, 18, false)
  }

  else if (mood === 'thinking') {
    // Spiral/spinning pupils
    const angle = t * 0.08
    drawEye(ctx, eyeLx, eyeLy, 15, false)
    drawEye(ctx, eyeRx, eyeRy, 15, false)
    drawPupilSpiral(ctx, eyeLx, eyeLy, 7, angle)
    drawPupilSpiral(ctx, eyeRx, eyeRy, 7, angle + 0.5)
    // "..." on lower screen
    ctx.fillStyle = C.outline
    ctx.font = 'bold 18px Patrick Hand, sans-serif'
    ctx.textAlign = 'center'
    const dots = '.'.repeat((Math.floor(t / 20) % 3) + 1)
    ctx.fillText(dots, cx, 104)
  }

  else if (mood === 'talking') {
    const blink = (t % 120 < 5)
    drawEye(ctx, eyeLx, eyeLy, 15, blink)
    drawEye(ctx, eyeRx, eyeRy, 15, blink)
    drawPupil(ctx, eyeLx, eyeLy, 7)
    drawPupil(ctx, eyeRx, eyeRy, 7)
    // Animated mouth (open/close)
    const open = (Math.sin(t * 0.25) > 0)
    drawSmile(ctx, cx, 94, 18, open)
  }

  else if (mood === 'happy') {
    // Star eyes!
    drawEye(ctx, eyeLx, eyeLy, 16, false)
    drawEye(ctx, eyeRx, eyeRy, 16, false)
    drawStarEye(ctx, eyeLx, eyeLy, 10, t)
    drawStarEye(ctx, eyeRx, eyeRy, 10, t)
    // Big smile
    drawSmile(ctx, cx, 97, 24, false, true)
  }

  else if (mood === 'sleepy') {
    // Half-closed eyes
    drawEyeSleepy(ctx, eyeLx, eyeLy, 15)
    drawEyeSleepy(ctx, eyeRx, eyeRy, 15)
    drawPupil(ctx, eyeLx, eyeLy + 4, 5)
    drawPupil(ctx, eyeRx, eyeRy + 4, 5)
    drawSmile(ctx, cx, 96, 12, false)
    // Zzz
    ctx.save()
    ctx.fillStyle = '#A0B0FF'
    ctx.font = `bold ${14 + Math.sin(t * 0.05) * 2}px Bangers, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('z', 148, 42 - Math.sin(t * 0.04) * 4)
    ctx.font = `bold ${10 + Math.sin(t * 0.05) * 1}px Bangers, sans-serif`
    ctx.fillText('z', 158, 32 - Math.sin(t * 0.04) * 3)
    ctx.restore()
  }

  else if (mood === 'confused') {
    // One eye bigger than the other
    drawEye(ctx, eyeLx - 3, eyeLy, 18, false)
    drawEye(ctx, eyeRx + 3, eyeRy, 12, false)
    drawPupil(ctx, eyeLx - 3, eyeLy, 8)
    drawPupil(ctx, eyeRx + 3, eyeRy, 5)
    // Wiggly mouth
    drawWigglyMouth(ctx, cx, 96, t)
    // ? mark
    ctx.fillStyle = C.outline
    ctx.font = 'bold 14px Bangers, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('?', 148, 42)
  }
}

// ─── DRAWING HELPERS ─────────────────────────────────────────────────────────
function drawEye(ctx, x, y, r, blink) {
  ctx.save()
  ctx.fillStyle = C.eyeWhite
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 2
  if (blink) {
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.15, 0, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }
  ctx.restore()
}

function drawPupil(ctx, x, y, r) {
  // Pupil
  ctx.save()
  ctx.fillStyle = C.eyePupil
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  // Shine
  ctx.fillStyle = C.eyeShine
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.32, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawPupilSpiral(ctx, x, y, r, angle) {
  const px = x + Math.cos(angle) * 4
  const py = y + Math.sin(angle) * 4
  drawPupil(ctx, px, py, r)
}

function drawEyeSleepy(ctx, x, y, r) {
  ctx.save()
  ctx.fillStyle = C.eyeWhite
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 2
  // Draw only bottom half circle (half-open)
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI)
  ctx.closePath()
  ctx.fill(); ctx.stroke()
  // Top eyelid line
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke()
  ctx.restore()
}

function drawStarEye(ctx, x, y, r, t) {
  ctx.save()
  ctx.fillStyle = C.star
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 1.5
  const spikes = 5
  const outerR = r
  const innerR = r * 0.45
  const rotation = t * 0.04
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (i * Math.PI) / spikes + rotation
    const rr = i % 2 === 0 ? outerR : innerR
    ctx.lineTo(x + Math.cos(rad) * rr, y + Math.sin(rad) * rr)
  }
  ctx.closePath()
  ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawSmile(ctx, cx, y, width, open, big = false) {
  ctx.save()
  ctx.strokeStyle = C.mouthColor
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  if (open) {
    // Open mouth (oval)
    ctx.fillStyle = '#1A1A1A'
    ctx.beginPath()
    ctx.ellipse(cx, y + 2, width * 0.5, big ? 8 : 5, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(cx, y - (big ? 14 : 8), big ? 22 : 16, 0.25 * Math.PI, 0.75 * Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

function drawWigglyMouth(ctx, cx, y, t) {
  ctx.save()
  ctx.strokeStyle = C.mouthColor
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 14, y)
  for (let x = -14; x <= 14; x += 2) {
    const wy = y + Math.sin((x + t * 0.5) * 0.6) * 3
    ctx.lineTo(cx + x, wy)
  }
  ctx.stroke()
  ctx.restore()
}

function drawCircleButton(ctx, x, y, r, color) {
  // Shadow
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.beginPath(); ctx.arc(x + 1.5, y + 2, r, 0, Math.PI * 2); ctx.fill()
  // Button
  ctx.fillStyle = color
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath(); ctx.arc(x - 3, y - 3, r * 0.4, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawBubble(ctx, text, canvasW) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  ctx.font = '13px Patrick Hand, sans-serif'
  const maxW = 160
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW) { lines.push(line); line = w }
    else line = test
  }
  if (line) lines.push(line)
  const pad = 10
  const lineH = 18
  const bw = maxW + pad * 2
  const bh = lines.length * lineH + pad * 2
  const bx = canvasW / 2 - bw / 2
  const by = -bh - 16

  ctx.save()
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  drawRoundRectPath(ctx, bx + 3, by + 3, bw, bh, 12)
  ctx.fill()
  // Bubble
  ctx.fillStyle = '#FFFDE7'
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 2.5
  drawRoundRectPath(ctx, bx, by, bw, bh, 12)
  ctx.fill(); ctx.stroke()
  // Tail
  ctx.beginPath()
  ctx.moveTo(canvasW / 2 - 8, by + bh)
  ctx.lineTo(canvasW / 2, by + bh + 16)
  ctx.lineTo(canvasW / 2 + 8, by + bh)
  ctx.fillStyle = '#FFFDE7'
  ctx.fill()
  ctx.strokeStyle = C.outline
  ctx.lineWidth = 2
  ctx.stroke()
  // Text
  ctx.fillStyle = '#2C3E50'
  ctx.font = '13px Patrick Hand, sans-serif'
  ctx.textAlign = 'center'
  lines.forEach((l, i) => ctx.fillText(l, canvasW / 2, by + pad + 14 + i * lineH))
  ctx.restore()
}

function drawSparkles(ctx, t) {
  const positions = [[30, 20], [170, 15], [15, 130], [185, 100], [95, 5]]
  ctx.save()
  positions.forEach(([x, y], i) => {
    const alpha = Math.abs(Math.sin(t * 0.1 + i))
    const size = 6 + Math.sin(t * 0.15 + i) * 2
    ctx.globalAlpha = alpha * 0.9
    ctx.fillStyle = C.star
    ctx.strokeStyle = C.outline
    ctx.lineWidth = 1
    // 4-point star
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size * 0.3, y - size * 0.3)
    ctx.lineTo(x + size, y)
    ctx.lineTo(x + size * 0.3, y + size * 0.3)
    ctx.lineTo(x, y + size)
    ctx.lineTo(x - size * 0.3, y + size * 0.3)
    ctx.lineTo(x - size, y)
    ctx.lineTo(x - size * 0.3, y - size * 0.3)
    ctx.closePath()
    ctx.fill(); ctx.stroke()
  })
  ctx.restore()
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────
function drawRoundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
  ctx.save()
  ctx.fillStyle = fill
  ctx.strokeStyle = stroke
  ctx.lineWidth = lw
  drawRoundRectPath(ctx, x, y, w, h, r)
  ctx.fill(); ctx.stroke()
  ctx.restore()
}

function drawRoundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
