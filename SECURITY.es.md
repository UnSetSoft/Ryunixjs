> **Idioma / Language:** [Español](./SECURITY.es.md) · [English](./SECURITY.md)

# Política de seguridad

## Versiones soportadas

Actualmente damos soporte a las siguientes versiones de RyunixJS:

| Versión | Soportada          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.2.4 | :x:                |

## Reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en RyunixJS, **no** abras un issue público. Repórtala de forma privada a los mantenedores.

Puedes reportarla:

- Enviando un correo a [support@unsetsoft.com](mailto:support@unsetsoft.com)
- Creando un informe de vulnerabilidad privado en GitHub (si está disponible)

Incluye toda la información posible:

- Descripción de la vulnerabilidad.
- Pasos para reproducirla.
- Impacto potencial.
- Posibles correcciones sugeridas.

## Mecanismos de seguridad en RyunixJS

RyunixJS incluye varias funciones de seguridad integradas:

- **Protección XSS**: Escapado automático de HTML en SSR y SSG.
- **Protección CSRF**: Validación de cabeceras personalizadas para Server Actions.
- **Soporte CSP**: Soporte de nonces en streaming SSR.
- **Protección path traversal**: Validación de rutas de archivos en el servidor de producción.
- **Prototype pollution guard**: Sanitización de props durante la hidratación de islands.
- **Bloqueo de URI peligrosas**: Bloqueo automático de URIs `javascript:` y `vbscript:`.

No somos perfectos; por favor reporta cualquier vulnerabilidad que encuentres.
