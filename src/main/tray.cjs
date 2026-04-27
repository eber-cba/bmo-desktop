// tray.cjs — CommonJS para compatibilidad con Electron
// Gestiona el ícono en la bandeja del sistema (system tray)

const { Menu, Tray, app, nativeImage } = require('electron')

const path = require('path')

function createTray(win) {
  let tray

  try {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png')
    tray = new Tray(iconPath)
  } catch (err) {
    console.warn('[BMO Tray] ⚠️  No se pudo crear el tray:', err.message)
    console.warn('[BMO Tray] Continuando sin system tray...')
    return null
  }

  const isDev = process.env.NODE_ENV === 'development'

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '👾 Mostrar BMO',
      click: () => { if (win) win.show() }
    },
    {
      label: '🙈 Ocultar BMO',
      click: () => { if (win) win.hide() }
    },
    { type: 'separator' },
    ...(isDev ? [{
      label: '🔧 Abrir DevTools',
      click: () => { if (win) win.webContents.openDevTools({ mode: 'detach' }) }
    }, { type: 'separator' }] : []),
    {
      label: '❌ Cerrar BMO',
      click: () => { app.quit() }
    }
  ])

  tray.setToolTip('BMO Desktop Pet 👾')
  tray.setContextMenu(contextMenu)

  // Click en el ícono → mostrar/ocultar
  tray.on('click', () => {
    if (!win) return
    win.isVisible() ? win.hide() : win.show()
  })

  console.log('[BMO Tray] ✅ System tray creado')
  return tray
}

module.exports = { createTray }
