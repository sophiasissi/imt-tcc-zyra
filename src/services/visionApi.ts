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

export async function detectColorFromImage(
  imageUri: string,
): Promise<DetectColorResponse> {
  const formData = new FormData();

  formData.append('file', {
    uri: imageUri,
    name: 'camera-frame.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  let response: Response;

  try {
    response = await fetch(`${VISION_API_URL}/detect-color`, {
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
        'Não foi possível identificar a cor da imagem.',
    );
  }

  return data as DetectColorResponse;
}