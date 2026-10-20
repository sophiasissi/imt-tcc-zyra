import { photoFormDataPart, TipoDeImagem } from '../utils/photoUpload';
import { apiRequest } from './api';

// Códigos da taxonomia de peças: os mesmos dos enums do Prisma no back e do
// taxonomy.py da visão.
export type Categoria =
  | 'CAMISETA'
  | 'CAMISA'
  | 'BLUSA'
  | 'CROPPED'
  | 'TOP'
  | 'BODY'
  | 'MOLETOM'
  | 'JAQUETA'
  | 'BLAZER'
  | 'CALCA'
  | 'SHORT'
  | 'SAIA'
  | 'VESTIDO'
  | 'TENIS'
  | 'SAPATO';
export type Estilo =
  | 'CASUAL'
  | 'SOCIAL'
  | 'ESPORTIVO'
  | 'STREETWEAR'
  | 'ELEGANTE'
  | 'BASICO';
export type Estampa = 'LISO' | 'ESTAMPADO' | 'LISTRADO' | 'XADREZ' | 'LOGO';
export type Ocasiao =
  | 'DIA_A_DIA'
  | 'TRABALHO'
  | 'FESTA'
  | 'ACADEMIA'
  | 'PRAIA'
  | 'CASA';
export type Aquecimento = 'LEVE' | 'MEDIO' | 'QUENTE';
export type Material =
  | 'JEANS'
  | 'COURO'
  | 'MOLETOM'
  | 'MALHA'
  | 'POLIAMIDA'
  | 'TRICO'
  | 'SOFT'
  | 'LINHO'
  | 'ALFAIATARIA'
  | 'CETIM'
  | 'VISCOSE'
  | 'VELUDO';
export type Manga = 'SEM_MANGA' | 'CURTA' | 'LONGA';

/** Nome da categoria como aparece para a pessoa (e para o leitor de tela). */
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  CAMISETA: 'camiseta',
  CAMISA: 'camisa',
  BLUSA: 'blusa',
  CROPPED: 'cropped',
  TOP: 'top',
  BODY: 'body',
  MOLETOM: 'moletom',
  JAQUETA: 'jaqueta',
  BLAZER: 'blazer',
  CALCA: 'calça',
  SHORT: 'short',
  SAIA: 'saia',
  VESTIDO: 'vestido',
  TENIS: 'tênis',
  SAPATO: 'sapato',
};

export const MATERIAL_LABEL: Record<Material, string> = {
  JEANS: 'jeans',
  COURO: 'couro',
  MOLETOM: 'moletom',
  MALHA: 'malha',
  POLIAMIDA: 'poliamida',
  TRICO: 'tricô',
  SOFT: 'soft',
  LINHO: 'linho',
  ALFAIATARIA: 'alfaiataria',
  CETIM: 'cetim',
  VISCOSE: 'viscose',
  VELUDO: 'veludo',
};

// Mesma regra do back (src/looks/nome-da-peca.ts): nas peças de baixo o
// tecido entra no nome ("calça jeans", "calça de moletom"); nas outras, só
// jeans e couro. Manga curta é o comum e não aparece; o top nunca tem manga.
const MATERIAL_SEMPRE_NO_NOME: Categoria[] = ['CALCA', 'SHORT', 'SAIA'];
const MATERIAL_SEMPRE_NA_PECA: Material[] = ['JEANS', 'COURO'];
// Jaqueta de tecido macio é casaco ("casaco de moletom"); jeans e couro
// continuam jaqueta.
const MATERIAIS_DE_CASACO: Material[] = [
  'MOLETOM',
  'TRICO',
  'SOFT',
  'MALHA',
  'VELUDO',
];
const COM_MANGA_NO_NOME: Categoria[] = [
  'CAMISETA',
  'CAMISA',
  'BLUSA',
  'CROPPED',
  'BODY',
  'VESTIDO',
];

function comMaterial(nome: string, material: Material) {
  return material === 'JEANS'
    ? `${nome} jeans`
    : `${nome} de ${MATERIAL_LABEL[material]}`;
}

/**
 * Nome da peça como a pessoa diria: "calça jeans", "calça de moletom",
 * "camiseta manga longa", "regata", "body manga longa", "casaco de moletom".
 */
export function nomeDaPeca(
  peca: Pick<Peca, 'categoria'> & Partial<Pick<Peca, 'material' | 'manga'>>,
) {
  const { categoria, material, manga } = peca;

  if (categoria === 'CAMISETA' && manga === 'SEM_MANGA') {
    return material && MATERIAL_SEMPRE_NA_PECA.includes(material)
      ? comMaterial('regata', material)
      : 'regata';
  }

  if (
    categoria === 'JAQUETA' &&
    material &&
    MATERIAIS_DE_CASACO.includes(material)
  ) {
    return comMaterial('casaco', material);
  }

  let nome = CATEGORIA_LABEL[categoria];

  const materialNoNome =
    material &&
    // "Moletom de moletom" não diz nada.
    !(categoria === 'MOLETOM' && material === 'MOLETOM') &&
    (MATERIAL_SEMPRE_NO_NOME.includes(categoria) ||
      MATERIAL_SEMPRE_NA_PECA.includes(material));
  if (materialNoNome) nome = comMaterial(nome, material);

  if (COM_MANGA_NO_NOME.includes(categoria)) {
    if (manga === 'LONGA') nome += ' manga longa';
    if (manga === 'SEM_MANGA') nome += ' sem manga';
  }

  return nome;
}

/** Peça do closet como o back devolve (model `Peca` do Prisma). */
export type Peca = {
  id: string;
  usuarioId: string;
  /** URL assinada, válida por cerca de uma hora. */
  imagemUrl: string;
  categoria: Categoria;
  estilo: Estilo | null;
  estampa: Estampa | null;
  ocasioes: Ocasiao[];
  aquecimento: Aquecimento | null;
  material: Material | null;
  /** Só nas peças de cima, no body e no vestido. */
  manga: Manga | null;
  corNome: string;
  hex: string;
  colorAddSymbol: string;
  /** Segunda cor de peças estampadas ou com detalhe grande, vista na análise. */
  corSecundariaNome: string | null;
  hexSecundario: string | null;
  colorAddSymbolSecundario: string | null;
  criadoEm: string;
  atualizadoEm: string;
  /** Looks salvos que usam a peça; saem junto se ela for excluída. */
  totalLooks?: number;
};

export type CadastrarPecaInput = {
  photoUri: string;
  /** Tipo da imagem da galeria; sem ele, JPEG (o que a câmera grava). */
  photoTipo?: TipoDeImagem;
  /** Sem a cor completa, o back lê a cor da foto sozinho. */
  corNome?: string | null;
  hex?: string | null;
  colorAddSymbol?: string | null;
};

export type AtualizarPecaInput = Partial<
  Pick<
    Peca,
    | 'categoria'
    | 'manga'
    | 'estilo'
    | 'estampa'
    | 'ocasioes'
    | 'aquecimento'
    | 'material'
    | 'corNome'
    | 'hex'
    | 'colorAddSymbol'
    | 'corSecundariaNome'
    | 'hexSecundario'
    | 'colorAddSymbolSecundario'
  >
>;

/**
 * Cadastra a peça. O back guarda a foto no S3, analisa a peça (a única etapa
 * paga) e grava no banco — nessa ordem, e só segue se a anterior der certo.
 * Se a análise ou o banco falharem, a foto é apagada do S3.
 */
export function cadastrarPeca(input: CadastrarPecaInput, token: string) {
  const formData = new FormData();

  formData.append(
    'foto',
    photoFormDataPart(input.photoUri, 'roupa', input.photoTipo),
  );

  // Campo vazio não vai: o back valida o hex e recusaria string vazia.
  if (input.corNome) formData.append('corNome', input.corNome);
  if (input.hex) formData.append('hex', input.hex);
  if (input.colorAddSymbol) {
    formData.append('colorAddSymbol', input.colorAddSymbol);
  }

  return apiRequest<Peca>('/pecas', {
    method: 'POST',
    body: formData,
    token,
    // O back espera até 45s pela análise da visão, mais o envio ao S3.
    timeoutMs: 60_000,
  });
}

export function listarPecas(token: string) {
  return apiRequest<Peca[]>('/pecas', { token });
}

export function atualizarPeca(
  id: string,
  dados: AtualizarPecaInput,
  token: string,
) {
  return apiRequest<Peca>(`/pecas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
    token,
  });
}

/** Exclui a peça, a foto no S3 e os looks salvos que a usam. */
export function removerPeca(id: string, token: string) {
  return apiRequest<{ message: string; looksRemovidos?: number }>(
    `/pecas/${id}`,
    {
      method: 'DELETE',
      token,
    },
  );
}
