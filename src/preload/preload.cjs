// preload.cjs — CommonJS (más compatible con Electron)
// Este archivo corre ANTES del renderer, en un contexto especial.
// contextBridge expone funciones de forma segura al renderer (React).

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bmo', {
  // Mover la ventana (drag desde React)
  drag: (delta) => ipcRenderer.send('window:drag', delta),

  // Obtener posición actual de la ventana
  getPosition: () => ipcRenderer.invoke('window:getPosition'),

  // IA: soporta tanto .ask() como .sendMessage()
  ask: (msg) => ipcRenderer.invoke('ai:message', msg),
  sendMessage: (msg) => ipcRenderer.invoke('ai:message', msg),
  getHistory: () => ipcRenderer.invoke('memory:getHistory'),
  executeTool: (toolName, params) => ipcRenderer.invoke('tool:execute', toolName, params),
})

console.log('[BMO Preload] ✅ contextBridge listo')
