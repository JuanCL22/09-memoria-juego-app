import { describe, expect, it } from "vitest";
import {
  barajar,
  barajarCartasRestantes,
  crearTablero,
  detectarFinPartida,
  obtenerCantidadParejas,
  ocultarCartasNoEmparejadas,
  validarNombreJugador,
  voltearCarta
} from "@/src/services/juego.service";
import {
  filtrarYOrdenarRanking,
  ordenarTop10Ranking,
  type ItemPuntaje
} from "@/src/services/ranking.service";

describe("Lógica pura: barajar() y creación de tablero", () => {
  it("barajar() conserva todas las parejas y la cantidad exacta de cartas", () => {
    const tableroFacil = crearTablero("facil", () => 0.42);
    const tableroMedio = crearTablero("medio", () => 0.15);
    const tableroDificil = crearTablero("dificil", () => 0.77);

    expect(obtenerCantidadParejas("facil")).toBe(4);
    expect(tableroFacil).toHaveLength(8);
    expect(tableroMedio).toHaveLength(12);
    expect(tableroDificil).toHaveLength(24);

    const conteoPorPareja = new Map<string, number>();
    for (const carta of tableroDificil) {
      conteoPorPareja.set(carta.parejaId, (conteoPorPareja.get(carta.parejaId) ?? 0) + 1);
    }
    expect(conteoPorPareja.size).toBe(12);
    for (const total of conteoPorPareja.values()) {
      expect(total).toBe(2);
    }

    const original = [1, 2, 3, 4, 5, 6];
    const barajado = barajar(original);
    expect(barajado.sort()).toEqual(original);
  });

  it("valida que el nombre del jugador tenga entre 2 y 15 caracteres", () => {
    expect(validarNombreJugador("A").valido).toBe(false);
    expect(validarNombreJugador("NombreDemasiadoLargo123").valido).toBe(false);
    expect(validarNombreJugador("  Ana  ")).toEqual({
      valido: true,
      limpio: "Ana",
      error: null
    });
  });
});

describe("Lógica de turnos, bloqueo de > 2 cartas y detección de fin de partida", () => {
  it("no permite voltear la misma carta dos veces ni más de 2 cartas y oculta tras 800 ms si fallan", () => {
    const cartas = [
      { id: "1a", parejaId: "p1", simbolo: "🚀", volteada: false, encontrada: false },
      { id: "1b", parejaId: "p1", simbolo: "🚀", volteada: false, encontrada: false },
      { id: "2a", parejaId: "p2", simbolo: "🎸", volteada: false, encontrada: false },
      { id: "2b", parejaId: "p2", simbolo: "🎸", volteada: false, encontrada: false }
    ];

    const t1 = voltearCarta(cartas, "1a", 0);
    expect(t1.acierto).toBeNull();
    expect(t1.movimientos).toBe(0);

    const repetida = voltearCarta(t1.cartas, "1a", t1.movimientos);
    expect(repetida.movimientos).toBe(0);

    const fallo = voltearCarta(t1.cartas, "2a", t1.movimientos);
    expect(fallo.acierto).toBe(false);
    expect(fallo.ocultarTrasMs).toBe(800);
    expect(fallo.movimientos).toBe(1);

    const intentoTercera = voltearCarta(fallo.cartas, "1b", fallo.movimientos);
    expect(intentoTercera.movimientos).toBe(1);

    const ocultas = ocultarCartasNoEmparejadas(fallo.cartas);
    expect(ocultas.every((c) => !c.volteada)).toBe(true);
  });

  it("detecta pareja correcta, baraja restantes y detecta fin de partida", () => {
    const cartas = [
      { id: "1a", parejaId: "p1", simbolo: "🚀", volteada: false, encontrada: false },
      { id: "1b", parejaId: "p1", simbolo: "🚀", volteada: false, encontrada: false }
    ];

    expect(detectarFinPartida([])).toBe(false);
    const t1 = voltearCarta(cartas, "1a", 0);
    const t2 = voltearCarta(t1.cartas, "1b", t1.movimientos);

    expect(t2.acierto).toBe(true);
    expect(t2.terminada).toBe(true);
    expect(detectarFinPartida(t2.cartas)).toBe(true);
    expect(barajarCartasRestantes(t2.cartas)).toHaveLength(2);
  });
});

describe("Servicio de ranking: ordena por movimientos ASC y luego por segundos ASC", () => {
  it("ordena Top 10 por movimientos y desempata por segundos, con filtro opcional de ciudad", () => {
    const datos: ItemPuntaje[] = [
      {
        id: "1",
        jugador: "Luis",
        dificultad: "medio",
        movimientos: 10,
        segundos: 30,
        ciudad: "Bogotá",
        jugado_en: "2026-11-20T00:00:00.000Z"
      },
      {
        id: "2",
        jugador: "Ana",
        dificultad: "medio",
        movimientos: 8,
        segundos: 25,
        ciudad: "Medellín",
        jugado_en: "2026-11-20T00:00:00.000Z"
      },
      {
        id: "3",
        jugador: "Sofía",
        dificultad: "medio",
        movimientos: 8,
        segundos: 19,
        ciudad: "Medellín",
        jugado_en: "2026-11-20T00:00:00.000Z"
      },
      {
        id: "4",
        jugador: "Pedro",
        dificultad: "facil",
        movimientos: 4,
        segundos: 9,
        ciudad: "Medellín",
        jugado_en: "2026-11-20T00:00:00.000Z"
      }
    ];

    const globalMedio = filtrarYOrdenarRanking(datos, "medio");
    expect(globalMedio.map((x) => x.jugador)).toEqual(["Sofía", "Ana", "Luis"]);

    const medellinMedio = filtrarYOrdenarRanking(datos, "medio", "medellín");
    expect(medellinMedio.map((x) => x.jugador)).toEqual(["Sofía", "Ana"]);
    expect(ordenarTop10Ranking(datos)).toHaveLength(4);
  });
});
