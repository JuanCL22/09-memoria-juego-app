export interface MuestraVector3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface OffsetParallax {
  readonly offsetX: number;
  readonly offsetY: number;
}

const UMBRAL_SACUDIDA_G = 1.75;
const COOLDOWN_SACUDIDA_MS = 1200;
const UMBRAL_INCLINACION_RAD = 0.85;

export function calcularMagnitudAceleracion(muestra: MuestraVector3D): number {
  return Math.sqrt(muestra.x * muestra.x + muestra.y * muestra.y + muestra.z * muestra.z);
}

export function detectarSacudida(
  muestra: MuestraVector3D,
  ultimaSacudidaMs: number,
  ahoraMs: number,
  umbralG: number = UMBRAL_SACUDIDA_G
): { sacudido: boolean; nuevoTimestampMs: number } {
  if (ahoraMs - ultimaSacudidaMs < COOLDOWN_SACUDIDA_MS) {
    return { sacudido: false, nuevoTimestampMs: ultimaSacudidaMs };
  }

  const magnitud = calcularMagnitudAceleracion(muestra);
  if (magnitud >= umbralG) {
    return { sacudido: true, nuevoTimestampMs: ahoraMs };
  }

  return { sacudido: false, nuevoTimestampMs: ultimaSacudidaMs };
}

export function calcularOffsetParallax(
  giro: MuestraVector3D,
  maximoPx: number = 14
): OffsetParallax {
  const limitar = (valor: number) =>
    Math.max(-maximoPx, Math.min(maximoPx, Math.round(valor * 10)));
  return {
    offsetX: limitar(giro.y),
    offsetY: limitar(giro.x)
  };
}

export function determinarPasoInclinacion(
  giro: MuestraVector3D,
  umbral: number = UMBRAL_INCLINACION_RAD
): -1 | 0 | 1 {
  if (giro.y >= umbral) {
    return 1;
  }
  if (giro.y <= -umbral) {
    return -1;
  }
  return 0;
}

export function moverIndiceCursor(
  indiceActual: number,
  paso: -1 | 0 | 1,
  totalCartas: number
): number {
  if (totalCartas <= 0 || paso === 0) {
    return 0;
  }
  return (indiceActual + paso + totalCartas) % totalCartas;
}
