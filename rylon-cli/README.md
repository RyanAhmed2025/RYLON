# RYLON CLI

Astral Modular Development Framework — browser-based terminal UI.

---

## Requirements

- **Node.js** v18 or higher  
  Download: https://nodejs.org  
  Verify: `node -v`

That's it. No other global installs needed.

---

## Setup (first time only)

```bash
# 1. Enter the project folder
cd rylon-cli

# 2. Install dependencies
npm install
```

---

## Run

```bash
npm run dev
```

Opens automatically at **http://localhost:3000**

---

## Build for production (optional)

```bash
npm run build
npm run preview
```

Builds to the `dist/` folder. The preview runs at **http://localhost:4173**

---

## Available Commands in the CLI

| Command | Description |
|---|---|
| `help` | Show all commands |
| `modules` | List loaded modules |
| `run <module> <command>` | Execute a module command |
| `chain` | Run demo task pipeline |
| `procreate create` | Start the profile wizard |
| `procreate call 'name'` | Display a saved profile |
| `procreate edit 'name'` | Edit a saved profile |
| `procreate list` | List all saved profiles |
| `procreate delete 'name'` | Remove a profile |
| `clear` | Clear the interaction area |

---

## Customize

Open `src/App.jsx` and edit the top section:

```js
// ✏️ Replace with your own ASCII art lines
const CUSTOM_ASCII = [ ... ]

const GREETING_SUBTITLE = "Your subtitle here"
const GREETING_VERSION  = "CLI v1.0.0"
const COMPACT_LABEL     = "your runtime label"
```

---

## Folder structure

```
rylon-cli/
├── index.html          ← HTML shell
├── package.json        ← dependencies
├── vite.config.js      ← dev server config
└── src/
    ├── main.jsx        ← React entry point
    └── App.jsx         ← entire CLI (edit this)
```
