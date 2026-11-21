import type { Dificultad } from "@/src/services/juego.service";

export interface ItemPuntaje {
  readonly id: string;
  readonly jugador: string;
  readonly dificultad: Dificultad;
  readonly movimientos: number;
  readonly segundos: number;
  readonly ciudad: string | null;
  readonly jugado_en: string;
}

export function ordenarTop10Ranking<
  T extends { readonly movimientos: number; readonly segundos: number }
>(puntajes: ReadonlyArray<T>): T[] {
  return [...puntajes]
    .sort((a, b) => {
      if (a.movimientos !== b.movimientos) {
        return a.movimientos - b.movimientos;
      }
      return a.segundos - b.segundos;
    })
    .slice(0, 10);
}

export function filtrarYOrdenarRanking(
  puntajes: ReadonlyArray<ItemPuntaje>,
  dificultad: Dificultad,
  ciudad?: string | null
): ItemPuntaje[] {
  const ciudadFiltro = ciudad?.trim().toLowerCase() ?? "";
  const filtrados = puntajes.filter((p) => {
    if (p.dificultad !== dificultad) {
      return false;
    }
    if (ciudadFiltro !== "") {
      return (p.ciudad ?? "").trim().toLowerCase() === ciudadFiltro;
    }
    return true;
  });

  return ordenarTop10Ranking(filtrados);
}
