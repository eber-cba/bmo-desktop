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
  async ping() {
    if (this.provider === 'ollama') {
      const res = await fetch(`${this.ollamaUrl}/api/tags`)
      if (!res.ok) throw new Error('No ok')
      return true
    }
    return true
  }

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

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Ollama no devolvió JSON. Respuesta: ${text.slice(0, 50)}...`)
      }

      const data = await response.json()
      const rawContent = data.message.content.trim()

      // Detectar si la IA quiere usar una herramienta (responde con JSON)
      const toolCall = this._parseToolCall(rawContent)
      if (toolCall) {
        return { type: 'tool', ...toolCall }
      }

      return { type: 'text', content: rawContent }
    } catch (error) {
      console.error('[AI Engine] Error llamando a Ollama:', error.message)
      return { type: 'text', content: '¡Piii piii! Mi procesador principal no está conectado (Error de IA). ¿Encendiste a Ollama?' }
    }
  }

  /**
   * Intenta parsear el contenido como un tool call JSON.
   * @returns {{ tool, params }} o null
   */
  _parseToolCall(content) {
    try {
      // Buscar un JSON dentro del texto por si la IA añade algo extra
      const jsonMatch = content.match(/\{[\s\S]*"tool"[\s\S]*\}/)
      if (!jsonMatch) return null
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.tool && parsed.params !== undefined) return parsed
    } catch {}
    return null
  }
}

export const aiEngine = new AIEngine()
