import type { SecureTokenStorage } from "@/src/api/token-storage";

export const DEFAULT_API_URL = "https://09-memoria-juego-api.vercel.app";

export function obtenerBaseUrlApi(envUrl?: string): string {
  const candidata = (envUrl ?? process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).trim();
  const limpia = candidata.replace(/\/+$/, "");
  if (!limpia.startsWith("https://")) {
    throw new Error("EXPO_PUBLIC_API_URL debe utilizar HTTPS obligatorio");
  }
  return limpia;
}

export class ApiClientError extends Error {
  public readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ApiClientError";
    this.status = status;
  }
}

export interface OpcionesClienteApi {
  readonly baseUrl?: string;
  readonly tokenStorage: SecureTokenStorage;
  readonly fetchFn?: typeof fetch;
  readonly onSesionExpirada?: () => void;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: SecureTokenStorage;
  private readonly fetchFn: typeof fetch;
  private readonly onSesionExpirada?: () => void;

  constructor(opciones: OpcionesClienteApi) {
    this.baseUrl = obtenerBaseUrlApi(opciones.baseUrl);
    this.tokenStorage = opciones.tokenStorage;
    this.fetchFn = opciones.fetchFn ?? fetch;
    this.onSesionExpirada = opciones.onSesionExpirada;
  }

  public async request<T>(
    ruta: string,
    init: RequestInit = {},
    autenticada: boolean = true
  ): Promise<T> {
    const respuesta = await this.ejecutarFetch(ruta, init, autenticada);

    if (respuesta.status === 401 && autenticada) {
      const renovado = await this.intentarRefreshToken();
      if (renovado) {
        const reintento = await this.ejecutarFetch(ruta, init, true);
        return this.procesarRespuesta<T>(reintento);
      }
      await this.tokenStorage.limpiarTokens();
      this.onSesionExpirada?.();
    }

    return this.procesarRespuesta<T>(respuesta);
  }

  private async ejecutarFetch(
    ruta: string,
    init: RequestInit,
    autenticada: boolean
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string> | undefined) ?? {})
    };

    if (autenticada) {
      const token = await this.tokenStorage.obtenerToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return this.fetchFn(`${this.baseUrl}${ruta}`, {
      ...init,
      headers
    });
  }

  private async intentarRefreshToken(): Promise<boolean> {
    const refreshToken = await this.tokenStorage.obtenerRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const res = await this.fetchFn(`${this.baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      return false;
    }

    const datos = (await res.json()) as {
      token: string;
      refreshToken: string;
    };
    await this.tokenStorage.guardarTokens({
      token: datos.token,
      refreshToken: datos.refreshToken
    });
    return true;
  }

  private async procesarRespuesta<T>(respuesta: Response): Promise<T> {
    const cuerpo = (await respuesta.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!respuesta.ok) {
      throw new ApiClientError(
        respuesta.status,
        cuerpo.error ?? `Error HTTP ${respuesta.status}`
      );
    }
    return cuerpo as T;
  }
}
