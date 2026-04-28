import React, { useEffect } from 'react'

export default function Toast({ message, isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <div className={`toast-container ${isVisible ? 'toast-visible' : ''}`}>
      <div className="toast-icon">🔔</div>
      <div className="toast-message">{message}</div>
    </div>
  )
}
