export interface SqliteDatabaseAdapter {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: ReadonlyArray<string | number | null>): Promise<void>;
  getAllAsync<T>(
    sql: string,
    params?: ReadonlyArray<string | number | null>
  ): Promise<T[]>;
}

export const SQL_MIGRACION_PUNTAJE = `
CREATE TABLE IF NOT EXISTS puntaje (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jugador TEXT NOT NULL,
  dificultad TEXT NOT NULL CHECK (dificultad IN ('facil','medio','dificil')),
  movimientos INTEGER NOT NULL CHECK (movimientos > 0),
  segundos INTEGER NOT NULL CHECK (segundos > 0),
  ciudad TEXT DEFAULT NULL,
  jugado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remote_id TEXT UNIQUE,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_puntaje_ranking
  ON puntaje (dificultad, deleted, movimientos, segundos);
`;

export async function ejecutarMigraciones(db: SqliteDatabaseAdapter): Promise<void> {
  await db.execAsync(SQL_MIGRACION_PUNTAJE);
}
