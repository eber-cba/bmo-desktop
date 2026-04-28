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
  },

  // ── Fase 8: Dev Mode Tools ──────────────────────────

  /**
   * Ejecuta un comando en la terminal.
   */
  run_command: {
    name: 'run_command',
    description: 'Ejecuta un comando de terminal',
    async handler({ command }) {
      if (!command) return { success: false, result: 'Falta el comando a ejecutar.' }
      try {
        const { stdout, stderr } = await execAsync(command)
        return { success: true, result: `Salida de consola:\n${stdout}\n${stderr ? 'Errores:\n' + stderr : ''}` }
      } catch (err) {
        return { success: false, result: `Falló la ejecución de "${command}": ${err.message}` }
      }
    }
  },

  /**
   * Lee el contenido de un archivo.
   */
  read_file: {
    name: 'read_file',
    description: 'Lee el contenido de un archivo en el sistema',
    async handler({ filepath }) {
      if (!filepath) return { success: false, result: 'Necesito la ruta del archivo.' }
      try {
        const content = fs.readFileSync(filepath, 'utf-8')
        // Truncar si es muy largo
        const truncated = content.length > 3000 ? content.slice(0, 3000) + '...[truncado]' : content
        return { success: true, result: `Contenido de ${filepath}:\n${truncated}` }
      } catch (err) {
        return { success: false, result: `No pude leer el archivo: ${err.message}` }
      }
    }
  },

  /**
   * Lista los archivos de un directorio.
   */
  list_dir: {
    name: 'list_dir',
    description: 'Lista los archivos en una carpeta',
    async handler({ dirpath }) {
      if (!dirpath) return { success: false, result: 'Necesito la ruta de la carpeta.' }
      try {
        const files = fs.readdirSync(dirpath)
        return { success: true, result: `Archivos en ${dirpath}:\n${files.join(', ')}` }
      } catch (err) {
        return { success: false, result: `No pude leer la carpeta: ${err.message}` }
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
