# 09 · Juego de Memoria con Puntajes — App Móvil (`09-memoria-juego-app`)

Aplicación móvil offline-first construida con **Expo**, **React Native**, **TypeScript (`strict`, `noUncheckedIndexedAccess`)**, **Expo Router** y **SQLite local**, conectada de forma segura por HTTPS con la API desplegada en Vercel (`https://09-memoria-juego-api.vercel.app`).

---

## 1. Arquitectura y Regla de Oro de Seguridad

```text
[ App móvil (Expo + React Native + TypeScript + Expo Router) ]
   ├── SQLite local (tabla `puntaje` con remote_id, updated_at, deleted, pending)
   ├── Tokens guardados únicamente en expo-secure-store (nunca en AsyncStorage)
   ├── Gestos (Tap, Pan, Fling, LongPress) + Alternativa accesible por botón
   ├── Sensores (expo-haptics, Accelerometer, Gyroscope, expo-location)
   ▼  HTTPS + Authorization: Bearer <ID_TOKEN>
[ API en Vercel: https://09-memoria-juego-api.vercel.app ]
```

- **Cero secretos en el APK:** La aplicación **no** contiene `firebaseConfig` ni claves privadas. Solo conoce `EXPO_PUBLIC_API_URL=https://09-memoria-juego-api.vercel.app`.
- **Permisos mínimos (`app.json`):** Solo declara `VIBRATE` y `ACCESS_COARSE_LOCATION` (solicitado únicamente cuando el usuario activa el filtro de ranking por ciudad).

---

## 2. Pantallas y Rutas (Expo Router)

| Ruta              | Archivo                   | Contenido                                                                                                                                                     |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `(tabs)/index`    | `app/(tabs)/index.tsx`    | Inicio: nombre del jugador (2–15 caracteres), elección de dificultad (`facil` 4 parejas, `medio` 6 parejas, `dificil` 12 parejas) y sesión con la API.        |
| `juego`           | `app/juego.tsx`           | Tablero de cartas con animación, cronómetro que se pausa en segundo plano (`AppState`), ocultamiento tras `800 ms`, gestos y sensores con botones accesibles. |
| `(tabs)/puntajes` | `app/(tabs)/puntajes.tsx` | Top 10 mejores puntajes por dificultad (ordenados por `movimientos ASC`, `segundos ASC`), filtro por ciudad y sincronización con la API.                      |
| `ajustes`         | `app/ajustes.tsx`         | Configuración de sonido, vibración (`expo-haptics`), modo inclinación (`Gyroscope`) y sincronización manual.                                                  |

---

## 3. Gestos y Sensores Implementados (Todos con Alternativa por Botón)

| Tipo         | Gesto / Sensor                           | Uso en la App                                                                         | Alternativa Accesible (`accessibilityLabel`)                                      |
| ------------ | ---------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Gesto 1**  | `Gesture.Tap` (Toque)                    | Voltear carta en el tablero.                                                          | Botón accesible en cada carta (`Voltear carta posición N`).                       |
| **Gesto 2**  | `Gesture.Pan` (Arrastrar y soltar)       | Modo difícil: arrastrar una carta hasta su pareja.                                    | Botón accesible de selección y emparejamiento por toque.                          |
| **Gesto 3**  | `Gesture.Fling` (Lanzamiento arriba)     | Barajar las cartas no descubiertas con lanzamiento hacia arriba.                      | Botón `"Barajar cartas restantes"`.                                               |
| **Gesto 4**  | `Gesture.LongPress` (Pulsación larga)    | Pausar o reanudar la partida.                                                         | Botón `"Pausar partida"` / `"Reanudar partida"`.                                  |
| **Sensor 1** | `expo-haptics` (+ `expo-audio` opcional) | Vibración de éxito al acertar pareja y vibración de advertencia al fallar.            | Funciona sin vibración si se desactiva en Ajustes o el dispositivo no lo soporta. |
| **Sensor 2** | `Accelerometer` (Sacudir)                | Sacudir el teléfono reinicia la partida con confirmación.                             | Botón `"Reiniciar partida"`.                                                      |
| **Sensor 3** | `Gyroscope` (Inclinación)                | Desplazamiento parallax del tablero y modo inclinación para mover el cursor de carta. | Modo táctil / botones `"Carta anterior"` y `"Carta siguiente"`.                   |
| **Sensor 4** | `expo-location` (Ciudad)                 | Obtiene la ciudad actual bajo demanda para filtrar el ranking por ciudad.             | Ranking global o selección manual si se rechaza el permiso.                       |

---

## 4. Comandos de Puesta en Marcha y Calidad

```bash
# Instalar dependencias
npm install

# Ejecutar las 10 pruebas del Hook PreToolUse de contención de IA
npm run test:hook

# Ejecutar verificación integral (tsc --noEmit + eslint + prettier + vitest --coverage >= 80%)
npm run check

# Iniciar servidor de desarrollo Expo
npx expo start
```

---

## 5. Justificación de Dependencias (`package.json`)

| Paquete                                                              | Tipo       | Justificación                                                                                                                                 |
| -------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `expo`, `react`, `react-native`, `expo-router`                       | Producción | Base de la aplicación móvil y navegación declarativa por archivos (`app/`).                                                                   |
| `expo-sqlite`                                                        | Producción | Base de datos local SQLite para funcionamiento sin conexión (`tabla puntaje`).                                                                |
| `expo-secure-store`                                                  | Producción | Almacenamiento cifrado de `token` y `refreshToken` (nunca en `AsyncStorage`).                                                                 |
| `react-native-gesture-handler`, `react-native-reanimated`            | Producción | Implementación de los gestos `Tap`, `Pan`, `Fling` y `LongPress` y animaciones de volteo.                                                     |
| `expo-haptics`, `expo-audio`, `expo-sensors`, `expo-location`        | Producción | Capacidades nativas de vibración, acelerómetro, giroscopio y ubicación por ciudad.                                                            |
| `typescript`, `eslint`, `prettier`, `vitest`, `husky`, `lint-staged` | Desarrollo | Verificación automática de tipos, linter estricto (`max-lines-per-function ≤ 50`, `complexity ≤ 10`), formato y pruebas con cobertura ≥ 80 %. |

---

## 6. Configuración de IA

Consulte [`IA.md`](./IA.md), [`AGENTS.md`](./AGENTS.md) y la carpeta [`ia/`](./ia/) para revisar la arquitectura de contención en 4 capas, el hook `PreToolUse`, las 10 pruebas con canario, el informe de inyección y la bitácora del equipo.
