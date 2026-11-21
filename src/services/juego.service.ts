export type Dificultad = "facil" | "medio" | "dificil";

export interface CartaMemoria {
  readonly id: string;
  readonly parejaId: string;
  readonly simbolo: string;
  readonly volteada: boolean;
  readonly encontrada: boolean;
}

export interface ResultadoTurno {
  readonly cartas: CartaMemoria[];
  readonly movimientos: number;
  readonly acierto: boolean | null;
  readonly ocultarTrasMs: number | null;
  readonly terminada: boolean;
}

const SIMBOLOS_BASE: ReadonlyArray<string> = [
  "🚀",
  "🎸",
  "🦊",
  "🌵",
  "💎",
  "🧩",
  "⚡",
  "🪐",
  "🎯",
  "🍀",
  "🐳",
  "🔥"
];

const PAREJAS_POR_DIFICULTAD: Record<Dificultad, number> = {
  facil: 4,
  medio: 6,
  dificil: 12
};

export function obtenerCantidadParejas(dificultad: Dificultad): number {
  return PAREJAS_POR_DIFICULTAD[dificultad];
}

export function validarNombreJugador(nombre: string): {
  valido: boolean;
  limpio: string;
  error: string | null;
} {
  const limpio = nombre.trim();
  if (limpio.length < 2 || limpio.length > 15) {
    return {
      valido: false,
      limpio,
      error: "El nombre debe tener entre 2 y 15 caracteres"
    };
  }
  return { valido: true, limpio, error: null };
}

export function barajar<T>(
  elementos: ReadonlyArray<T>,
  rng: () => number = Math.random
): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const actual = copia[i];
    const destino = copia[j];
    if (actual !== undefined && destino !== undefined) {
      copia[i] = destino;
      copia[j] = actual;
    }
  }
  return copia;
}

export function crearTablero(
  dificultad: Dificultad,
  rng: () => number = Math.random
): CartaMemoria[] {
  const totalParejas = obtenerCantidadParejas(dificultad);
  const simbolos = SIMBOLOS_BASE.slice(0, totalParejas);
  const pares: CartaMemoria[] = [];

  simbolos.forEach((simbolo, idx) => {
    const parejaId = `par-${idx + 1}`;
    pares.push({
      id: `${parejaId}-a`,
      parejaId,
      simbolo,
      volteada: false,
      encontrada: false
    });
    pares.push({
      id: `${parejaId}-b`,
      parejaId,
      simbolo,
      volteada: false,
      encontrada: false
    });
  });

  return barajar(pares, rng);
}

export function detectarFinPartida(cartas: ReadonlyArray<CartaMemoria>): boolean {
  return cartas.length > 0 && cartas.every((c) => c.encontrada);
}

function evaluarParejaAbierta(
  trasVoltear: CartaMemoria[],
  abiertasAhora: CartaMemoria[],
  nuevoMovimientos: number
): ResultadoTurno {
  const primera = abiertasAhora[0];
  const segunda = abiertasAhora[1];
  const esPareja =
    primera !== undefined &&
    segunda !== undefined &&
    primera.parejaId === segunda.parejaId;

  if (esPareja) {
    const conPareja = trasVoltear.map((c) =>
      c.volteada && !c.encontrada ? { ...c, encontrada: true } : c
    );
    return {
      cartas: conPareja,
      movimientos: nuevoMovimientos,
      acierto: true,
      ocultarTrasMs: null,
      terminada: detectarFinPartida(conPareja)
    };
  }

  return {
    cartas: trasVoltear,
    movimientos: nuevoMovimientos,
    acierto: false,
    ocultarTrasMs: 800,
    terminada: false
  };
}

export function voltearCarta(
  cartas: ReadonlyArray<CartaMemoria>,
  cartaId: string,
  movimientosActuales: number
): ResultadoTurno {
  const abiertasNoEncontradas = cartas.filter((c) => c.volteada && !c.encontrada);
  const objetivo = cartas.find((c) => c.id === cartaId);

  if (
    !objetivo ||
    objetivo.volteada ||
    objetivo.encontrada ||
    abiertasNoEncontradas.length >= 2
  ) {
    return {
      cartas: [...cartas],
      movimientos: movimientosActuales,
      acierto: null,
      ocultarTrasMs: null,
      terminada: detectarFinPartida(cartas)
    };
  }

  const trasVoltear = cartas.map((c) =>
    c.id === cartaId ? { ...c, volteada: true } : c
  );
  const abiertasAhora = trasVoltear.filter((c) => c.volteada && !c.encontrada);

  if (abiertasAhora.length < 2) {
    return {
      cartas: trasVoltear,
      movimientos: movimientosActuales,
      acierto: null,
      ocultarTrasMs: null,
      terminada: false
    };
  }

  return evaluarParejaAbierta(trasVoltear, abiertasAhora, movimientosActuales + 1);
}

export function ocultarCartasNoEmparejadas(
  cartas: ReadonlyArray<CartaMemoria>
): CartaMemoria[] {
  return cartas.map((c) => (c.encontrada ? c : { ...c, volteada: false }));
}

export function barajarCartasRestantes(
  cartas: ReadonlyArray<CartaMemoria>,
  rng: () => number = Math.random
): CartaMemoria[] {
  const ocultas = ocultarCartasNoEmparejadas(cartas);
  return barajar(ocultas, rng);
}
