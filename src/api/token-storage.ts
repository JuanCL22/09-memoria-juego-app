export interface TokenStoreAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const KEY_ID_TOKEN = "memoria09_id_token";
const KEY_REFRESH_TOKEN = "memoria09_refresh_token";

export interface ParTokensSesion {
  readonly token: string;
  readonly refreshToken: string;
}

export class SecureTokenStorage {
  private readonly store: TokenStoreAdapter;

  constructor(store: TokenStoreAdapter) {
    this.store = store;
  }

  public async guardarTokens(par: ParTokensSesion): Promise<void> {
    await this.store.setItemAsync(KEY_ID_TOKEN, par.token);
    await this.store.setItemAsync(KEY_REFRESH_TOKEN, par.refreshToken);
  }

  public async obtenerToken(): Promise<string | null> {
    return this.store.getItemAsync(KEY_ID_TOKEN);
  }

  public async obtenerRefreshToken(): Promise<string | null> {
    return this.store.getItemAsync(KEY_REFRESH_TOKEN);
  }

  public async limpiarTokens(): Promise<void> {
    await this.store.deleteItemAsync(KEY_ID_TOKEN);
    await this.store.deleteItemAsync(KEY_REFRESH_TOKEN);
  }
}

export function crearMemoriaTokenStore(): TokenStoreAdapter {
  const memoria = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => memoria.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => {
      memoria.set(key, value);
    },
    deleteItemAsync: async (key: string) => {
      memoria.delete(key);
    }
  };
}
