import React, { createContext, useContext, useState } from "react";
import type { Dificultad } from "@/src/services/juego.service";
import type { ItemPuntaje } from "@/src/services/ranking.service";

export interface EstadoAppContext {
  readonly jugador: string;
  readonly setJugador: (nombre: string) => void;
  readonly dificultad: Dificultad;
  readonly setDificultad: (dif: Dificultad) => void;
  readonly sonidoActivo: boolean;
  readonly setSonidoActivo: (activo: boolean) => void;
  readonly vibracionActiva: boolean;
  readonly setVibracionActiva: (activo: boolean) => void;
  readonly modoInclinacionActivo: boolean;
  readonly setModoInclinacionActivo: (activo: boolean) => void;
  readonly ciudadActual: string | null;
  readonly setCiudadActual: (ciudad: string | null) => void;
  readonly puntajesLocales: ItemPuntaje[];
  readonly registrarPuntajeLocal: (nuevo: Omit<ItemPuntaje, "id" | "jugado_en">) => void;
}

const PUNTAJES_INICIALES: ItemPuntaje[] = [
  {
    id: "seed-1",
    jugador: "Ana",
    dificultad: "facil",
    movimientos: 5,
    segundos: 12,
    ciudad: "Medellín",
    jugado_en: "2026-11-20T12:00:00.000Z"
  },
  {
    id: "seed-2",
    jugador: "Carlos",
    dificultad: "medio",
    movimientos: 8,
    segundos: 22,
    ciudad: "Medellín",
    jugado_en: "2026-11-20T12:10:00.000Z"
  }
];

const AppContext = createContext<EstadoAppContext | null>(null);

export function AppProvider(props: { children: React.ReactNode }): React.ReactElement {
  const [jugador, setJugador] = useState<string>("Jugador1");
  const [dificultad, setDificultad] = useState<Dificultad>("facil");
  const [sonidoActivo, setSonidoActivo] = useState<boolean>(true);
  const [vibracionActiva, setVibracionActiva] = useState<boolean>(true);
  const [modoInclinacionActivo, setModoInclinacionActivo] = useState<boolean>(false);
  const [ciudadActual, setCiudadActual] = useState<string | null>(null);
  const [puntajesLocales, setPuntajesLocales] =
    useState<ItemPuntaje[]>(PUNTAJES_INICIALES);

  const registrarPuntajeLocal = (nuevo: Omit<ItemPuntaje, "id" | "jugado_en">) => {
    const item: ItemPuntaje = {
      ...nuevo,
      id: `local-${Date.now()}`,
      jugado_en: new Date().toISOString()
    };
    setPuntajesLocales((prev) => [item, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        jugador,
        setJugador,
        dificultad,
        setDificultad,
        sonidoActivo,
        setSonidoActivo,
        vibracionActiva,
        setVibracionActiva,
        modoInclinacionActivo,
        setModoInclinacionActivo,
        ciudadActual,
        setCiudadActual,
        puntajesLocales,
        registrarPuntajeLocal
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
}

export function useAppContext(): EstadoAppContext {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext debe usarse dentro de AppProvider");
  }
  return ctx;
}
