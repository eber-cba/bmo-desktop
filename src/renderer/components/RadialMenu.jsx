import React from 'react'

export default function RadialMenu({ isOpen, x, y, onClose, actions }) {
  if (!isOpen) return null

  return (
    <>
      <div 
        className="radial-overlay" 
        onClick={onClose} 
        onContextMenu={(e) => { e.preventDefault(); onClose() }} 
      />
      <div className="radial-menu" style={{ left: x, top: y }}>
        {actions.map((act, i) => {
          const angle = (i / actions.length) * 2 * Math.PI - Math.PI / 2
          const radius = 65 // distancia desde el centro
          const tx = Math.cos(angle) * radius
          const ty = Math.sin(angle) * radius

          return (
            <button
              key={i}
              className="radial-btn"
              style={{ 
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))` 
              }}
              onClick={() => { act.onClick(); onClose() }}
              title={act.label}
            >
              {act.icon}
            </button>
          )
        })}
        {/* Centro del menú */}
        <div className="radial-center" onClick={onClose}>✖</div>
      </div>
    </>
  )
}
