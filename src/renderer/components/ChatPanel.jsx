import { useState, useRef, useEffect } from 'react'

export default function ChatPanel({ isOpen, onClose, onSendMessage, messages, isTyping }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    onSendMessage(inputValue)
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className={`chat-panel ${isOpen ? 'chat-panel--open' : ''}`}>
      {/* ── Header ── */}
      <div className="chat-header">
        <div className="chat-header__left">
          <div className="chat-avatar">BMO</div>
          <div>
            <div className="chat-title">¡Soy BMO!</div>
            <div className="chat-subtitle">Tu compañero de aventuras 🎮</div>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} title="Cerrar">×</button>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <span>¡Hacé click en BMO para hablar! 👾</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`msg-wrapper msg-wrapper--${msg.sender}`}>
            {msg.sender === 'bmo' && (
              <div className="msg-avatar">B</div>
            )}
            <div className={`msg-bubble msg-bubble--${msg.sender} ${msg.isTool ? 'msg-bubble--tool' : ''}`}>
              {msg.isTool && <span className="tool-badge">🛠️ Acción</span>}
              <span className="msg-text">{msg.text}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="msg-wrapper msg-wrapper--bmo">
            <div className="msg-avatar">B</div>
            <div className="msg-bubble msg-bubble--bmo msg-bubble--typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hablale a BMO... (Enter = enviar)"
          rows={1}
          autoFocus={isOpen}
        />
        <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
          <span>▶</span>
        </button>
      </form>

      {/* ── Quick Actions ── */}
      <div className="quick-actions">
        <span className="quick-label">Acciones rápidas:</span>
        <button className="quick-btn" onClick={() => onSendMessage('¿Qué hora es?')}>🕐 Hora</button>
        <button className="quick-btn" onClick={() => onSendMessage('Abrí YouTube')}>🎵 YT</button>
        <button className="quick-btn" onClick={() => onSendMessage('Abrí la calculadora')}>🧮 Calc</button>
        <button className="quick-btn" onClick={() => onSendMessage('Contame un chiste')}>😂 Chiste</button>
      </div>
    </div>
  )
}
