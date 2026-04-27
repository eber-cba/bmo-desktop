import { describe, it, expect, vi } from 'vitest'

// Mock de electron y child_process antes de importar tools
vi.mock('electron', () => ({
  shell: { openExternal: vi.fn().mockResolvedValue(undefined) },
  app: { getPath: vi.fn(() => '/tmp'), getDesktopPath: vi.fn() }
}))

vi.mock('child_process', () => ({
  exec: vi.fn((cmd, cb) => cb && cb(null, '', ''))
}))

vi.mock('fs', () => ({
  default: { writeFileSync: vi.fn() }
}))

const { executeTool, tools } = await import('../main/tools/index.js')

describe('Tools - Fase 5', () => {
  describe('get_time', () => {
    it('retorna éxito y la hora actual', async () => {
      const result = await executeTool('get_time', {})
      expect(result.success).toBe(true)
      expect(result.result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('open_url', () => {
    it('falla con URL sin protocolo http', async () => {
      const result = await executeTool('open_url', { url: 'youtube.com' })
      expect(result.success).toBe(false)
    })

    it('éxito con URL válida https://', async () => {
      const result = await executeTool('open_url', { url: 'https://google.com' })
      expect(result.success).toBe(true)
    })

    it('falla sin URL', async () => {
      const result = await executeTool('open_url', {})
      expect(result.success).toBe(false)
    })
  })

  describe('open_app', () => {
    it('falla con app desconocida', async () => {
      const result = await executeTool('open_app', { app_name: 'photoshop' })
      expect(result.success).toBe(false)
      expect(result.result).toContain('No conozco')
    })

    it('lista los nombres de apps disponibles en el mensaje de error', async () => {
      const result = await executeTool('open_app', { app_name: 'xyz' })
      expect(result.result).toContain('calculadora')
    })
  })

  describe('create_file', () => {
    it('falla sin nombre de archivo', async () => {
      const result = await executeTool('create_file', {})
      expect(result.success).toBe(false)
    })

    it('éxito creando un archivo', async () => {
      const result = await executeTool('create_file', { filename: 'test.txt', content: 'Hola BMO' })
      expect(result.success).toBe(true)
      expect(result.result).toContain('test.txt')
    })
  })

  describe('tool desconocida', () => {
    it('retorna error para tool inexistente', async () => {
      const result = await executeTool('volar', {})
      expect(result.success).toBe(false)
    })
  })
})
