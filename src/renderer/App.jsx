import { useState, useEffect } from 'react'
import BmoCharacter from './components/BmoCharacter.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import RadialMenu from './components/RadialMenu.jsx'
import Toast from './components/Toast.jsx'
import { useBmoMood } from './hooks/useBmoMood.js'
import './styles.css'

export default function App() {
  const [isChatOpen, setIsChatOpen]   = useState(false)
  const [messages, setMessages]       = useState([])
  const [bmoBubbleText, setBmoBubbleText] = useState('')
  const [isTyping, setIsTyping]       = useState(false)
  const { mood, startThinking, startTalking, celebrate, showError } = useBmoMood()

  const [radialMenu, setRadialMenu] = useState({ isOpen: false, x: 0, y: 0 })
  const [toast, setToast] = useState({ isVisible: false, message: '' })

  const showToast = (message) => setToast({ isVisible: true, message })

  const radialActions = [
    { label: 'Chat', icon: '💬', onClick: () => setIsChatOpen(prev => !prev) },
    { label: 'YouTube', icon: '🎵', onClick: () => { window.bmo?.executeTool('open_url', { url: 'https://youtube.com' }); showToast('Abriendo YouTube') } },
    { label: 'Calculadora', icon: '🧮', onClick: () => { window.bmo?.executeTool('open_app', { app_name: 'calc' }); showToast('Abriendo Calculadora') } },
    { label: 'Cerrar App', icon: '❌', onClick: () => window.close() }
  ]

  // ── Drag del personaje ─────────────────────────────────────────────────────
  useEffect(() => {
    let dragging = false
    let startX = 0, startY = 0

    const onMouseDown = (e) => {
      if (e.target.tagName === 'CANVAS') {
        if (e.button === 2) {
          // Click derecho -> Menú Radial
          setRadialMenu({ isOpen: true, x: e.clientX, y: e.clientY })
          return
        }
        dragging = true
        startX = e.screenX
        startY = e.screenY
      }
    }
    const onMouseMove = (e) => {
      if (!dragging) return
      const dx = e.screenX - startX
      const dy = e.screenY - startY
      startX = e.screenX
      startY = e.screenY
      window.bmo?.drag({ deltaX: dx, deltaY: dy })
    }
    const onMouseUp = () => { dragging = false }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // ── Cargar historial al iniciar ────────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      if (window.bmo?.getHistory) {
        const history = await window.bmo.getHistory()
        setMessages(history?.length > 0
          ? history
          : [{ text: '¡Hola! Soy BMO. ¿En qué puedo ayudarte hoy? 🎮', sender: 'bmo' }]
        )
      }
    }
    loadHistory()
  }, [])

  // ── Auto-ocultar burbuja ───────────────────────────────────────────────────
  useEffect(() => {
    if (!bmoBubbleText) return
    const t = setTimeout(() => setBmoBubbleText(''), 5000)
    return () => clearTimeout(t)
  }, [bmoBubbleText])

  // ── Toggle chat ────────────────────────────────────────────────────────────
  const handleBmoClick = () => {
    setIsChatOpen(prev => !prev)
    celebrate()
  }

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    const userMsg = { text, sender: 'user' }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setIsTyping(true)
    startThinking()

    try {
      const history = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      let responseText = ''
      let isTool = false

      if (window.bmo?.sendMessage) {
        const aiResponse = await window.bmo.sendMessage(history)
        if (aiResponse && typeof aiResponse === 'object') {
          isTool = aiResponse.type === 'tool'
          responseText = isTool ? aiResponse.result : aiResponse.content
        } else {
          responseText = aiResponse || '[Sin respuesta]'
        }
      } else {
        responseText = '[Modo Offline] No puedo conectar con mi cerebro. 🔋'
      }

      const bmoMsg = { text: responseText, sender: 'bmo', isTool }
      setMessages([...newMessages, bmoMsg])
      setBmoBubbleText(responseText.slice(0, 80) + (responseText.length > 80 ? '...' : ''))
      startTalking(Math.min(responseText.length * 40, 6000))
      if (isTool) celebrate()

    } catch (err) {
      console.error(err)
      setMessages([...newMessages, { text: '¡Uy! Me mareé. Error de conexión. 😵', sender: 'bmo' }])
      showError()
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="app-container">
      <Toast message={toast.message} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
      
      <RadialMenu 
        isOpen={radialMenu.isOpen} 
        x={radialMenu.x} 
        y={radialMenu.y} 
        onClose={() => setRadialMenu(prev => ({ ...prev, isOpen: false }))} 
        actions={radialActions} 
      />

      <div className={`bmo-wrapper ${radialMenu.isOpen ? 'is-menu-open' : ''}`}>
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
        <BmoCharacter
          onClick={handleBmoClick}
          bubbleText={bmoBubbleText}
          mood={mood}
        />
      </div>
    </div>
  )
}
