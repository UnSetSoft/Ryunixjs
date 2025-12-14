# Ryunix DevTools Extension

Extensión de Chrome para depurar aplicaciones Ryunix.

## Instalación

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa "Modo de desarrollador"
3. Click en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta `packages/ryunix-devtools`

## Uso

1. Abre DevTools (F12)
2. Busca la pestaña "Ryunix"
3. La extensión detectará automáticamente aplicaciones Ryunix

## Características

- Árbol de componentes en tiempo real
- Inspección de props
- Contador de hooks
- Detección automática

## Desarrollo

```bash
npm run build  # Crea devtools.zip
```

## Compatibilidad

- Chrome 88+
- Edge 88+
- Ryunix 1.3.0+
