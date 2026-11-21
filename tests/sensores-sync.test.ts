import { describe, expect, it, vi } from "vitest";
import { ApiClient, obtenerBaseUrlApi } from "@/src/api/client";
import { crearMemoriaTokenStore, SecureTokenStorage } from "@/src/api/token-storage";
import { ejecutarMigraciones, type SqliteDatabaseAdapter } from "@/src/db/sqlite";
import {
  PuntajeRepository,
  type RegistroPuntajeLocal
} from "@/src/repositories/puntaje.repository";
import {
  calcularMagnitudAceleracion,
  calcularOffsetParallax,
  detectarSacudida,
  determinarPasoInclinacion,
  moverIndiceCursor
} from "@/src/sensors/logica-sensores";
import { sincronizarPuntajesConApi } from "@/src/services/sincronizacion.service";

function aplicarInsertMock(
  tabla: Map<string, RegistroPuntajeLocal>,
  params: ReadonlyArray<string | number | null>
): void {
  const remoteId = String(params[0]);
  const pendingVal = typeof params[9] === "number" ? params[9] : 0;
  tabla.set(remoteId, {
    remote_id: remoteId,
    jugador: String(params[1]),
    dificultad: params[2] as "facil" | "medio" | "dificil",
    movimientos: Number(params[3]),
    segundos: Number(params[4]),
    ciudad: typeof params[5] === "string" ? params[5] : null,
    jugado_en: String(params[6]),
    updated_at: String(params[7]),
    deleted: Number(params[8]),
    pending: pendingVal
  });
}

function aplicarUpdateMock(
  tabla: Map<string, RegistroPuntajeLocal>,
  sql: string,
  params: ReadonlyArray<string | number | null>
): void {
  const updatedAt = String(params[0]);
  const remoteId = String(params[1]);
  const prev = tabla.get(remoteId);
  if (!prev) return;

  const borrado = sql.includes("SET deleted = 1");
  tabla.set(remoteId, {
    ...prev,
    deleted: borrado ? 1 : prev.deleted,
    pending: borrado ? 1 : 0,
    updated_at: updatedAt
  });
}

function crearMockSqlite(): {
  db: SqliteDatabaseAdapter;
  tabla: Map<string, RegistroPuntajeLocal>;
} {
  const tabla = new Map<string, RegistroPuntajeLocal>();
  const db: SqliteDatabaseAdapter = {
    execAsync: async () => {},
    runAsync: async (sql, params = []) => {
      if (sql.includes("INSERT OR REPLACE INTO puntaje")) {
        aplicarInsertMock(tabla, params);
      } else {
        aplicarUpdateMock(tabla, sql, params);
      }
    },
    getAllAsync: async <T>(sql: string, params: ReadonlyArray<unknown> = []) => {
      const valores = Array.from(tabla.values());
      if (sql.includes("WHERE remote_id = ?")) {
        return valores.filter((v) => v.remote_id === params[0]) as unknown as T[];
      }
      if (sql.includes("WHERE pending = 1")) {
        return valores.filter((v) => v.pending === 1) as unknown as T[];
      }
      return valores.filter(
        (v) => v.dificultad === params[0] && v.deleted === 0
      ) as unknown as T[];
    }
  };
  return { db, tabla };
}

describe("Sensores con mocks: funciones puras de acelerómetro y giroscopio", () => {
  it("detecta sacudida sobre el umbral G con cooldown y calcula parallax/cursor", () => {
    expect(calcularMagnitudAceleracion({ x: 0, y: 0, z: 1 })).toBe(1);

    const s1 = detectarSacudida({ x: 1.5, y: 1.5, z: 0.5 }, 0, 2000);
    expect(s1.sacudido).toBe(true);

    const sCooldown = detectarSacudida({ x: 2, y: 2, z: 2 }, s1.nuevoTimestampMs, 2500);
    expect(sCooldown.sacudido).toBe(false);

    const noSacudida = detectarSacudida({ x: 0.1, y: 0.1, z: 0.9 }, 0, 5000);
    expect(noSacudida.sacudido).toBe(false);

    expect(calcularOffsetParallax({ x: 0.5, y: -0.4, z: 0 })).toEqual({
      offsetX: -4,
      offsetY: 5
    });
    expect(determinarPasoInclinacion({ x: 0, y: 1.1, z: 0 })).toBe(1);
    expect(determinarPasoInclinacion({ x: 0, y: -1.1, z: 0 })).toBe(-1);
    expect(determinarPasoInclinacion({ x: 0, y: 0.2, z: 0 })).toBe(0);
    expect(moverIndiceCursor(0, -1, 8)).toBe(7);
    expect(moverIndiceCursor(0, 0, 0)).toBe(0);
  });
});

describe("Cliente HTTP: validación HTTPS y renovación de token en 401", () => {
  it("exige HTTPS en EXPO_PUBLIC_API_URL y renueva el token una vez cuando recibe 401", async () => {
    expect(() => obtenerBaseUrlApi("http://localhost:3000")).toThrow();
    expect(obtenerBaseUrlApi("https://09-memoria-juego-api.vercel.app/")).toBe(
      "https://09-memoria-juego-api.vercel.app"
    );

    const storage = new SecureTokenStorage(crearMemoriaTokenStore());
    await storage.guardarTokens({ token: "viejo-tok", refreshToken: "ref-1" });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Expirado" }), { status: 401 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ token: "nuevo-tok", refreshToken: "ref-2" }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const client = new ApiClient({
      baseUrl: "https://09-memoria-juego-api.vercel.app",
      tokenStorage: storage,
      fetchFn: fetchMock as unknown as typeof fetch
    });

    const res = await client.request<{ ok: boolean }>("/api/auth/yo");
    expect(res.ok).toBe(true);
    expect(await storage.obtenerToken()).toBe("nuevo-tok");
  });
});

describe("Cliente HTTP: expiración de sesión cuando falla el refresh", () => {
  it("limpia tokens y notifica onSesionExpirada si el refresh falla tras un 401", async () => {
    const storage = new SecureTokenStorage(crearMemoriaTokenStore());
    await storage.guardarTokens({ token: "tok", refreshToken: "ref-invalido" });
    const expiradaMock = vi.fn();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "No autorizado" }), { status: 401 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Refresh inválido" }), { status: 401 })
      );

    const client = new ApiClient({
      baseUrl: "https://09-memoria-juego-api.vercel.app",
      tokenStorage: storage,
      fetchFn: fetchMock as unknown as typeof fetch,
      onSesionExpirada: expiradaMock
    });

    await expect(client.request("/api/auth/yo")).rejects.toThrow();
    expect(expiradaMock).toHaveBeenCalledOnce();
    expect(await storage.obtenerToken()).toBeNull();
  });
});

describe("SQLite Repository: operaciones CRUD locales y listado Top 10", () => {
  it("inserta puntajes, aplica borrado lógico y lista por dificultad y ciudad", async () => {
    const { db } = crearMockSqlite();
    await ejecutarMigraciones(db);
    const repo = new PuntajeRepository(db);

    await repo.insertarPuntaje({
      remote_id: "uuid-1",
      jugador: "Ana",
      dificultad: "facil",
      movimientos: 5,
      segundos: 12,
      ciudad: "Medellín",
      updated_at: "2026-11-20T10:00:00.000Z"
    });
    await repo.insertarPuntaje({
      remote_id: "uuid-2",
      jugador: "Luis",
      dificultad: "facil",
      movimientos: 7,
      segundos: 18
    });
    await repo.marcarBorradoLogico("uuid-2", "2026-11-20T11:00:00.000Z");

    expect(await repo.listarTop10PorDificultad("facil", "Medellín")).toHaveLength(1);
    expect(await repo.listarTop10PorDificultad("facil")).toHaveLength(1);
  });
});

function crearFetchMockSync(): typeof fetch {
  const itemRemoto = {
    id: "uuid-remoto",
    jugador: "Remoto",
    dificultad: "facil",
    movimientos: 4,
    segundos: 10,
    ciudad: "Cali",
    jugado_en: "2026-11-20T12:00:00.000Z",
    created_at: "2026-11-20T12:00:00.000Z",
    updated_at: "2026-11-20T12:30:00.000Z",
    deleted_at: null
  };

  return vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: "uuid-1", updated_at: "2026-11-20T12:00:00.000Z" }),
        { status: 200 }
      )
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [itemRemoto],
          servidor_ahora: "2026-11-20T12:35:00.000Z"
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;
}

describe("Sincronización incremental con la API (PUT, DELETE y GET ?since=)", () => {
  it("envía pendientes locales y aplica cambios remotos con resolución LWW", async () => {
    const { db } = crearMockSqlite();
    const repo = new PuntajeRepository(db);
    await repo.insertarPuntaje({
      remote_id: "uuid-1",
      jugador: "Ana",
      dificultad: "facil",
      movimientos: 5,
      segundos: 12,
      updated_at: "2026-11-20T10:00:00.000Z"
    });
    await repo.insertarPuntaje({
      remote_id: "uuid-2",
      jugador: "Luis",
      dificultad: "facil",
      movimientos: 7,
      segundos: 18
    });
    await repo.marcarBorradoLogico("uuid-2", "2026-11-20T11:00:00.000Z");

    const storage = new SecureTokenStorage(crearMemoriaTokenStore());
    await storage.guardarTokens({ token: "tok-ok", refreshToken: "ref-ok" });

    const api = new ApiClient({
      baseUrl: "https://09-memoria-juego-api.vercel.app",
      tokenStorage: storage,
      fetchFn: crearFetchMockSync()
    });

    const syncRes = await sincronizarPuntajesConApi(repo, api);
    expect(syncRes.enviados).toBe(2);
    expect(syncRes.recibidos).toBe(1);
  });
});
