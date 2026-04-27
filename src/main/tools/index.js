import { shell, app } from 'electron'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Registro de todas las herramientas que BMO puede ejecutar.
 * Cada tool tiene: name, description, handler(params) → { success, result }
 */
export const tools = {
  /**
   * Abre una URL en el navegador por defecto.
   */
  open_url: {
    name: 'open_url',
    description: 'Abre una URL en el navegador del usuario',
    async handler({ url }) {
      if (!url || !url.startsWith('http')) {
        return { success: false, result: 'URL inválida. Debe comenzar con http o https.' }
      }
      await shell.openExternal(url)
      return { success: true, result: `✅ Abrí ${url} en tu navegador.` }
    }
  },

  /**
   * Abre una aplicación del sistema (calculadora, bloc de notas, etc.)
   */
  open_app: {
    name: 'open_app',
    description: 'Abre una aplicación del sistema operativo',
    async handler({ app_name }) {
      const appMap = {
        'calculadora': 'calc.exe',
        'bloc': 'notepad.exe',
        'explorador': 'explorer.exe',
        'paint': 'mspaint.exe',
        'terminal': 'powershell.exe',
        'task manager': 'taskmgr.exe'
      }
      const exe = appMap[app_name?.toLowerCase()]
      if (!exe) {
        return { success: false, result: `No conozco la app "${app_name}". Puedo abrir: ${Object.keys(appMap).join(', ')}.` }
      }
      await execAsync(`start ${exe}`)
      return { success: true, result: `✅ Abrí ${app_name} para vos!` }
    }
  },

  /**
   * Crea un archivo de texto en el escritorio del usuario.
   */
  create_file: {
    name: 'create_file',
    description: 'Crea un archivo de texto en el escritorio',
    async handler({ filename, content }) {
      if (!filename) return { success: false, result: 'Necesito un nombre de archivo.' }
      const desktopPath = path.join(app.getPath('desktop'), filename)
      const safeContent = content || ''
      fs.writeFileSync(desktopPath, safeContent, 'utf-8')
      return { success: true, result: `✅ Creé el archivo "${filename}" en tu escritorio!` }
    }
  },

  /**
   * Devuelve la hora y fecha actuales del sistema.
   */
  get_time: {
    name: 'get_time',
    description: 'Obtiene la hora y fecha actuales',
    async handler() {
      const now = new Date()
      return {
        success: true,
        result: `🕐 Son las ${now.toLocaleTimeString('es-AR')} del ${now.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
      }
    }
  }
}

/**
 * Ejecuta una tool por su nombre con los parámetros dados.
 */
export async function executeTool(toolName, params) {
  const tool = tools[toolName]
  if (!tool) {
    return { success: false, result: `No tengo la herramienta "${toolName}".` }
  }
  try {
    return await tool.handler(params || {})
  } catch (err) {
    console.error(`[Tools] Error en ${toolName}:`, err.message)
    return { success: false, result: `Error al ejecutar "${toolName}": ${err.message}` }
  }
}
