// tray.cjs — CommonJS para compatibilidad con Electron
// Gestiona el ícono en la bandeja del sistema (system tray)

const { Menu, Tray, app, nativeImage } = require('electron')

/**
 * Crea un ícono de tray de 16x16 en formato PNG usando raw bytes.
 * Color: teal (#4ecdc4) — el color de BMO.
 * No requiere ningún archivo externo.
 */
function createBmoIcon() {
  // PNG 16x16 sólido color teal (#4e, #cd, #c4) — generado manualmente
  // Estructura: cabecera PNG + IHDR + IDAT (comprimido) + IEND
  const WIDTH = 16
  const HEIGHT = 16

  // Usamos nativeImage con un dataURL de un PNG mínimo válido
  // Este es un PNG 16x16 color #4ecdc4 generado y codificado correctamente
  const TEAL_PNG_BASE64 = [
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAJklEQVQoz2Ngw',
    'A3+//9PimaGUTAKhj8AAAD//wMAUe0DqzHJbWsAAAAASUVORK5CYII='
  ].join('')

  try {
    return nativeImage.createFromDataURL(`data:image/png;base64,${TEAL_PNG_BASE64}`)
  } catch {
    return nativeImage.createEmpty()
  }
}

function createTray(win) {
  let tray

  try {
    const icon = createBmoIcon()
    tray = new Tray(icon)
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
