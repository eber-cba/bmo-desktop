import { useEffect, useRef } from 'react'
import './BmoCss3D.css'

/* ─── Rotación Y con drag de botón derecho ─────────────────────── */
function initDragRotation(positioningEl) {
  let dragging = false
  let startX = 0
  let currentY = 20  // ángulo inicial

  positioningEl.style.transform = `rotateY(${currentY}deg)`

  function onMouseDown(e) {
    if (e.button !== 2) return   // solo botón derecho
    dragging = true
    startX = e.clientX
    e.preventDefault()
    e.stopPropagation()
  }

  function onMouseMove(e) {
    if (!dragging) return
    const dx = e.clientX - startX
    startX = e.clientX
    currentY += dx * 0.8
    positioningEl.style.transform = `rotateY(${currentY}deg)`
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
}) {
  const rootRef        = useRef(null)
  const positioningRef = useRef(null)

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
            <div className="bmo">

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
