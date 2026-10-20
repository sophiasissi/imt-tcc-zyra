import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Imagens menores antes de irem para a visão pela rede.
 *
 * Em 20/10/2026, a câmera mandava a foto inteira (12 MP) a cada 0,8 s para
 * ler a cor, e o cadastro mandava a mesma foto três vezes (validação, cor e
 * fundo). Num Wi-Fi de 2,4 GHz isso estourava os 10 s de espera.
 */

// Mesmo recorte que a visão faz (CROP_RATIO em detect_color.py): um quadrado
// de 12% do lado menor, no centro, onde fica a mira.
const PROPORCAO_DA_MIRA = 0.12;

// 240 px: nas 39 fotos de tests/eval, a cor lida da mira reduzida foi a mesma
// da foto inteira em todas (com 96 e 160 px, em 37 e 38). ~12 KB por leitura.
const LADO_DA_MIRA = 240;

// O recorte de fundo já trabalha com 1600 px e o CLIP com 224: acima disso, a
// foto só pesa na rede.
const LADO_MAXIMO_DA_FOTO = 1600;

/** Só a área da mira, em 240 px, para o /detect-color?regiao=mira. */
export async function recortarMira(
  uri: string,
  largura: number,
  altura: number,
) {
  const lado = Math.max(
    Math.round(Math.min(largura, altura) * PROPORCAO_DA_MIRA),
    1,
  );
  const contexto = ImageManipulator.manipulate(uri)
    .crop({
      originX: Math.round(largura / 2 - lado / 2),
      originY: Math.round(altura / 2 - lado / 2),
      width: lado,
      height: lado,
    })
    .resize({ width: LADO_DA_MIRA, height: LADO_DA_MIRA });
  const imagem = await contexto.renderAsync();
  const resultado = await imagem.saveAsync({
    compress: 0.9,
    format: SaveFormat.JPEG,
  });
  return resultado.uri;
}

/**
 * Foto da peça com no máximo 1600 px no lado maior, em JPEG. É ela que vai
 * para a validação, a cor, o recorte de fundo e o cadastro.
 */
export async function reduzirFoto(
  uri: string,
  largura: number,
  altura: number,
) {
  let contexto = ImageManipulator.manipulate(uri);
  if (Math.max(largura, altura) > LADO_MAXIMO_DA_FOTO) {
    contexto = contexto.resize(
      largura >= altura
        ? { width: LADO_MAXIMO_DA_FOTO }
        : { height: LADO_MAXIMO_DA_FOTO },
    );
  }
  const imagem = await contexto.renderAsync();
  const resultado = await imagem.saveAsync({
    compress: 0.85,
    format: SaveFormat.JPEG,
  });
  return resultado.uri;
}
