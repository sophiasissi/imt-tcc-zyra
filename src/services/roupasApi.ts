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
  | 'SAPATO'
  | 'BOLSA';
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
  BOLSA: 'bolsa',
};

/** Peça do closet como o back devolve. */
export type Roupa = {
  id: string;
  usuarioId: string;
  nome: string | null;
  /** URL assinada, válida por cerca de uma hora. */
  imagemUrl: string;
  corNome: string | null;
  corHex: string | null;
  corColorAdd: string | null;
  categoria: Categoria | null;
  estilo: Estilo | null;
  estampa: Estampa | null;
  aquecimento: Aquecimento | null;
  material: Material | null;
  ocasioes: Ocasiao[];
  criadoEm: string;
  atualizadoEm: string;
};

export type CadastrarRoupaInput = {
  photoUri: string;
  corNome?: string | null;
  corHex?: string | null;
  corColorAdd?: string | null;
};

export type AtualizarRoupaInput = Partial<
  Pick<
    Roupa,
    | 'nome'
    | 'corNome'
    | 'corHex'
    | 'corColorAdd'
    | 'categoria'
    | 'estilo'
    | 'estampa'
    | 'aquecimento'
    | 'material'
    | 'ocasioes'
  >
>;

/**
 * Cadastra a peça. O back guarda a foto no S3, analisa a peça (a única etapa
 * paga) e grava no banco — nessa ordem, e só segue se a anterior der certo.
 * Se a análise ou o banco falharem, a foto é apagada do S3.
 */
export function cadastrarRoupa(input: CadastrarRoupaInput, token: string) {
  const formData = new FormData();

  formData.append('foto', photoFormDataPart(input.photoUri, 'roupa.jpg'));

  // Campo vazio não vai: o back valida o hex e recusaria string vazia.
  if (input.corNome) formData.append('corNome', input.corNome);
  if (input.corHex) formData.append('corHex', input.corHex);
  if (input.corColorAdd) formData.append('corColorAdd', input.corColorAdd);

  return apiRequest<Roupa>('/roupas', {
    method: 'POST',
    body: formData,
    token,
  });
}

export function listarRoupas(token: string) {
  return apiRequest<Roupa[]>('/roupas', { token });
}

export function atualizarRoupa(
  id: string,
  dados: AtualizarRoupaInput,
  token: string,
) {
  return apiRequest<Roupa>(`/roupas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
    token,
  });
}

export function removerRoupa(id: string, token: string) {
  return apiRequest<{ message: string }>(`/roupas/${id}`, {
    method: 'DELETE',
    token,
  });
}
