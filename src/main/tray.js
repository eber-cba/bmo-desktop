import { Menu, Tray, app, nativeImage } from 'electron'

// Ícono mínimo 16x16 en base64 (verde-azul de BMO) — sin necesitar archivo externo
const BMO_ICON_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA' +
  'iklEQVQ4jWNgGAWkAkYGBob/DMRoZmZmZBkmBiKBIQMDA8P/GzBgYGD4z0CCZoZBqpkY' +
  'GBj+MwzAgIGBgf8/A3GaGQepZmJgYPjPwI+BgYGBgZ+BiGaGQaqZGBgY/jMM2ICBgYGB' +
  'gZ+BiGaGQaqZGBgY/jMM2ICBgYGBgZ+BiGaGQaqZGBgY/jMM2ICBgYGBgZ+BiGaGQQ=='

export function createTray(win) {
  let tray

  try {
    const icon = nativeImage.createFromDataURL(BMO_ICON_BASE64)
    tray = new Tray(icon)
  } catch {
    // Si el ícono base64 falla, crear uno vacío (Electron lo reemplaza con ícono del OS)
    try {
      tray = new Tray(nativeImage.createEmpty())
    } catch (err) {
      console.warn('⚠️  System tray no disponible:', err.message)
      return null
    }
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '👾 Mostrar BMO',
      click: () => { if (win) win.show() }
    },
    {
      label: '👁️  Ocultar BMO',
      click: () => { if (win) win.hide() }
    },
    { type: 'separator' },
    {
      label: '🔧 DevTools (Debug)',
      click: () => { if (win) win.webContents.openDevTools({ mode: 'detach' }) },
      visible: process.env.NODE_ENV === 'development'
    },
    { type: 'separator' },
    {
      label: '❌ Cerrar BMO',
      click: () => { app.quit() }
    }
  ])

  tray.setToolTip('BMO Desktop Pet 👾')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (win) win.isVisible() ? win.hide() : win.show()
  })

  return tray
}
