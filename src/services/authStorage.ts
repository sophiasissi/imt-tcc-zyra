import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'zyra.auth.accessToken';
const ID_TOKEN_KEY = 'zyra.auth.idToken';
const REFRESH_TOKEN_KEY = 'zyra.auth.refreshToken';
const EXPIRES_IN_KEY = 'zyra.auth.expiresIn';
const TOKEN_TYPE_KEY = 'zyra.auth.tokenType';
const PROFILE_KEY = 'zyra.auth.profile';

export type StoredAuthTokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

function isValidToken(value?: string | null) {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function saveAuthTokens(tokens: StoredAuthTokens) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EXPIRES_IN_KEY, String(tokens.expiresIn)),
    SecureStore.setItemAsync(TOKEN_TYPE_KEY, tokens.tokenType),
  ]);
}

export async function getAuthTokens() {
  const [accessToken, idToken, refreshToken, expiresIn, tokenType] =
    await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(ID_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(EXPIRES_IN_KEY),
      SecureStore.getItemAsync(TOKEN_TYPE_KEY),
    ]);

  if (!isValidToken(accessToken) || !isValidToken(refreshToken)) {
    await clearAuthTokens();
    return null;
  }

  return {
    accessToken: accessToken.trim(),
    idToken: idToken?.trim() ?? '',
    refreshToken: refreshToken.trim(),
    expiresIn: Number(expiresIn ?? 0),
    tokenType: tokenType?.trim() ?? 'Bearer',
  };
}

export async function clearAuthTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(ID_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_IN_KEY),
    SecureStore.deleteItemAsync(TOKEN_TYPE_KEY),
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
