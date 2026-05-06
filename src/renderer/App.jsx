import React, { useState, useEffect, useRef, useCallback } from 'react'
import BmoThreeJs from './components/BmoThreeJs.jsx'
import { useBmoMood } from './hooks/useBmoMood.js'
import './styles.css'

export default function App() {
  const [messages, setMessages] = useState([]);
  const [bmoBubbleText, setBmoBubbleText] = useState("");
  const { mood, startThinking, startTalking, celebrate, showError } =
    useBmoMood();

  // ── Suprimir menú contextual del OS (click derecho = rotar BMO) ───────────
  useEffect(() => {
    const noCtx = (e) => e.preventDefault()
    window.addEventListener('contextmenu', noCtx)
    return () => window.removeEventListener('contextmenu', noCtx)
  }, [])

  // ── Drag de ventana — ref directo al wrapper ───────────────────────────────
  const bmoWrapperRef = React.useRef(null);
  const [physicsDrag, setPhysicsDrag] = useState({ vx: 0, vy: 0 });
  const physicsVelRef = useRef({ vx: 0, vy: 0 });
  const decayTimerRef = useRef(null);


  useEffect(() => {
    const el = bmoWrapperRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;

    const onMouseDown = (e) => {
      const onRotation = e.target.closest('.positioning');

      if (e.button === 0) {
        dragging = true;
        startX = e.screenX;
        startY = e.screenY;
        e.preventDefault();
        // Parar el decay cuando empieza un nuevo drag
        if (decayTimerRef.current) clearInterval(decayTimerRef.current);
      }
    };

    const onMouseMove = (e) => {
      if (!dragging) return;
      const dx = e.screenX - startX;
      const dy = e.screenY - startY;
      startX = e.screenX;
      startY = e.screenY;
      window.bmo?.drag({ deltaX: dx, deltaY: dy });

      // Actualizar velocidad para la física
      physicsVelRef.current = { vx: dx, vy: dy };
      setPhysicsDrag({ vx: dx, vy: dy });
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      // Decaer la velocidad gradualmente al soltar
      decayTimerRef.current = setInterval(() => {
        physicsVelRef.current = {
          vx: physicsVelRef.current.vx * 0.8,
          vy: physicsVelRef.current.vy * 0.8,
        };
        const { vx, vy } = physicsVelRef.current;
        setPhysicsDrag({ vx, vy });
        if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
          clearInterval(decayTimerRef.current);
          setPhysicsDrag({ vx: 0, vy: 0 });
        }
      }, 16);
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      {/* ref directo — mousedown se registra exactamente en este elemento */}
      <div
        className="bmo-wrapper"
        ref={bmoWrapperRef}
      >
        <BmoThreeJs 
          physicsDrag={physicsDrag} 
          mood={mood}
        />
      </div>
    </div>
  );
}

