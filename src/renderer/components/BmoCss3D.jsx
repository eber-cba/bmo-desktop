import { useEffect, useRef, useState } from 'react'
import './BmoCss3D.css'

/* ─── Rotación trackball completa (click derecho) ───────────────── */
function initDragRotation(positioningEl) {
  let dragging = false
  let startX   = 0
  let startY   = 0
  let currentY = 20   // rotación horizontal (eje Y)
  let currentX = -10  // rotación vertical   (eje X)

  const applyTransform = () => {
    positioningEl.style.transform = `rotateY(${currentY}deg) rotateX(${currentX}deg)`
  }
  applyTransform()

  function onMouseDown(e) {
    if (e.button !== 2) return
    dragging = true
    startX = e.clientX
    startY = e.clientY
    e.preventDefault()
    e.stopPropagation()
  }

  function onMouseMove(e) {
    if (!dragging) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    startX = e.clientX
    startY = e.clientY
    currentY += dx * 0.8   // horizontal → gira en Y
    currentX -= dy * 0.8   // vertical   → inclina en X (invertido para natural)
    applyTransform()
    e.preventDefault()
  }

  function onMouseUp(e) {
    if (e.button === 2) dragging = false
  }

  positioningEl.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  return () => {
    positioningEl.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
}

/* ─────────────────────────────────────────────────────────────────
   BmoCss3D — Componente aislado y extensible

   Props de interactividad (todas opcionales):
   • onDpadClick()         — D-pad presionado
   • onBigButtonClick()    — Botón rojo grande
   • onSmallButtonClick()  — Botón verde pequeño
   • onTriangleClick()     — Botón triángulo
   • onFaceClick()         — Click en la pantalla/cara
   • onLeftArmClick()      — Click en el brazo izquierdo
   • onRightArmClick()     — Click en el brazo derecho
   • onLeftLegClick()      — Click en la pierna izquierda
   • onRightLegClick()     — Click en la pierna derecha
   • onBodyClick()         — Click en el cuerpo en general

   Props de apariencia:
   • screenContent         — ReactNode personalizado en la pantalla
   • mood                  — 'neutral' | 'happy' | 'thinking' (futuro)
   ───────────────────────────────────────────────────────────────── */
export default function BmoCss3D({
  onDpadClick        = null,
  onBigButtonClick   = null,
  onSmallButtonClick = null,
  onTriangleClick    = null,
  onFaceClick        = null,
  onLeftArmClick     = null,
  onRightArmClick    = null,
  onLeftLegClick     = null,
  onRightLegClick    = null,
  onBodyClick        = null,
  screenContent      = null,
  mood               = 'neutral',
  physicsDrag        = { vx: 0, vy: 0 },
}) {
  const rootRef        = useRef(null)
  const positioningRef = useRef(null)
  const bmoRef         = useRef(null)

  // ── Física de resorte para brazos y piernas ─────────────────────────────
  // arm-swing: ángulo extra en rotateX del brazo (responde a vy)
  // leg-swing: ángulo extra en rotateZ de la pierna (responde a vx)
  const springRef = useRef({
    armAngle: 0,   armVel: 0,
    legAngle: 0,   legVel: 0,
  })
  const dragVelRef = useRef({ vx: 0, vy: 0 })
  const rafRef = useRef(null)

  // Stiffness y damping del resorte
  const STIFFNESS = 0.18
  const DAMPING   = 0.72
  const MAX_SWING = 35   // grados máximos
  const VEL_SCALE = 3.5  // cuánto influye la velocidad del drag

  useEffect(() => {
    // Actualizar velocidad de drag cuando cambia el prop
    dragVelRef.current = physicsDrag
  }, [physicsDrag])

  useEffect(() => {
    function tick() {
      const s = springRef.current
      const { vx, vy } = dragVelRef.current

      // Fuerza externa = velocidad del drag escalada
      const armForce = vy * VEL_SCALE   // drag vertical mueve brazos
      const legForce = vx * VEL_SCALE   // drag horizontal mueve piernas

      // Spring-damper: a = -k*x - c*v + F
      const armAcc = -STIFFNESS * s.armAngle - (1 - DAMPING) * s.armVel + armForce * 0.12
      const legAcc = -STIFFNESS * s.legAngle - (1 - DAMPING) * s.legVel + legForce * 0.12

      s.armVel += armAcc
      s.legVel += legAcc
      s.armAngle = Math.max(-MAX_SWING, Math.min(MAX_SWING, s.armAngle + s.armVel))
      s.legAngle = Math.max(-MAX_SWING, Math.min(MAX_SWING, s.legAngle + s.legVel))

      // Aplicar via CSS custom properties en el elemento .bmo
      if (bmoRef.current) {
        bmoRef.current.style.setProperty('--arm-swing', `${s.armAngle.toFixed(2)}deg`)
        bmoRef.current.style.setProperty('--leg-swing', `${s.legAngle.toFixed(2)}deg`)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ── Rotación + prevención de menú contextual del OS ──
  useEffect(() => {
    if (!positioningRef.current || !rootRef.current) return

    const cleanDrag = initDragRotation(positioningRef.current)

    // Suprimir el menú contextual del navegador/Electron en TODO el BMO
    const noCtxMenu = (e) => e.preventDefault()
    rootRef.current.addEventListener('contextmenu', noCtxMenu)

    return () => {
      cleanDrag()
      rootRef.current?.removeEventListener('contextmenu', noCtxMenu)
    }
  }, [])

  // ── Helpers para callbacks seguros ──
  const handle = (cb) => cb ? (e) => { e.stopPropagation(); cb(e) } : null

  return (
    <div className="bmo3d-root" ref={rootRef} onClick={handle(onBodyClick)}>
      <div className="bmo3d-scale-wrapper">
        <div className="bmo3d-stage">
          <div className="positioning" ref={positioningRef}>
            <div className="bmo" ref={bmoRef}>

              {/* BACK */}
              <figure className="back">
                <div className="slit"/><div className="slit"/>
                <div className="slit"/><div className="slit"/>
                <div className="slit"/>
                <div className="backpanel">
                  <span className="screw"/><span className="screw"/>
                  <span className="screw"/><span className="screw"/>
                </div>
                <div className="tapeslot"/>
              </figure>

              {/* FRONT */}
              <figure className="front">
                {/* ── Pantalla / cara ── */}
                <div
                  className={`face${onFaceClick ? ' face--clickable' : ''}`}
                  onClick={handle(onFaceClick)}
                >
                  <span className="eye lefteye"/>
                  <span className="eye righteye"/>
                  <span className="smile"/>

                  {/* Contenido personalizable de la pantalla */}
                  {screenContent && (
                    <div className="screen-custom">{screenContent}</div>
                  )}

                  {/* Mensajes por defecto (activados por botones) */}
                  <div className="message1">
                    <h1>Back<br/>in<br/>5 Min</h1>
                  </div>
                  <div className="message2">
                    <img src="https://www.joshuawinn.com/wp-content/uploads/2015/07/dancing_bug.gif" alt="dancing"/>
                  </div>
                  <div className="message3">
                    <img src="https://www.joshuawinn.com/wp-content/uploads/2015/07/bmo_skateboard.gif" alt="skateboard"/>
                  </div>
                </div>

                <div className="frontbuttons-flat">
                  <span className="slot"/>
                  <span className="port leftport"/>
                  <span className="port rightport"/>
                  <span className="port tinyport"/>
                </div>

                {/* ── Botones frontales ── */}
                <div className="frontbuttons">
                  {/* D-pad */}
                  <div
                    className="thedpad"
                    onClick={handle(onDpadClick)}
                    title="D-pad"
                  >
                    <div className="dpad">
                      <div className="square-top"/><div className="square-top"/>
                      <div className="square-top"/><div className="square-top"/>
                      <div className="square-top"/>
                    </div>
                    <div className="dpad">
                      {Array.from({length:12}).map((_,i)=><div key={i} className="square-edge"/>)}
                    </div>
                  </div>

                  {/* Círculo rojo (grande) */}
                  <div
                    className="circlebig"
                    onClick={handle(onBigButtonClick)}
                    title="Botón rojo"
                  >
                    <div className="edges">
                      {Array.from({length:20}).map((_,i)=><div key={i} className="edge"/>)}
                    </div>
                  </div>

                  {/* Círculo verde (pequeño) */}
                  <div
                    className="circlesmall"
                    onClick={handle(onSmallButtonClick)}
                    title="Botón verde"
                  >
                    <div className="edges">
                      {Array.from({length:16}).map((_,i)=><div key={i} className="edge"/>)}
                    </div>
                  </div>

                  {/* Triángulo */}
                  <div
                    className="triangle"
                    onClick={handle(onTriangleClick)}
                    title="Triángulo"
                  >
                    <div className="topleft"/>
                    <div className="topright"/>
                  </div>
                </div>
              </figure>

              {/* LADO IZQUIERDO — brazo izquierdo */}
              <figure className="left" onClick={handle(onLeftArmClick)}>
                <div className="speaker">
                  <span/><span/><br/>
                  <span/><span/><span/><br/>
                  <span/><span/>
                </div>
                <h1 className="label">BMO</h1>
                <div className="arm"/>
              </figure>

              {/* LADO DERECHO — brazo derecho */}
              <figure className="right" onClick={handle(onRightArmClick)}>
                <div className="speaker">
                  <span/><span/><br/>
                  <span/><span/><span/><br/>
                  <span/><span/>
                </div>
                <h1 className="label">BMO</h1>
                <div className="arm"/>
              </figure>

              <figure className="top"/>

              {/* ABAJO — piernas */}
              <figure className="bottom">
                <div
                  className="leg"
                  onClick={handle(onLeftLegClick)}
                  title="Pierna izquierda"
                />
                <div
                  className="leg left"
                  onClick={handle(onRightLegClick)}
                  title="Pierna derecha"
                />
              </figure>

              {/* Esquinas redondeadas 3D */}
              <div className="topleftcorner">
                {Array.from({length:8}).map((_,i)=><div key={i} className="corner"/>)}
              </div>
              <div className="toprightcorner">
                {Array.from({length:8}).map((_,i)=><div key={i} className="corner"/>)}
              </div>
              <div className="bottomleftcorner">
                {Array.from({length:8}).map((_,i)=><div key={i} className="corner"/>)}
              </div>
              <div className="bottomrightcorner">
                {Array.from({length:8}).map((_,i)=><div key={i} className="corner"/>)}
              </div>

            </div>{/* .bmo */}
          </div>{/* .positioning */}
        </div>{/* .bmo3d-stage */}
      </div>{/* .bmo3d-scale-wrapper */}
    </div>
  )
}
