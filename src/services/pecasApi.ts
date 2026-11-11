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
  | 'CORSET'
  | 'MOLETOM'
  | 'SUETER'
  | 'JAQUETA'
  | 'BLAZER'
  | 'COLETE'
  | 'CALCA'
  | 'SHORT'
  | 'SAIA'
  | 'VESTIDO'
  | 'TENIS'
  | 'SAPATO'
  | 'BOTA'
  | 'SANDALIA'
  | 'CHINELO';
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
/** Altura do cano, só na bota. */
export type Cano = 'CURTO' | 'MEDIO' | 'LONGO' | 'ACIMA_DO_JOELHO';

/** Nome da categoria como aparece para a pessoa (e para o leitor de tela). */
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  CAMISETA: 'camiseta',
  CAMISA: 'camisa',
  BLUSA: 'blusa',
  CROPPED: 'cropped',
  TOP: 'top',
  BODY: 'body',
  CORSET: 'corset',
  MOLETOM: 'moletom',
  SUETER: 'suéter',
  JAQUETA: 'jaqueta',
  BLAZER: 'blazer',
  COLETE: 'colete',
  CALCA: 'calça',
  SHORT: 'short',
  SAIA: 'saia',
  VESTIDO: 'vestido',
  TENIS: 'tênis',
  SAPATO: 'sapato',
  BOTA: 'bota',
  SANDALIA: 'sandália',
  CHINELO: 'chinelo',
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

// Mesma regra do back: é o cano que diferencia uma bota da outra.
export const CANO_LABEL: Record<Cano, string> = {
  CURTO: 'cano curto',
  MEDIO: 'cano médio',
  LONGO: 'cano longo',
  ACIMA_DO_JOELHO: 'over the knee',
};

// Mesma regra do back: o corte de alfaiataria entra no nome no lugar da
// fibra ("calça de alfaiataria", e não "calça de viscose de alfaiataria").
const ALFAIATARIA_NO_NOME: Categoria[] = [
  'CALCA',
  'SHORT',
  'SAIA',
  'VESTIDO',
  'COLETE',
];

function comMaterial(nome: string, material: Material) {
  return material === 'JEANS'
    ? `${nome} jeans`
    : `${nome} de ${MATERIAL_LABEL[material]}`;
}

/**
 * Nome da peça como a pessoa diria: "calça jeans", "calça de moletom",
 * "camiseta manga longa", "regata", "body manga longa", "casaco de moletom",
 * "calça de alfaiataria", "camisa polo".
 */
export function nomeDaPeca(
  peca: Pick<Peca, 'categoria'> &
    Partial<
      Pick<Peca, 'material' | 'manga' | 'cano' | 'alfaiataria' | 'colarinho'>
    >,
) {
  const { categoria, manga, cano } = peca;
  // Com o campo novo, ele manda; sem ele (peça antiga), vale o tecido.
  const alfaiataria =
    typeof peca.alfaiataria === 'boolean'
      ? peca.alfaiataria
      : peca.material === 'ALFAIATARIA';
  // Couro e jeans identificam a peça mais que o corte ("calça de couro").
  const fibraMarcante =
    peca.material != null && MATERIAL_SEMPRE_NA_PECA.includes(peca.material);
  const material =
    alfaiataria && ALFAIATARIA_NO_NOME.includes(categoria) && !fibraMarcante
      ? 'ALFAIATARIA'
      : peca.material === 'ALFAIATARIA'
        ? null
        : peca.material;

  // Camiseta com colarinho é a polo.
  if (categoria === 'CAMISETA' && peca.colarinho === true) {
    return manga === 'LONGA' ? 'camisa polo manga longa' : 'camisa polo';
  }

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
  if (categoria === 'BOTA' && cano) nome += ` ${CANO_LABEL[cano]}`;

  const materialNoNome =
    material &&
    // "Moletom de moletom" não diz nada.
    !(categoria === 'MOLETOM' && material === 'MOLETOM') &&
    (MATERIAL_SEMPRE_NO_NOME.includes(categoria) ||
      MATERIAL_SEMPRE_NA_PECA.includes(material) ||
      (material === 'ALFAIATARIA' && ALFAIATARIA_NO_NOME.includes(categoria)));
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
  /** Miniatura (~30 KB) para os cards; a foto inteira nas peças antigas. */
  imagemMiniUrl: string;
  categoria: Categoria;
  estilo: Estilo | null;
  estampa: Estampa | null;
  ocasioes: Ocasiao[];
  aquecimento: Aquecimento | null;
  material: Material | null;
  /** Só nas peças de cima, no body e no vestido. */
  manga: Manga | null;
  /** Só na bota. */
  cano: Cano | null;
  /** Corte de alfaiataria, de qualquer fibra. Nulo nas peças antigas. */
  alfaiataria?: boolean | null;
  /** Gola de camisa (camisa, polo). Nulo nas peças antigas. */
  colarinho?: boolean | null;
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
    | 'cano'
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
