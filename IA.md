# Índice de Configuración y Evidencias de IA — `09-memoria-juego-app`

Este documento actúa como índice principal de la configuración de seguridad, calidad y contención del asistente de IA para el repositorio móvil **`09-memoria-juego-app`**, de acuerdo con la sección 14 del documento del proyecto y las hojas de _Configuración de IA_.

## Estructura de Archivos de IA

1. **[`AGENTS.md`](./AGENTS.md)** y **[`CLAUDE.md`](./CLAUDE.md)**:
   - Instrucciones del proyecto (≤ 100 líneas) con el stack Expo + React Native + SQLite, comandos (`npm run check`), arquitectura de capas, reglas de accesibilidad/sensores, prohibiciones explícitas y defensa contra _prompt injection_.
2. **[`.claude/settings.json`](./.claude/settings.json)**:
   - Configuración técnica obligatoria que el programa hace cumplir: `permissions.deny`, `permissions.ask`, `permissions.blockReadsOutsideWorkingDirectories`, `disableBypassPermissionsMode` y configuración de `sandbox`.
3. **[`.claude/hooks/pre-tool-use.mjs`](./.claude/hooks/pre-tool-use.mjs)** y **[`.claude/hooks/pre-tool-use.test.mjs`](./.claude/hooks/pre-tool-use.test.mjs)**:
   - _Reto de excelencia #1_: Hook `PreToolUse` propio que sale con código `2` y mensaje en `stderr` ante intentos de leer `.env*`, keystores (`*.keystore`, `*.jks`), claves privadas, salir del directorio raíz o invocar `curl`/`wget`/`sudo`, verificado con 10 pruebas automatizadas (`npm run test:hook`).
4. **[`ia/CONFIGURACION.md`](./ia/CONFIGURACION.md)**:
   - Explicación detallada de qué riesgo mitiga cada barrera, sus límites técnicos y por qué se combinan múltiples capas.
5. **[`ia/PRUEBAS-CONTENCION.md`](./ia/PRUEBAS-CONTENCION.md)**:
   - Registro de las 10 pruebas obligatorias de contención con el canario `CANARIO=ZZZ-NO-ES-UN-SECRETO`, comando/prompt exacto y resultado obtenido.
6. **[`ia/INFORME-INYECCION.md`](./ia/INFORME-INYECCION.md)**:
   - _Reto de excelencia #2_: Análisis de 3 vectores de ataque de inyección de prompts en la app móvil (archivo trampa, respuesta maliciosa del ranking y paquete con `postinstall`) y cómo los frena la configuración.
7. **[`ia/BITACORA.md`](./ia/BITACORA.md)**:
   - Bitácora del trabajo asistido por IA (propósito, evidencia, validación, decisión) incluyendo más de 3 casos donde se rechazó o corrigió la propuesta de la IA.
