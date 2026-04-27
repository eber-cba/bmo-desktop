import { useState, useEffect } from 'react'
import BmoCharacter from './components/BmoCharacter.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import './styles.css'

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { text: '¡Hola! Escribe algo para hablar conmigo.', sender: 'bmo' }
  ])
  const [bmoBubbleText, setBmoBubbleText] = useState('')

  const [isTyping, setIsTyping] = useState(false)

  const toggleChat = () => setIsChatOpen(!isChatOpen)

  const handleSendMessage = async (text) => {
    // 1. Agregar mensaje del usuario
    const userMsg = { text, sender: 'user' }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setIsTyping(true)

    try {
      // 2. Formatear historial para la IA (rol: 'user' | 'assistant')
      const history = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))

      // 3. Llamar al backend de Electron (que a su vez llama a Ollama/OpenAI)
      let responseText = ''
      if (window.bmo?.sendMessage) {
        responseText = await window.bmo.sendMessage(history)
      } else {
        responseText = '[Modo Offline] No puedo conectar con mi cerebro principal.'
      }

      setMessages([...newMessages, { text: responseText, sender: 'bmo' }])
      setBmoBubbleText(responseText)
    } catch (err) {
      console.error(err)
      setMessages([...newMessages, { text: '¡Uy! Me mareé. Error de conexión.', sender: 'bmo' }])
    } finally {
      setIsTyping(false)
    }
  }

  // Ocultar burbuja automáticamente
  useEffect(() => {
    if (bmoBubbleText) {
      const timer = setTimeout(() => setBmoBubbleText(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [bmoBubbleText])

  return (
    <div className="app-container">
      {/* 
        BMO y el Chat Panel. 
        El Chat Panel está a la derecha. 
        Acomodamos a BMO para que no se superpongan si el panel está abierto.
      */}
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px',
        transform: isChatOpen ? 'translateX(-100px)' : 'translateX(0)',
        transition: 'transform 0.3s ease'
      }}>
        <BmoCharacter 
          onClick={toggleChat} 
          bubbleText={bmoBubbleText} 
        />
        <ChatPanel 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
        {isTyping && <div style={{ position: 'absolute', bottom: '15px', right: '350px', fontSize: '12px', color: '#666', background: 'white', padding: '4px 8px', borderRadius: '10px' }}>BMO está pensando...</div>}
      </div>
    </div>
  )
}
