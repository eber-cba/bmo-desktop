import { describe, it, expect } from 'vitest'
import { getHardcodedResponse } from '../../src/renderer/utils/chatLogic.js'

describe('chatLogic', () => {
  it('responde a un saludo', () => {
    const response = getHardcodedResponse('hola BMO')
    expect(response).toContain('Soy BMO')
  })

  it('responde a la despedida', () => {
    const response = getHardcodedResponse('adiós')
    expect(response).toContain('Chau chau')
  })

  it('da una respuesta por defecto cuando no entiende', () => {
    const response = getHardcodedResponse('algo que no entiende')
    expect(response).toContain('no entiendo eso')
  })

  it('da la hora cuando se le pregunta', () => {
    const response = getHardcodedResponse('qué hora es')
    expect(response).toContain('Son las')
  })
})
