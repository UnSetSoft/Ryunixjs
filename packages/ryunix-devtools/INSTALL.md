# 📦 Ryunix DevTools - Instalación

## Estructura Completa

```
packages/ryunix-devtools/
├── manifest.json          # Configuración de la extensión
├── devtools.html          # Punto de entrada de DevTools
├── devtools.js            # Inicialización del panel
├── panel.html             # UI del panel
├── panel.js               # Lógica del panel
├── content-script.js      # Bridge página-extensión
├── hook.js                # Hook inyectado en la página
├── background.js          # Service Worker
├── README.md              # Documentación
├── package.json           # Configuración npm
└── icons/                 # (crear manualmente)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Instalación

### 1. Crear carpeta de iconos

```bash
mkdir -p packages/ryunix-devtools/icons
```

### 2. Agregar iconos (16x16, 48x48, 128x128 px)

Usa el logo de Ryunix en diferentes tamaños.

### 3. Cargar en Chrome

1. Abre `chrome://extensions/`
2. Activa "Modo de desarrollador"
3. Click "Cargar extensión sin empaquetar"
4. Selecciona `packages/ryunix-devtools/`

## Uso

1. Abre una app Ryunix en el navegador
2. Abre DevTools (F12)
3. Ve a la pestaña "Ryunix"
4. Verás el árbol de componentes

## Build

```bash
cd packages/ryunix-devtools
npm run build  # Crea ryunix-devtools.zip
```

## Testing

Prueba con ejemplo básico:

```javascript
// test.html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@unsetsoft/ryunixjs"></script>
</head>
<body>
  <div id="__ryunix"></div>
  <script>
    const App = () => {
      const [count, setCount] = Ryunix.Hooks.useStore(0)
      return Ryunix.createElement('div', null, [
        Ryunix.createElement('h1', null, 'Count: ' + count),
        Ryunix.createElement('button', { 
          onClick: () => setCount(count + 1) 
        }, 'Increment')
      ])
    }
    
    Ryunix.init(Ryunix.createElement(App))
  </script>
</body>
</html>
```
