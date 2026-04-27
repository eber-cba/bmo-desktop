export function getHardcodedResponse(input) {
  const text = input.toLowerCase()
  
  if (text.includes('hola') || text.includes('buenas')) {
    return '¡Hola! Soy BMO. ¿A qué vamos a jugar hoy?'
  }
  if (text.includes('hora') || text.includes('qué hora')) {
    const now = new Date()
    return `Son las ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ¡Hora de aventura!`
  }
  if (text.includes('adiós') || text.includes('chau')) {
    return '¡Chau chau! Me voy a dormir un ratito.'
  }
  if (text.includes('eres') || text.includes('quién eres')) {
    return 'Soy BMO, una consola de videojuegos viva, compañero de cuarto y chef ocasional.'
  }
  
  return 'Mmm... no entiendo eso. ¿Quieres jugar a las escondidas?'
}
