import React, { useState, useEffect, useRef, useCallback } from 'react'
import BmoCss3D from './components/BmoCss3D.jsx'
import BmoThreeJs from './components/BmoThreeJs.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import Toast from './components/Toast.jsx'
import { useBmoMood } from './hooks/useBmoMood.js'
import './styles.css'

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [bmoBubbleText, setBmoBubbleText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { mood, startThinking, startTalking, celebrate, showError } =
    useBmoMood();

  const [toast, setToast] = useState({ isVisible: false, message: "" });

  const showToast = (message) => setToast({ isVisible: true, message });

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

  // ── Cargar historial al iniciar ────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      if (window.bmo?.getHistory) {
        const history = await window.bmo.getHistory();
        setMessages(
          history?.length > 0
            ? history
            : [
                {
                  text: "¡Hola! Soy BMO. ¿En qué puedo ayudarte hoy? 🎮",
                  sender: "bmo",
                },
              ],
        );
      }
    }
    loadHistory();
  }, []);

  // ── Auto-ocultar burbuja ───────────────────────────────────────────────────
  useEffect(() => {
    if (bmoBubbleText) {
      const timer = setTimeout(() => setBmoBubbleText(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [bmoBubbleText]);

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const newMsgs = [...messages, { text, sender: "user" }];
    setMessages(newMsgs);
    setIsTyping(true);
    startThinking();

    try {
      const bmoHistory = newMsgs.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await window.bmo.ask(bmoHistory);

      setIsTyping(false);

      if (response.type === "tool") {
        setMessages((prev) => [
          ...prev,
          {
            text: response.result,
            sender: "tool",
            toolName: response.toolName,
          },
        ]);
        setBmoBubbleText("¡Ejecutando proceso! ⚙️");
        celebrate();
      } else {
        setMessages((prev) => [
          ...prev,
          { text: response.content, sender: "bmo" },
        ]);
        setBmoBubbleText(response.content);
        startTalking();
      }
    } catch (err) {
      setIsTyping(false);
      showError();
      setBmoBubbleText("¡Piii piii! Error de sistema ⚡");
    }
  };

  return (
    <div className="app-container">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* ref directo — mousedown se registra exactamente en este elemento */}
      <div
        className="bmo-wrapper"
        ref={bmoWrapperRef}
      >
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
        <BmoThreeJs 
          physicsDrag={physicsDrag} 
          onDoubleClick={() => setIsChatOpen(true)}
        />
      </div>
    </div>
  );
}
