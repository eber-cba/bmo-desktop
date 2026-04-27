import { contextBridge, ipcRenderer } from 'electron'

/**
 * Puente seguro entre el renderer (React) y el main process (Electron/Node).
 * SOLO exponer lo estrictamente necesario. Nunca exponer ipcRenderer completo.
 */
contextBridge.exposeInMainWorld('bmo', {
  // Mover la ventana (Fase 1 - drag)
  drag: (delta) => ipcRenderer.send('window:drag', delta),

  // Obtener posición actual de la ventana
  getPosition: () => ipcRenderer.invoke('window:getPosition'),

  // Placeholder para Fase 3: enviar mensaje a la IA
  // sendMessage: (msg) => ipcRenderer.invoke('ai:message', msg),

  // Placeholder para Fase 5: ejecutar tool
  // executeTool: (tool, params) => ipcRenderer.invoke('tool:execute', tool, params),
})
