import { photoFormDataPart } from '../utils/photoUpload';
import { apiRequest } from './api';

// Códigos da taxonomia de peças: os mesmos dos enums do Prisma no back e do
// taxonomy.py da visão.
export type Categoria =
  | 'CAMISETA'
  | 'CAMISA'
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
export type Material = 'JEANS' | 'COURO';

/** Nome da categoria como aparece para a pessoa (e para o leitor de tela). */
export const CATEGORIA_LABEL: Record<Categoria, string> = {
  CAMISETA: 'camiseta',
  CAMISA: 'camisa',
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
  corNome: string;
  hex: string;
  colorAddSymbol: string;
  /** Segunda cor de peças listradas ou estampadas; a visão ainda não preenche. */
  corSecundariaNome: string | null;
  hexSecundario: string | null;
  colorAddSymbolSecundario: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type CadastrarPecaInput = {
  photoUri: string;
  /** Sem a cor completa, o back lê a cor da foto sozinho. */
  corNome?: string | null;
  hex?: string | null;
  colorAddSymbol?: string | null;
};

export type AtualizarPecaInput = Partial<
  Pick<
    Peca,
    | 'categoria'
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

  formData.append('foto', photoFormDataPart(input.photoUri, 'roupa.jpg'));

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

export function removerPeca(id: string, token: string) {
  return apiRequest<{ message: string }>(`/pecas/${id}`, {
    method: 'DELETE',
    token,
  });
}
