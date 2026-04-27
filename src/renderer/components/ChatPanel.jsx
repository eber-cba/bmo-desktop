import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ isOpen, onClose, onSendMessage, messages, isTyping }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll al final cuando hay mensajes nuevos o BMO está escribiendo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

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
        {isTyping && (
          <div className="msg bmo typing">
            BMO está escribiendo<span>.</span><span>.</span><span>.</span>
          </div>
        )}
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
