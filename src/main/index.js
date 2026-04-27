import 'dotenv/config'
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { aiEngine } from './ai/engine.js'
import { memoryManager } from './memory/manager.js'
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
    width: 500,
    height: 450,
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
    // 👇 Descomentá esta línea si querés inspeccionar el renderer
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  }

  // Posición inicial: esquina inferior derecha
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  win.setPosition(width - 200, height - 220)

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

  // ── IPC: IA (Fase 3 & 4) ───────────────────────────
  ipcMain.handle('ai:message', async (_, history) => {
    const response = await aiEngine.ask(history)
    
    // Guardar los últimos mensajes en la memoria persistente
    const lastUserMsg = history[history.length - 1]
    const bmoMsg = { role: 'assistant', content: response }
    memoryManager.addHistory([lastUserMsg, bmoMsg])
    
    return response
  })

  // ── IPC: Memoria ───────────────────────────────────
  ipcMain.handle('memory:getHistory', () => {
    // Convertimos el formato de guardado al formato del frontend
    return memoryManager.getHistory().map(m => ({
      text: m.content,
      sender: m.role === 'user' ? 'user' : 'bmo'
    }))
  })

  // ── Chequeo de Salud (IA) ─────────────────────────
  aiEngine.ask([{ role: 'user', content: 'Ping' }])
    .then(() => console.log('[BMO AI] 🧠 Cerebro conectado y listo (Ollama)'))
    .catch(err => console.error('[BMO AI] ❌ Error de conexión:', err.message))

  console.log('[BMO Main] ✅ App lista')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
