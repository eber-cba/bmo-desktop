import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock de fs y electron para poder testear el MemoryManager
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
  }
}))

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/bmo-test')
  }
}))

// Importación dinámica después de los mocks
const { MemoryManager } = await import('../main/memory/manager.js')

describe('MemoryManager', () => {
  let memory

  beforeEach(() => {
    memory = new MemoryManager()
  })

  it('inicializa con historial vacío', () => {
    expect(memory.getHistory()).toEqual([])
  })

  it('agrega mensajes al historial', () => {
    memory.addHistory([
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola! Soy BMO.' }
    ])
    expect(memory.getHistory()).toHaveLength(2)
  })

  it('mantiene solo los últimos 20 mensajes', () => {
    const msgs = Array.from({ length: 25 }, (_, i) => ({
      role: 'user', content: `Mensaje ${i}`
    }))
    memory.addHistory(msgs)
    expect(memory.getHistory().length).toBeLessThanOrEqual(20)
  })

  it('guarda y recupera hechos sobre el usuario', () => {
    memory.setFact('name', 'Eber')
    memory.setFact('language', 'JavaScript')
    const facts = memory.getFacts()
    expect(facts.name).toBe('Eber')
    expect(facts.language).toBe('JavaScript')
  })

  it('getFacts retorna objeto vacío si no hay hechos', () => {
    expect(memory.getFacts()).toEqual({})
  })
})
