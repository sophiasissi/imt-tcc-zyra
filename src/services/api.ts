const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('EXPO_PUBLIC_API_URL não foi definida no arquivo .env');
}

type RequestOptions = RequestInit & {
  token?: string;
};

/**
 * Erro de API que preserva o status HTTP.
 *
 * Sem ele não dá para diferenciar "o servidor recusou" de "o celular está sem
 * rede", e o app acaba tratando os dois do mesmo jeito — foi o que fazia a
 * sessão ser apagada ao abrir o app offline.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number | null,
    isNetworkError = false,
  ) {
    super(message);

    // Garante que `instanceof ApiError` funcione mesmo se o Babel transpilar
    // a classe para função, o que quebraria a cadeia de protótipos.
    Object.setPrototypeOf(this, ApiError.prototype);

    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }

  /** Token ausente, inválido ou expirado. */
  get isUnauthorized() {
    return this.status === 401 || this.status === 403;
  }

  /** O recurso não existe — no /users/me significa perfil não criado. */
  get isNotFound() {
    return this.status === 404;
  }
}

function normalizeApiMessage(message: unknown) {
  if (!message) {
    return 'Não foi possível concluir a solicitação. Tente novamente.';
  }

  const rawMessage = Array.isArray(message)
    ? message.join('\n')
    : String(message);

  const lowerMessage = rawMessage.toLowerCase();

  if (
    lowerMessage.includes('internal server error') ||
    lowerMessage.includes('status code 500')
  ) {
    return 'Não foi possível concluir a solicitação. Tente novamente em alguns instantes.';
  }

  if (
    lowerMessage.includes('network request timed out') ||
    lowerMessage.includes('network request failed') ||
    lowerMessage.includes('failed to fetch')
  ) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  if (
    lowerMessage.includes('code mismatch') ||
    lowerMessage.includes('invalid verification code') ||
    lowerMessage.includes('invalid code')
  ) {
    return 'Código inválido. Confira o código enviado para seu email e tente novamente.';
  }

  if (lowerMessage.includes('expired code')) {
    return 'Este código expirou. Solicite um novo código e tente novamente.';
  }

  if (
    lowerMessage.includes('not authorized') ||
    lowerMessage.includes('incorrect username or password')
  ) {
    return 'Email ou senha inválidos. Confira seus dados e tente novamente.';
  }

  return rawMessage;
}

/**
 * Devolve um access token novo, ou null se a sessão acabou de vez.
 *
 * Registrado pelo AuthContext, que é quem tem o refresh token. Fica aqui,
 * como gancho, para que QUALQUER chamada autenticada ganhe a renovação
 * automática — inclusive as telas que ainda vão existir.
 */
type TokenRefresher = () => Promise<string | null>;

let refreshAuthToken: TokenRefresher | null = null;

export function setTokenRefresher(refresher: TokenRefresher | null) {
  refreshAuthToken = refresher;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  return runRequest<T>(endpoint, options, false);
}

async function runRequest<T>(
  endpoint: string,
  options: RequestOptions,
  jaRenovou: boolean,
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? normalizeApiMessage(error.message)
        : 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

    // Não houve resposta: o pedido não chegou ao servidor.
    throw new ApiError(message, null, true);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Token venceu durante o uso: renova uma vez e repete a chamada. Sem isso
    // o app fica inutilizável até ser fechado e reaberto, porque a renovação
    // só acontecia na abertura.
    const renovador = refreshAuthToken;
    const podeRenovar =
      response.status === 401 && Boolean(token) && !jaRenovou && renovador;

    if (podeRenovar && renovador) {
      const novoToken = await renovador();

      if (novoToken && novoToken !== token) {
        return runRequest<T>(endpoint, { ...options, token: novoToken }, true);
      }
    }

    const message = normalizeApiMessage(
      data?.message ?? 'Não foi possível concluir a requisição.',
    );

    throw new ApiError(message, response.status);
  }

  return data as T;
}
