# BMO Desktop Pet 🎮

> Una mascota de escritorio con IA, personalidad y memoria — inspirada en BMO de Adventure Time

[![CI](https://github.com/tu-usuario/bmo-desktop/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/bmo-desktop/actions)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

---

## ¿Qué es BMO Desktop Pet?

BMO es un asistente virtual que vive en tu escritorio. Es arrastrable, siempre visible, tiene personalidad, recuerda cosas sobre vos, y puede ejecutar acciones en tu computadora de forma controlada y segura.

**Construido con:** Electron · React · Node.js · Canvas 2D · SQLite · Ollama

---

## 🚀 Instalación rápida

```bash
git clone https://github.com/tu-usuario/bmo-desktop.git
cd bmo-desktop
npm install
npm run dev
```

Requiere [Node.js 20+](https://nodejs.org) y [Ollama](https://ollama.ai) para la IA local (Fase 3+).

---

## 📋 Roadmap

| Fase | Descripción | Estado |
|---|---|---|
| 1 | Ventana flotante + personaje arrastrable | 🔨 En progreso |
| 2 | Interacción básica + animaciones | ⏳ Pendiente |
| 3 | Integración con IA (Ollama/OpenAI) | ⏳ Pendiente |
| 4 | Memoria persistente (SQLite) | ⏳ Pendiente |
| 5 | Tools + sistema de permisos | ⏳ Pendiente |
| 6 | Animaciones avanzadas + distribución | ⏳ Pendiente |

---

## 🧩 Estructura del proyecto

```
bmo-desktop/
├── src/
│   ├── main/          # Electron Main Process (Node.js)
│   ├── preload/       # IPC Bridge (contextBridge)
│   └── renderer/      # React UI + Canvas
├── tests/             # Vitest tests
├── docs/              # Documentación técnica
└── .github/           # CI/CD workflows
```

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para guía de contribución.

---

## 📄 Licencia

MIT — libre de usar, modificar y distribuir.
