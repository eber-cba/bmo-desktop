import { useState, useEffect } from 'react'
import BmoCharacter from './components/BmoCharacter.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import { getHardcodedResponse } from './utils/chatLogic.js'
import './styles.css'

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { text: '¡Hola! Escribe algo para hablar conmigo.', sender: 'bmo' }
  ])
  const [bmoBubbleText, setBmoBubbleText] = useState('')

  const toggleChat = () => setIsChatOpen(!isChatOpen)

  const handleSendMessage = (text) => {
    // 1. Agregar mensaje del usuario
    const newMessages = [...messages, { text, sender: 'user' }]
    setMessages(newMessages)

    // 2. Generar respuesta de BMO (simulada)
    setTimeout(() => {
      const responseText = getHardcodedResponse(text)
      setMessages([...newMessages, { text: responseText, sender: 'bmo' }])
      
      // Mostrar en la burbuja sobre BMO por 3 segundos
      setBmoBubbleText(responseText)
    }, 500)
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
      </div>
    </div>
  )
}
