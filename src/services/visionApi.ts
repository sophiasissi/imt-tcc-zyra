import { File, Paths } from 'expo-file-system';

import {
  fetchWithTimeout,
  isNetworkErrorMessage,
} from '../utils/fetchWithTimeout';
import { photoFormDataPart, TipoDeImagem } from '../utils/photoUpload';

// O /detect-color e o /validate-clothing respondem em menos de um segundo na
// rede local. Passar muito disso é sinal de servidor inalcançável.
const VISION_TIMEOUT_MS = 10_000;

const VISION_API_URL = process.env.EXPO_PUBLIC_VISION_API_URL;

if (!VISION_API_URL) {
  throw new Error(
    'EXPO_PUBLIC_VISION_API_URL não foi definida no arquivo .env',
  );
}

export type DetectColorResponse = {
  colorName: string;
  hex: string;
  colorAddSymbol: string;
  /** Cor dominante lida, útil para depurar leituras estranhas. */
  rgb?: [number, number, number];
  /** Fração de pixels próximos da cor dominante, de 0 a 1. */
  confidence?: number;
  warningCode?: string | null;
};

export type ValidateClothingResponse = {
  isClothing: boolean;
  confidence: number;
  reason?: 'PERSON_DETECTED' | 'NOT_CLOTHING' | string | null;
};

async function postImageFile<TResponse>(
  endpoint: string,
  imageUri: string,
  nomeBase: string,
  tipo?: TipoDeImagem,
): Promise<TResponse> {
  const formData = new FormData();

  formData.append('file', photoFormDataPart(imageUri, nomeBase, tipo));

  const url = `${VISION_API_URL}${endpoint}`;

  let response: Response;

  try {
    response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      },
      VISION_TIMEOUT_MS,
    );
  } catch (error) {
    // O catch daqui era vazio e sempre culpava a conexão. Qualquer falha —
    // arquivo da foto inexistente, URI inválida, corpo malformado — aparecia
    // como "a API está fora do ar", mandando procurar o problema no lugar
    // errado. Agora o motivo real vai para o log.
    const detalhe =
      error instanceof Error ? error.message : String(error ?? 'desconhecido');

    console.error(
      `[Visão] Falha ao enviar a imagem para ${url}\n` +
        `  motivo: ${detalhe}\n` +
        `  arquivo: ${imageUri}`,
    );

    const pareceRede = isNetworkErrorMessage(detalhe);

    throw new Error(
      pareceRede
        ? 'Não foi possível falar com a API de visão. Verifique se ela está rodando e se o celular está na mesma rede.'
        : `Não foi possível enviar a foto para análise. (${detalhe})`,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ?? data?.message ?? 'Não foi possível processar a imagem.',
    );
  }

  return data as TResponse;
}

/** `tipo` só é preciso para imagens da galeria; a câmera grava JPEG. */
export async function detectColorFromImage(
  imageUri: string,
  tipo?: TipoDeImagem,
): Promise<DetectColorResponse> {
  return postImageFile<DetectColorResponse>(
    '/detect-color',
    imageUri,
    'camera-frame',
    tipo,
  );
}

export async function validateClothingFromImage(
  imageUri: string,
  tipo?: TipoDeImagem,
): Promise<ValidateClothingResponse> {
  return postImageFile<ValidateClothingResponse>(
    '/validate-clothing',
    imageUri,
    'clothing-validation',
    tipo,
  );
}

// Recortar o fundo leva ~1 s no servidor; o resto é o envio da foto.
const REMOVE_BACKGROUND_TIMEOUT_MS = 20_000;

/**
 * Peça sem fundo (WebP com transparência), num arquivo temporário do app.
 *
 * Devolve null se não der (visão fora do ar, peça não encontrada): o cadastro
 * segue com a foto original, então a pessoa nunca fica travada por isso.
 */
export async function removeBackgroundFromImage(
  imageUri: string,
  tipo?: TipoDeImagem,
): Promise<string | null> {
  const formData = new FormData();
  formData.append(
    'file',
    photoFormDataPart(imageUri, 'remove-background', tipo),
  );

  try {
    const response = await fetchWithTimeout(
      `${VISION_API_URL}/remove-background`,
      { method: 'POST', body: formData, headers: { Accept: 'image/webp' } },
      REMOVE_BACKGROUND_TIMEOUT_MS,
    );

    if (!response.ok) {
      console.warn(
        `[Visão] Fundo não removido (HTTP ${response.status}); seguindo com a foto original.`,
      );
      return null;
    }

    const arquivo = new File(Paths.cache, `peca-sem-fundo-${Date.now()}.webp`);
    arquivo.write(new Uint8Array(await response.arrayBuffer()));
    return arquivo.uri;
  } catch (error) {
    console.warn(
      '[Visão] Fundo não removido; seguindo com a foto original:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
