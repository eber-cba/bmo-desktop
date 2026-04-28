import 'dotenv/config'
import { app, BrowserWindow, ipcMain, screen, clipboard } from 'electron'
import { autoUpdater } from 'electron-updater'
import { aiEngine } from './ai/engine.js'
import { memoryManager } from './memory/manager.js'
import { executeTool } from './tools/index.js'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

// createRequire permite importar archivos .cjs desde un módulo ESM
const require = createRequire(import.meta.url)
const { createTray } = require('./tray.cjs')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 600,
    height: 580,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5174')
    // DevTools comentado para no ensuciar la terminal con errores internos de Chromium
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  // Posición inicial: esquina inferior derecha, asegurando que se vea todo el BMO y el chat
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  win.setPosition(width - 600, height - 580)

  win.on('closed', () => { win = null })
  console.log('[BMO Window] ✅ Ventana creada')
}

// Parche para Windows: a veces la transparencia se rompe con aceleración por hardware
app.disableHardwareAcceleration()

app.whenReady().then(() => {
  createWindow()
  createTray(win)

  // ── IPC: Drag ──────────────────────────────────────
  // El renderer envía los deltas de movimiento del mouse
  ipcMain.on('window:drag', (_, { deltaX, deltaY }) => {
    if (!win) return
    const [x, y] = win.getPosition()
    win.setPosition(x + deltaX, y + deltaY)
  })

  // ── IPC: Posición ──────────────────────────────────
  ipcMain.handle('window:getPosition', () => {
    return win ? win.getPosition() : [0, 0]
  })

  // ── IPC: IA (Fase 3, 4, 5 & 7) ─────────────────────────
  ipcMain.handle('ai:message', async (_, history) => {
    const lastUserMsg = history[history.length - 1]
    const historyForAI = [...history]

    // Fase 7: Context Awareness (Clipboard Watcher)
    const clipText = clipboard.readText().trim()
    if (clipText) {
      const truncatedClip = clipText.length > 2000 ? clipText.slice(0, 2000) + '...[truncado]' : clipText
      historyForAI[historyForAI.length - 1] = {
        role: 'user',
        content: `${lastUserMsg.content}\n\n[INFO DE SISTEMA: El usuario tiene copiado en su portapapeles este texto: "${truncatedClip}". Usalo SOLO si el usuario te pide que le resumas, expliques o uses lo que copió, de lo contrario ignoralo completamente].`
      }
    }

    const aiResponse = await aiEngine.ask(historyForAI)

    // ¿La IA quiere usar una herramienta?
    if (aiResponse.type === 'tool') {
      const toolResult = await executeTool(aiResponse.tool, aiResponse.params)
      const bmoText = toolResult.result
      memoryManager.addHistory([lastUserMsg, { role: 'assistant', content: bmoText }])
      return { type: 'tool', toolName: aiResponse.tool, result: bmoText }
    }

    // Respuesta de texto normal
    const bmoText = aiResponse.content
    memoryManager.addHistory([lastUserMsg, { role: 'assistant', content: bmoText }])
    return { type: 'text', content: bmoText }
  })

  // ── IPC: Tool manual (Fase 5) ─────────────────────
  ipcMain.handle('tool:execute', async (_, toolName, params) => {
    return await executeTool(toolName, params)
  })

  // ── IPC: Memoria ───────────────────────────────────
  ipcMain.handle('memory:getHistory', () => {
    return memoryManager.getHistory().map(m => ({
      text: m.content,
      sender: m.role === 'user' ? 'user' : 'bmo'
    }))
  })

  // ── Chequeo de Salud (IA) ─────────────────────────
  aiEngine.ping()
    .then(() => console.log('[BMO AI] 🧠 Cerebro conectado y listo (Ollama)'))
    .catch(err => console.error('[BMO AI] ❌ Error de conexión con Ollama. ¿Está corriendo en el puerto 11434?'))

  // ── Auto Updates (Fase 9) ─────────────────────────
  autoUpdater.checkForUpdatesAndNotify()
    .then(() => console.log('[AutoUpdater] ✅ Chequeo de actualizaciones iniciado.'))
    .catch(err => console.error('[AutoUpdater] ⚠️ Error al chequear actualizaciones:', err.message))

  console.log('[BMO Main] ✅ App lista')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
