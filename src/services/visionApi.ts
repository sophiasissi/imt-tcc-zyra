import {
  fetchWithTimeout,
  isNetworkErrorMessage,
} from '../utils/fetchWithTimeout';
import { photoFormDataPart } from '../utils/photoUpload';

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
  fileName: string,
): Promise<TResponse> {
  const formData = new FormData();

  formData.append('file', photoFormDataPart(imageUri, fileName));

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

export async function detectColorFromImage(
  imageUri: string,
): Promise<DetectColorResponse> {
  return postImageFile<DetectColorResponse>(
    '/detect-color',
    imageUri,
    'camera-frame.jpg',
  );
}

export async function validateClothingFromImage(
  imageUri: string,
): Promise<ValidateClothingResponse> {
  return postImageFile<ValidateClothingResponse>(
    '/validate-clothing',
    imageUri,
    'clothing-validation.jpg',
  );
}
