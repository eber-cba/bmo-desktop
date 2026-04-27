# Contribuir a BMO Desktop Pet

¡Gracias por querer contribuir! Seguí estos pasos:

## Setup local

```bash
git clone https://github.com/tu-usuario/bmo-desktop.git
cd bmo-desktop
npm install
npm run dev
```

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar tool open-url
fix: corregir posición del chat panel
docs: actualizar roadmap
chore: actualizar dependencias
test: agregar tests para memory system
refactor: separar ai engine en providers
```

## Cómo agregar una Tool nueva

1. Crear `src/tools/catalog/mi-tool.js` con la interfaz estándar
2. Registrarla en `src/tools/index.js`
3. Agregar tests en `tests/unit/tools/`
4. Documentarla en `docs/tools-api.md`

## Pull Requests

- Basarse siempre en `main`
- Incluir tests si agregás lógica nueva
- Un PR = una cosa. No mezclar features.
- El CI debe pasar antes del merge
