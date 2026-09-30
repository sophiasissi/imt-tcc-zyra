import { File } from 'expo-file-system';

/**
 * Prepara a foto da câmera para ir num FormData.
 *
 * Desde o SDK 57 o `fetch` global é o do Expo, que não aceita mais o formato
 * antigo do React Native `{ uri, name, type }` — ele falha com "Unsupported
 * FormDataPart implementation". O que ele aceita é um objeto com `bytes()`,
 * e o `File` do expo-file-system lê o arquivo local desse jeito.
 *
 * Nome e tipo vão explícitos em vez de deduzidos da extensão: o back só
 * aceita image/jpeg, png ou webp, e a câmera sempre grava JPEG.
 */
export function photoFormDataPart(uri: string, fileName: string): Blob {
  const arquivo = new File(uri);

  return {
    name: fileName,
    type: 'image/jpeg',
    bytes: () => arquivo.bytes(),
  } as unknown as Blob;
}
