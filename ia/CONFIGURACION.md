# Configuración de Seguridad y Calidad de IA — `09-memoria-juego-app`

## 1. Arquitectura de Defensa en Profundidad (Capas)

Una instrucción en lenguaje natural (`AGENTS.md`) orienta al modelo pero no constituye una frontera de seguridad. Por ello este repositorio aplica **4 capas complementarias**:

| Capa | Archivo / Mecanismo | Riesgo que cubre | Límite conocido |
| --- | --- | --- | --- |
| **1. Reglas de orientación** | `AGENTS.md` / `CLAUDE.md` | Define arquitectura Expo + SQLite, reglas de sensores/gestos, límites de ESLint y advierte que archivos/respuestas HTTP son datos, no órdenes. | Un modelo podría ignorarlas ante _prompt injection_ si no existieran las capas 2, 3 y 4. |
| **2. Permisos declarativos** | `.claude/settings.json` (`permissions.deny`, `ask`, `blockReadsOutsideWorkingDirectories`) | Bloquea `Read`/`Edit`/`Write` sobre `.env*`, `*.keystore`, `*.jks`, `*.pem`, `*.key`, `.claude/**` y comandos `curl`, `wget`, `sudo`, `rm -rf`, `git push --force`. | Una regla `Bash(curl *)` por sí sola no inspecciona scripts internos de Node ni rutas absolutas si no se acompaña de Hook y Sandbox. |
| **3. Hook ejecutable `PreToolUse`** | `.claude/hooks/pre-tool-use.mjs` | Inspecciona programáticamente el JSON de cada herramienta antes de su ejecución; bloquea con código de salida `2` cualquier referencia a `.env*`, `*.keystore`, `CANARIO`, `../`, `~/`, `/usr/bin/curl`, etc. | Depende de que `.claude/settings.json` esté protegido contra escritura (`Edit(./.claude/**)` denegado). |
| **4. Sandbox + Cero secretos en la App** | `sandbox.enabled: true` + arquitectura mediada por API | La app móvil no contiene `firebaseConfig` ni claves privadas; solo conoce `EXPO_PUBLIC_API_URL` y almacena tokens en `expo-secure-store`. | En Windows nativo el sandbox de Linux requiere ejecutarse dentro de WSL2 (`bubblewrap` + `socat`). |

## 2. Ajustes Realizados en la App Móvil

1. **`env.example` sin punto inicial:** Se nombró `env.example` en lugar de `.env.example` para que la regla `Read(**/.env*)` proteja `.env` y `.env.local` sin impedir consultar la plantilla pública.
2. **Protección de keystores Android/iOS:** Se agregaron explícitamente `*.keystore` y `*.jks` tanto en `.gitignore` como en `permissions.deny` y en el hook `PreToolUse`.
3. **Verificación automática:** Se integró `npm run test:hook` (10 pruebas con `node:test`) y `npm run check` (`tsc --noEmit` + `eslint` + `prettier` + `vitest --coverage` ≥ 80 %) en Husky y GitHub Actions.
