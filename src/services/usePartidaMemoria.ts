import { useEffect, useState } from "react";
import { Alert, AppState } from "react-native";
import { useAppContext, type EstadoAppContext } from "@/src/components/AppProvider";
import { moverIndiceCursor } from "@/src/sensors/logica-sensores";
import {
  dispararHapticResultado,
  useSensoresJuego
} from "@/src/sensors/useSensoresJuego";
import {
  barajarCartasRestantes,
  crearTablero,
  ocultarCartasNoEmparejadas,
  voltearCarta,
  type CartaMemoria,
  type ResultadoTurno
} from "@/src/services/juego.service";

export function useCronometroApp(activo: boolean): [number, (seg: number) => void] {
  const [segundos, setSegundos] = useState<number>(0);
  const [enPrimerPlano, setEnPrimerPlano] = useState<boolean>(true);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (estado) => {
      setEnPrimerPlano(estado === "active");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!activo || !enPrimerPlano) {
      return;
    }
    const id = setInterval(() => {
      setSegundos((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [activo, enPrimerPlano]);

  return [segundos, setSegundos];
}

function mostrarAlertaReinicio(onConfirmar: () => void): void {
  Alert.alert("Reiniciar partida", "¿Deseas reiniciar el tablero actual?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Reiniciar", style: "destructive", onPress: onConfirmar }
  ]);
}

function procesarEfectosTurno(
  res: ResultadoTurno,
  ctx: EstadoAppContext,
  segundos: number,
  setBloqueado: (b: boolean) => void,
  setCartas: React.Dispatch<React.SetStateAction<CartaMemoria[]>>,
  setTerminada: (t: boolean) => void
): void {
  if (res.acierto !== null) {
    void dispararHapticResultado(res.acierto, ctx.vibracionActiva);
  }
  if (res.ocultarTrasMs !== null) {
    setBloqueado(true);
    setTimeout(() => {
      setCartas((actual) => ocultarCartasNoEmparejadas(actual));
      setBloqueado(false);
    }, res.ocultarTrasMs);
  }
  if (res.terminada) {
    setTerminada(true);
    ctx.registrarPuntajeLocal({
      jugador: ctx.jugador,
      dificultad: ctx.dificultad,
      movimientos: res.movimientos,
      segundos: Math.max(1, segundos),
      ciudad: ctx.ciudadActual
    });
  }
}

export function usePartidaMemoria() {
  const ctx = useAppContext();
  const [cartas, setCartas] = useState<CartaMemoria[]>(() =>
    crearTablero(ctx.dificultad)
  );
  const [movimientos, setMovimientos] = useState<number>(0);
  const [pausado, setPausado] = useState<boolean>(false);
  const [bloqueado, setBloqueado] = useState<boolean>(false);
  const [terminada, setTerminada] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number>(0);
  const [segundos, setSegundos] = useCronometroApp(!pausado && !terminada);

  const reiniciarDirecto = () => {
    setCartas(crearTablero(ctx.dificultad));
    setMovimientos(0);
    setSegundos(0);
    setPausado(false);
    setBloqueado(false);
    setTerminada(false);
    setCursor(0);
  };

  const confirmarReinicio = () => mostrarAlertaReinicio(reiniciarDirecto);
  const { parallax } = useSensoresJuego({
    vibracionActiva: ctx.vibracionActiva,
    modoInclinacionActivo: ctx.modoInclinacionActivo,
    onSacudir: confirmarReinicio,
    onPasoInclinacion: (paso) =>
      setCursor((c) => moverIndiceCursor(c, paso, cartas.length))
  });

  const manejarVolteo = (cartaId: string) => {
    if (pausado || bloqueado || terminada) return;
    const res = voltearCarta(cartas, cartaId, movimientos);
    setCartas(res.cartas);
    setMovimientos(res.movimientos);
    procesarEfectosTurno(res, ctx, segundos, setBloqueado, setCartas, setTerminada);
  };

  return {
    ctx,
    cartas,
    movimientos,
    segundos,
    pausado,
    terminada,
    cursor,
    parallax,
    manejarVolteo,
    confirmarReinicio,
    alternarPausa: () => setPausado((p) => !p),
    barajarRestantes: () => setCartas((c) => barajarCartasRestantes(c))
  };
}
