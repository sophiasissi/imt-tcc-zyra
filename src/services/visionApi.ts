const VISION_API_URL = process.env.EXPO_PUBLIC_VISION_API_URL;

if (!VISION_API_URL) {
  throw new Error('EXPO_PUBLIC_VISION_API_URL não foi definida no arquivo .env');
}

export type DetectColorResponse = {
  colorName: string;
  hex: string;
  colorAddSymbol: string;
  warningCode?: string | null;
  warningMessage?: string | null;
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

  formData.append('file', {
    uri: imageUri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);

  let response: Response;

  try {
    response = await fetch(`${VISION_API_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API de visão. Verifique se ela está rodando.',
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ??
        data?.message ??
        'Não foi possível processar a imagem.',
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