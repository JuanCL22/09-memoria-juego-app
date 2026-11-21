import type { ApiClient } from "@/src/api/client";
import type { PuntajeRepository } from "@/src/repositories/puntaje.repository";
import type { Dificultad } from "@/src/services/juego.service";

export interface DocumentoPuntajeRemoto {
  readonly id: string;
  readonly jugador: string;
  readonly dificultad: Dificultad;
  readonly movimientos: number;
  readonly segundos: number;
  readonly ciudad: string | null;
  readonly jugado_en: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
}

export interface RespuestaPullSincronizacion {
  readonly items: DocumentoPuntajeRemoto[];
  readonly servidor_ahora: string;
}

export interface ResultadoSincronizacion {
  readonly enviados: number;
  readonly recibidos: number;
  readonly nuevoSince: string;
}

async function enviarPendientesLocales(
  repo: PuntajeRepository,
  api: ApiClient
): Promise<number> {
  const pendientes = await repo.listarPendientes();
  let enviados = 0;

  for (const item of pendientes) {
    if (item.deleted === 1) {
      await api.request<{ ok: boolean }>(`/api/puntajes/${item.remote_id}`, {
        method: "DELETE"
      });
      await repo.marcarSincronizado(item.remote_id, new Date().toISOString());
      enviados += 1;
    } else {
      const guardado = await api.request<DocumentoPuntajeRemoto>(
        `/api/puntajes/${item.remote_id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            jugador: item.jugador,
            dificultad: item.dificultad,
            movimientos: item.movimientos,
            segundos: item.segundos,
            ciudad: item.ciudad,
            jugado_en: item.jugado_en
          })
        }
      );
      await repo.marcarSincronizado(item.remote_id, guardado.updated_at);
      enviados += 1;
    }
  }

  return enviados;
}

export async function sincronizarPuntajesConApi(
  repo: PuntajeRepository,
  api: ApiClient,
  ultimoSince?: string
): Promise<ResultadoSincronizacion> {
  const enviados = await enviarPendientesLocales(repo, api);

  let cursorSince = ultimoSince;
  let recibidos = 0;
  let servidorAhora = ultimoSince ?? new Date().toISOString();

  while (true) {
    const query = cursorSince ? `?since=${encodeURIComponent(cursorSince)}` : "";
    const pull = await api.request<RespuestaPullSincronizacion>(`/api/puntajes${query}`, {
      method: "GET"
    });
    servidorAhora = pull.servidor_ahora;

    for (const remoto of pull.items) {
      await repo.aplicarCambioRemoto(remoto);
      recibidos += 1;
    }

    const ultimoItem = pull.items[pull.items.length - 1];
    if (pull.items.length < 500 || !ultimoItem) {
      break;
    }
    cursorSince = ultimoItem.updated_at;
  }

  return {
    enviados,
    recibidos,
    nuevoSince: servidorAhora
  };
}
