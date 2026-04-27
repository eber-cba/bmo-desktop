import { useState, useEffect, useRef } from 'react'

/**
 * Hook que gestiona el estado emocional de BMO.
 * El mood se propaga a las animaciones del canvas.
 */
export function useBmoMood() {
  const [mood, setMood] = useState('idle')
  const idleTimer = useRef(null)

  const setMoodTemporarily = (newMood, duration = 3000) => {
    setMood(newMood)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => setMood('idle'), duration)
  }

  // Cuando BMO empieza a pensar
  const startThinking = () => setMood('thinking')

  // Cuando BMO termina de pensar y va a hablar
  const startTalking = (duration = 4000) => setMoodTemporarily('talking', duration)

  // Cuando BMO está contento (respuesta exitosa)
  const celebrate = () => setMoodTemporarily('happy', 2000)

  // Cuando hay un error
  const showError = () => setMoodTemporarily('confused', 2000)

  // Inactividad larga → BMO se aburre
  useEffect(() => {
    const boredomTimer = setTimeout(() => {
      if (mood === 'idle') setMood('sleepy')
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearTimeout(boredomTimer)
  }, [mood])

  useEffect(() => () => clearTimeout(idleTimer.current), [])

  return { mood, setMood, startThinking, startTalking, celebrate, showError }
}
