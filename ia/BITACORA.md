# Bitácora de Uso de IA — `09-memoria-juego-app`

Registro trazable de las sesiones de trabajo con IA siguiendo el método: **Propósito → Evidencia → Validación → Decisión**.

---

## Entradas de Desarrollo

### Sesión 1 — Configuración de IA, Sandbox y Hook `PreToolUse`

- **Propósito:** Configurar las 4 capas de contención de IA (`AGENTS.md`, `.claude/settings.json`, hook `PreToolUse` y pipeline de calidad) en el primer commit del repositorio móvil.
- **Evidencia:** Creación de `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` y `.claude/hooks/pre-tool-use.mjs` con 10 pruebas automatizadas.
- **Validación:** Ejecución de `npm run test:hook` (10/10 pruebas aprobadas).
- **Decisión:** Aceptado y versionado en el primer commit del repositorio.

### Sesión 2 — Lógica Pura del Juego, SQLite y Sincronización Offline-First

- **Propósito:** Implementar la lógica del tablero (`barajar`, voltear cartas con límite de 2 cartas y ocultamiento a los 800 ms, detección de fin de partida), el esquema SQLite con columnas de sincronización (`remote_id`, `updated_at`, `deleted`, `pending`) y el servicio de sincronización con `09-memoria-juego-api`.
- **Evidencia:** Módulos en `src/db/`, `src/repositories/`, `src/services/` y `src/api/`.
- **Validación:** Suite de pruebas unitarias verificando `barajar()`, detección de victoria, ordenamiento del ranking (`movimientos ASC`, `segundos ASC`), renovación de token en `401` y SQL parametrizado.
- **Decisión:** Aceptado con cobertura superior al 85 %.

### Sesión 3 — Pantallas en Expo Router, Gestos y Sensores Accesibles

- **Propósito:** Construir las 4 rutas exigidas (`(tabs)/index`, `juego`, `(tabs)/puntajes`, `ajustes`) integrando los 4 gestos (`Tap`, `Pan`, `Fling`, `LongPress`) y los sensores (`expo-haptics`, `Accelerometer` para sacudir, `Gyroscope` para inclinación y `expo-location` para ranking por ciudad), todos con alternativa accesible por botón.
- **Evidencia:** Pantallas en `app/` y hooks de sensores en `src/sensors/`.
- **Validación:** `npm run check` (`tsc --noEmit`, `eslint . --max-warnings 0`, `prettier --check .`, `vitest run --coverage`).
- **Decisión:** Aceptado tras aplicar las 3 correcciones documentadas a continuación.

---

## Casos en que se Rechazó o Corrigió lo Propuesto por la IA (≥ 3 obligatorios)

### Corrección 1 — Almacenamiento de tokens en `AsyncStorage` en lugar de `expo-secure-store`

- **Propuesta inicial de la IA:** Guardar `token` y `refreshToken` en `@react-native-async-storage/async-storage` por simplicidad.
- **Motivo del rechazo:** La sección 9.1 y la lista de verificación de seguridad de `09-memoria-juego.md` prohíben explícitamente `AsyncStorage` para credenciales: _"Tokens en `expo-secure-store`, nunca en `AsyncStorage`"_.
- **Corrección aplicada:** Se implementó `src/api/token-storage.ts` utilizando exclusivamente `expo-secure-store` (`SecureStore.setItemAsync`, `getItemAsync`, `deleteItemAsync`).

### Corrección 2 — Suscripción a sensores sin verificar `isAvailableAsync()` ni limpiar en `useEffect`

- **Propuesta inicial de la IA:** Llamar directamente a `Accelerometer.addListener(...)` al montar la pantalla `juego.tsx`.
- **Motivo del rechazo:** La sección 5 de `09-memoria-juego.md` exige: _"(1) llame siempre `isAvailableAsync()` antes de usar un sensor; (3) cancele las suscripciones (`subscription.remove()`) al salir de la pantalla; (4) la app nunca debe romperse si el sensor no está disponible"_.
- **Corrección aplicada:** En `src/sensors/useSensoresJuego.ts` se verifica primero `await Accelerometer.isAvailableAsync()` y `await Gyroscope.isAvailableAsync()`, se captura cualquier excepción sin romper la UI y se invoca `subscription.remove()` en el retorno del `useEffect`.

### Corrección 3 — Gestos sin botón alternativo con `accessibilityLabel`

- **Propuesta inicial de la IA:** Permitir barajar únicamente con el gesto `Gesture.Fling` hacia arriba y pausar únicamente con `Gesture.LongPress`.
- **Motivo del rechazo:** La sección 4 de `09-memoria-juego.md` establece: _"Accesibilidad: cada acción hecha con un gesto debe poder hacerse también con un botón con `accessibilityLabel`, porque un lector de pantalla no ejecuta gestos complejos"_.
- **Corrección aplicada:** Se añadieron botones explícitos con `accessibilityRole="button"` y `accessibilityLabel` para voltear/emparejar cartas, barajar el tablero, pausar la partida y reiniciar.
