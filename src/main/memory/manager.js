import fs from 'fs'
import path from 'path'
import { app } from 'electron'

/**
 * Gestiona la persistencia de datos de BMO (historial y hechos recordados).
 */
export class MemoryManager {
  constructor() {
    // Guardamos en la carpeta de datos de usuario de la app
    this.storagePath = path.join(app.getPath('userData'), 'bmo_memory.json')
    this.memory = {
      history: [],
      facts: {}, // Hechos sobre el usuario: { name: 'Eber', likes: ['programming'] }
      lastSession: new Date().toISOString()
    }
    this.load()
  }

  /**
   * Carga la memoria desde el archivo JSON.
   */
  load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf-8')
        this.memory = JSON.parse(data)
        console.log('[Memory] ✅ Memoria cargada desde:', this.storagePath)
      } else {
        this.save() // Crea el archivo inicial
      }
    } catch (err) {
      console.error('[Memory] ❌ Error cargando memoria:', err.message)
    }
  }

  /**
   * Guarda la memoria actual en el archivo JSON.
   */
  save() {
    try {
      this.memory.lastSession = new Date().toISOString()
      fs.writeFileSync(this.storagePath, JSON.stringify(this.memory, null, 2))
    } catch (err) {
      console.error('[Memory] ❌ Error guardando memoria:', err.message)
    }
  }

  /**
   * Agrega mensajes al historial y guarda.
   */
  addHistory(messages) {
    // Mantenemos solo los últimos 20 mensajes para no saturar el contexto
    this.memory.history = [...this.memory.history, ...messages].slice(-20)
    this.save()
  }

  getHistory() {
    return this.memory.history
  }

  /**
   * Guarda un hecho específico sobre el usuario.
   */
  setFact(key, value) {
    this.memory.facts[key] = value
    this.save()
  }

  getFacts() {
    return this.memory.facts
  }
}

export const memoryManager = new MemoryManager()
