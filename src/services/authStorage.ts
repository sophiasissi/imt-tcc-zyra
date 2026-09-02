import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'zyra.auth.accessToken';
const ID_TOKEN_KEY = 'zyra.auth.idToken';
const REFRESH_TOKEN_KEY = 'zyra.auth.refreshToken';
const EXPIRES_IN_KEY = 'zyra.auth.expiresIn';
const TOKEN_TYPE_KEY = 'zyra.auth.tokenType';
const PROFILE_KEY = 'zyra.auth.profile';
const EXPIRES_AT_KEY = 'zyra.auth.expiresAt';

export type StoredAuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  /**
   * Instante (epoch em ms) em que o access token vence.
   *
   * O `expiresIn` sozinho é uma duração e não diz nada depois que o app
   * fecha — só a partir do instante absoluto dá para saber se o token ainda
   * vale. Ausente para sessões salvas antes desta versão.
   */
  expiresAt?: number;
};

/**
 * O `value is string` no retorno e' um type predicate: ele avisa ao
 * TypeScript que, quando esta funcao devolve true, o argumento pode ser
 * tratado como string. Sem isso o compilador ve so' um boolean opaco e
 * continua achando que o valor pode ser null depois da checagem.
 */
function isValidToken(value?: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function saveAuthTokens(tokens: StoredAuthTokens) {
  const expiresAt =
    tokens.expiresAt ??
    (tokens.expiresIn > 0 ? Date.now() + tokens.expiresIn * 1000 : 0);

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EXPIRES_IN_KEY, String(tokens.expiresIn)),
    SecureStore.setItemAsync(TOKEN_TYPE_KEY, tokens.tokenType),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt)),
  ]);
}

export async function getAuthTokens() {
  const [accessToken, idToken, refreshToken, expiresIn, tokenType, expiresAt] =
    await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(ID_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(EXPIRES_IN_KEY),
      SecureStore.getItemAsync(TOKEN_TYPE_KEY),
      SecureStore.getItemAsync(EXPIRES_AT_KEY),
    ]);

  if (!isValidToken(accessToken) || !isValidToken(refreshToken)) {
    await clearAuthTokens();
    return null;
  }

  const parsedExpiresAt = Number(expiresAt ?? 0);

  return {
    accessToken: accessToken.trim(),
    idToken: idToken?.trim() ?? '',
    refreshToken: refreshToken.trim(),
    expiresIn: Number(expiresIn ?? 0),
    tokenType: tokenType?.trim() ?? 'Bearer',
    expiresAt: parsedExpiresAt > 0 ? parsedExpiresAt : undefined,
  };
}

export async function clearAuthTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(ID_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_IN_KEY),
    SecureStore.deleteItemAsync(TOKEN_TYPE_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
    SecureStore.deleteItemAsync(PROFILE_KEY),
  ]);
}

/**
 * Guarda o último perfil conhecido.
 *
 * Sem esse cache, abrir o app sem internet deixa o usuário sem perfil e o
 * `isAuthenticated` vira falso — ou seja, mesmo preservando os tokens ele
 * cairia na tela de introdução como se estivesse deslogado.
 */
export async function saveCachedProfile(profile: unknown) {
  try {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    // Cache é melhor-esforço: se falhar, o app segue buscando na API.
    console.warn('[Sessão] Não foi possível guardar o perfil em cache:', error);
  }
}

export async function getCachedProfile<T>(): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
