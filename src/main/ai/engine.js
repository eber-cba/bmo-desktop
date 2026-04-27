import { BMO_SYSTEM_PROMPT } from './prompts/bmo.js'
import { memoryManager } from '../memory/manager.js'

/**
 * Motor de IA principal.
 * Se comunica con Ollama u OpenAI dependiendo de las variables de entorno.
 */
export class AIEngine {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'ollama'
    this.model = process.env.AI_MODEL || 'llama3'
    this.ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  }

  /**
   * Envía un mensaje a la IA y obtiene la respuesta.
   * @param {Array} history - Historial de mensajes [{ role: 'user'|'assistant', content: string }]
   * @returns {Promise<string>} La respuesta de BMO
   */
  async ask(history) {
    if (this.provider === 'ollama') {
      return this._askOllama(history)
    } else {
      throw new Error(`Proveedor de IA no soportado: ${this.provider}`)
    }
  }

  async _askOllama(history) {
    // Obtener hechos recordados para personalizar la respuesta
    const facts = memoryManager.getFacts()
    const factsStr = Object.entries(facts)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n')

    const systemPromptWithMemory = `
${BMO_SYSTEM_PROMPT}

COSAS QUE RECUERDAS SOBRE EL USUARIO:
${factsStr || 'Aún no sabes mucho sobre el usuario. ¡Pregúntale su nombre!'}
`

    const messages = [
      { role: 'system', content: systemPromptWithMemory },
      ...history
    ]

    try {
      const response = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.message.content
    } catch (error) {
      console.error('[AI Engine] Error llamando a Ollama:', error.message)
      // Fallback amigable si Ollama no está corriendo
      return '¡Piii piii! Mi procesador principal no está conectado (Error de IA). ¿Encendiste a Ollama?'
    }
  }
}

export const aiEngine = new AIEngine()
