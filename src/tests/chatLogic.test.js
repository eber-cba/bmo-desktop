import { describe, it, expect } from 'vitest'
import { getHardcodedResponse } from '../renderer/utils/chatLogic.js'

describe('chatLogic - getHardcodedResponse (fallback offline)', () => {
  it('responde al saludo con "hola"', () => {
    const res = getHardcodedResponse('hola')
    expect(res).toContain('BMO')
  })

  it('responde al saludo con "buenas"', () => {
    const res = getHardcodedResponse('buenas')
    expect(res).toContain('BMO')
  })

  it('responde con la hora actual', () => {
    const res = getHardcodedResponse('qué hora es')
    expect(res).toMatch(/\d{1,2}:\d{2}/)
  })

  it('responde al despedirse con "chau"', () => {
    const res = getHardcodedResponse('chau')
    expect(res.toLowerCase()).toMatch(/chau|dormir/)
  })

  it('se presenta cuando le preguntan quién es', () => {
    const res = getHardcodedResponse('quién eres')
    expect(res.toLowerCase()).toContain('bmo')
  })

  it('responde algo por defecto ante input desconocido', () => {
    const res = getHardcodedResponse('xyzzy_input_raro')
    expect(typeof res).toBe('string')
    expect(res.length).toBeGreaterThan(0)
  })

  it('la respuesta por defecto no es un error', () => {
    const res = getHardcodedResponse('')
    expect(res).not.toThrow
    expect(typeof res).toBe('string')
  })
})
