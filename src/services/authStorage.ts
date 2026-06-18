import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'zyra.auth.accessToken';
const ID_TOKEN_KEY = 'zyra.auth.idToken';
const REFRESH_TOKEN_KEY = 'zyra.auth.refreshToken';
const EXPIRES_IN_KEY = 'zyra.auth.expiresIn';
const TOKEN_TYPE_KEY = 'zyra.auth.tokenType';

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
  ]);
}