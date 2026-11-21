import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import {
  calcularOffsetParallax,
  detectarSacudida,
  determinarPasoInclinacion,
  type OffsetParallax
} from "@/src/sensors/logica-sensores";

export interface OpcionesSensoresJuego {
  readonly vibracionActiva: boolean;
  readonly modoInclinacionActivo: boolean;
  readonly onSacudir: () => void;
  readonly onPasoInclinacion: (paso: -1 | 1) => void;
}

export async function dispararHapticResultado(
  acierto: boolean,
  vibracionActiva: boolean
): Promise<void> {
  if (!vibracionActiva) {
    return;
  }
  try {
    const tipo = acierto
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Warning;
    await Haptics.notificationAsync(tipo);
  } catch {
    // El dispositivo o emulador no soporta vibración; no debe romper la app.
  }
}

export async function obtenerCiudadDispositivo(): Promise<string | null> {
  try {
    const disponible = await Location.hasServicesEnabledAsync();
    if (!disponible) {
      return null;
    }
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (permiso.status !== "granted") {
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    const lugares = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude
    });
    return lugares[0]?.city ?? lugares[0]?.subregion ?? null;
  } catch {
    return null;
  }
}

function useAcelerometroSacudida(onSacudir: () => void): boolean {
  const [disponible, setDisponible] = useState(false);
  const ultimaSacudidaRef = useRef<number>(0);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelado = false;

    const iniciar = async () => {
      try {
        const ok = await Accelerometer.isAvailableAsync();
        if (!ok || cancelado) {
          return;
        }
        setDisponible(true);
        Accelerometer.setUpdateInterval(200);
        sub = Accelerometer.addListener((muestra) => {
          const res = detectarSacudida(muestra, ultimaSacudidaRef.current, Date.now());
          if (res.sacudido) {
            ultimaSacudidaRef.current = res.nuevoTimestampMs;
            onSacudir();
          }
        });
      } catch {
        // Sensor no disponible
      }
    };

    void iniciar();
    return () => {
      cancelado = true;
      sub?.remove();
    };
  }, [onSacudir]);

  return disponible;
}

export function useSensoresJuego(opciones: OpcionesSensoresJuego): {
  parallax: OffsetParallax;
  sensoresDisponibles: { acelerometro: boolean; giroscopio: boolean };
} {
  const [parallax, setParallax] = useState<OffsetParallax>({ offsetX: 0, offsetY: 0 });
  const [giroscopio, setGiroscopio] = useState(false);
  const acelerometro = useAcelerometroSacudida(opciones.onSacudir);

  useEffect(() => {
    let subGyro: { remove: () => void } | null = null;
    let cancelado = false;

    const iniciarGiroscopio = async () => {
      try {
        const ok = await Gyroscope.isAvailableAsync();
        if (!ok || cancelado) {
          return;
        }
        setGiroscopio(true);
        Gyroscope.setUpdateInterval(250);
        subGyro = Gyroscope.addListener((giro) => {
          setParallax(calcularOffsetParallax(giro));
          if (opciones.modoInclinacionActivo) {
            const paso = determinarPasoInclinacion(giro);
            if (paso !== 0) {
              opciones.onPasoInclinacion(paso);
            }
          }
        });
      } catch {
        // Sensor no disponible
      }
    };

    void iniciarGiroscopio();
    return () => {
      cancelado = true;
      subGyro?.remove();
    };
  }, [opciones]);

  return { parallax, sensoresDisponibles: { acelerometro, giroscopio } };
}
