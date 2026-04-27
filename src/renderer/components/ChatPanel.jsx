import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ isOpen, onClose, onSendMessage, messages }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll al final cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSendMessage(inputValue)
    setInputValue('')
  }

  return (
    <div className={`chat-panel ${isOpen ? '' : 'hidden'}`}>
      <div className="chat-header">
        <span>Chat con BMO</span>
        <button className="close-chat" onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`msg ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Dile algo a BMO..."
          autoFocus={isOpen}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}
