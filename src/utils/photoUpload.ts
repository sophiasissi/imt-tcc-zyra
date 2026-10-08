import { File } from 'expo-file-system';

/** Tipos de imagem que o back aceita no cadastro de peça. */
export type TipoDeImagem = 'image/jpeg' | 'image/png' | 'image/webp';

const EXTENSAO: Record<TipoDeImagem, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Tipo da imagem escolhida na galeria, ou null se o back não aceitar.
 *
 * A câmera sempre grava JPEG, mas a galeria pode ter PNG, WebP e outros
 * formatos. Usa o mimeType informado pelo seletor e, sem ele, a extensão.
 */
export function tipoDeImagemAceito(
  uri: string,
  mimeType?: string | null,
): TipoDeImagem | null {
  const tipo = mimeType?.toLowerCase();

  if (tipo === 'image/jpeg' || tipo === 'image/jpg') return 'image/jpeg';
  if (tipo === 'image/png') return 'image/png';
  if (tipo === 'image/webp') return 'image/webp';
  if (tipo) return null;

  const extensao = uri.split('?')[0].split('.').pop()?.toLowerCase();

  if (extensao === 'jpg' || extensao === 'jpeg') return 'image/jpeg';
  if (extensao === 'png') return 'image/png';
  if (extensao === 'webp') return 'image/webp';

  return null;
}

/**
 * Prepara a foto para ir num FormData.
 *
 * Desde o SDK 57 o `fetch` global é o do Expo, que não aceita mais o formato
 * antigo do React Native `{ uri, name, type }` — ele falha com "Unsupported
 * FormDataPart implementation". O que ele aceita é um objeto com `bytes()`,
 * e o `File` do expo-file-system lê o arquivo local desse jeito.
 *
 * Nome e tipo vão explícitos em vez de deduzidos da extensão: o back só
 * aceita image/jpeg, png ou webp, e guarda a foto com o tipo declarado aqui.
 * A câmera sempre grava JPEG; a galeria passa o tipo real da imagem.
 */
export function photoFormDataPart(
  uri: string,
  nomeBase: string,
  tipo: TipoDeImagem = 'image/jpeg',
): Blob {
  const arquivo = new File(uri);

  return {
    name: `${nomeBase}.${EXTENSAO[tipo]}`,
    type: tipo,
    bytes: () => arquivo.bytes(),
  } as unknown as Blob;
}
