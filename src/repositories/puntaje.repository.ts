import type { SqliteDatabaseAdapter } from "@/src/db/sqlite";
import type { Dificultad } from "@/src/services/juego.service";
import { ordenarTop10Ranking } from "@/src/services/ranking.service";

export interface RegistroPuntajeLocal {
  readonly id?: number;
  readonly remote_id: string;
  readonly jugador: string;
  readonly dificultad: Dificultad;
  readonly movimientos: number;
  readonly segundos: number;
  readonly ciudad: string | null;
  readonly jugado_en: string;
  readonly updated_at: string;
  readonly deleted: number;
  readonly pending: number;
}

export interface NuevoPuntajeLocalInput {
  readonly remote_id: string;
  readonly jugador: string;
  readonly dificultad: Dificultad;
  readonly movimientos: number;
  readonly segundos: number;
  readonly ciudad?: string | null;
  readonly jugado_en?: string;
  readonly updated_at?: string;
}

export class PuntajeRepository {
  private readonly db: SqliteDatabaseAdapter;

  constructor(db: SqliteDatabaseAdapter) {
    this.db = db;
  }

  public async insertarPuntaje(
    input: NuevoPuntajeLocalInput
  ): Promise<RegistroPuntajeLocal> {
    const ahora = new Date().toISOString();
    const registro: RegistroPuntajeLocal = {
      remote_id: input.remote_id,
      jugador: input.jugador.trim(),
      dificultad: input.dificultad,
      movimientos: input.movimientos,
      segundos: input.segundos,
      ciudad: input.ciudad ?? null,
      jugado_en: input.jugado_en ?? ahora,
      updated_at: input.updated_at ?? ahora,
      deleted: 0,
      pending: 1
    };

    await this.db.runAsync(
      `INSERT OR REPLACE INTO puntaje
        (remote_id, jugador, dificultad, movimientos, segundos, ciudad, jugado_en, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.remote_id,
        registro.jugador,
        registro.dificultad,
        registro.movimientos,
        registro.segundos,
        registro.ciudad,
        registro.jugado_en,
        registro.updated_at,
        registro.deleted,
        registro.pending
      ]
    );

    return registro;
  }

  public async listarTop10PorDificultad(
    dificultad: Dificultad,
    ciudad?: string | null
  ): Promise<RegistroPuntajeLocal[]> {
    const filas = await this.db.getAllAsync<RegistroPuntajeLocal>(
      `SELECT * FROM puntaje
       WHERE dificultad = ? AND deleted = 0
       ORDER BY movimientos ASC, segundos ASC
       LIMIT 50`,
      [dificultad]
    );

    const ciudadLimpia = ciudad?.trim().toLowerCase() ?? "";
    const filtradas =
      ciudadLimpia === ""
        ? filas
        : filas.filter((f) => (f.ciudad ?? "").trim().toLowerCase() === ciudadLimpia);

    return ordenarTop10Ranking(filtradas);
  }

  public async listarPendientes(): Promise<RegistroPuntajeLocal[]> {
    return this.db.getAllAsync<RegistroPuntajeLocal>(
      `SELECT * FROM puntaje WHERE pending = 1 ORDER BY updated_at ASC`,
      []
    );
  }

  public async marcarSincronizado(
    remoteId: string,
    updatedAtServidor: string
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE puntaje SET pending = 0, updated_at = ? WHERE remote_id = ?`,
      [updatedAtServidor, remoteId]
    );
  }

  public async marcarBorradoLogico(
    remoteId: string,
    ahoraIso: string = new Date().toISOString()
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE puntaje SET deleted = 1, pending = 1, updated_at = ? WHERE remote_id = ?`,
      [ahoraIso, remoteId]
    );
  }

  public async aplicarCambioRemoto(remoto: {
    readonly id: string;
    readonly jugador: string;
    readonly dificultad: Dificultad;
    readonly movimientos: number;
    readonly segundos: number;
    readonly ciudad: string | null;
    readonly jugado_en: string;
    readonly updated_at: string;
    readonly deleted_at: string | null;
  }): Promise<void> {
    const existentes = await this.db.getAllAsync<RegistroPuntajeLocal>(
      `SELECT * FROM puntaje WHERE remote_id = ?`,
      [remoto.id]
    );
    const local = existentes[0];

    if (local && local.updated_at > remoto.updated_at) {
      return;
    }

    const deleted = remoto.deleted_at !== null ? 1 : 0;
    await this.db.runAsync(
      `INSERT OR REPLACE INTO puntaje
        (remote_id, jugador, dificultad, movimientos, segundos, ciudad, jugado_en, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        remoto.id,
        remoto.jugador,
        remoto.dificultad,
        remoto.movimientos,
        remoto.segundos,
        remoto.ciudad,
        remoto.jugado_en,
        remoto.updated_at,
        deleted
      ]
    );
  }
}
