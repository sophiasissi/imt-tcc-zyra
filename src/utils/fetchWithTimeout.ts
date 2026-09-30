/**
 * `fetch` com prazo máximo.
 *
 * Sem prazo, quando o servidor está inalcançável (IP do .env errado, celular
 * em outra rede) o pedido só falha depois do timeout nativo, de cerca de um
 * minuto — e a tela fica carregando esse tempo todo sem dizer nada.
 */
export class RequestTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`network request timed out após ${timeoutMs / 1000}s (${url})`);

    Object.setPrototypeOf(this, RequestTimeoutError.prototype);

    this.name = 'RequestTimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new RequestTimeoutError(url, timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Falha de rede, e não de arquivo ou de corpo malformado.
 *
 * O `fetch` do Expo (SDK 57) não usa mais "Network request failed" do React
 * Native: ele devolve "fetch failed: ... The request timed out." ou "... could
 * not connect to the server.", que as checagens antigas não reconheciam.
 */
export function isNetworkErrorMessage(message: string) {
  return /network request (failed|timed out)|failed to fetch|timed out|could not connect|connection (was lost|refused)|network connection|offline/i.test(
    message,
  );
}
