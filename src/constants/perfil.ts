// Opções do perfil, as mesmas no cadastro e em Informações pessoais. Os
// códigos espelham os enums `Genero` e `TipoDaltonismo` do Prisma no back.

/** Gêneros que o app oferece. O back também aceita OUTRO, mas o app não usa. */
export type GeneroCadastro =
  | 'MASCULINO'
  | 'FEMININO'
  | 'NAO_BINARIO'
  | 'PREFIRO_NAO_DIZER';

export type TipoDaltonismoCadastro =
  | 'PROTANOMALIA'
  | 'PROTANOPIA'
  | 'DEUTERANOMALIA'
  | 'DEUTERANOPIA'
  | 'TRITANOMALIA'
  | 'TRITANOPIA'
  | 'ACROMATOPSIA'
  | 'NAO_SEI'
  | 'NAO_TENHO'
  | 'PREFIRO_NAO_DIZER';

/** Botões do cadastro; "Prefiro não dizer" é o link de pular embaixo. */
export const GENERO_OPCOES: { label: string; value: GeneroCadastro }[] = [
  { label: 'Masculino', value: 'MASCULINO' },
  { label: 'Feminino', value: 'FEMININO' },
  { label: 'Não binário', value: 'NAO_BINARIO' },
];

export const GENERO_PREFIRO_NAO_DIZER = 'Prefiro não dizer';

/**
 * Lista do cadastro e de Informações pessoais. "Prefiro não dizer" fica fora:
 * no cadastro é o link de pular; em Informações pessoais, a última opção.
 */
export const DALTONISMO_OPCOES: {
  label: string;
  value: TipoDaltonismoCadastro;
}[] = [
  { label: 'Protanomalia', value: 'PROTANOMALIA' },
  { label: 'Protanopia', value: 'PROTANOPIA' },
  { label: 'Deuteranomalia', value: 'DEUTERANOMALIA' },
  { label: 'Deuteranopia', value: 'DEUTERANOPIA' },
  { label: 'Tritanomalia', value: 'TRITANOMALIA' },
  { label: 'Tritanopia', value: 'TRITANOPIA' },
  { label: 'Acromatopsia', value: 'ACROMATOPSIA' },
  { label: 'Não sei', value: 'NAO_SEI' },
  { label: 'Não tenho', value: 'NAO_TENHO' },
];

export const DALTONISMO_PREFIRO_NAO_DIZER = 'Prefiro não dizer';

/**
 * Qualquer resposta, menos "Prefiro não dizer", é dado de saúde (inclusive
 * "Não tenho"): dado pessoal sensível na LGPD (art. 5º, II), que só pode ser
 * guardado com consentimento específico e destacado (art. 11, I). O back
 * recusa o tipo sem `consentimentoDadosSaude: true` na primeira vez.
 */
export function exigeConsentimentoSaude(tipo: string | null | undefined) {
  return Boolean(tipo) && tipo !== 'PREFIRO_NAO_DIZER';
}

/** Escala do cadastro: 0 = nenhuma dificuldade, 5 = muita dificuldade. */
export const DIFICULDADE_NIVEIS = [0, 1, 2, 3, 4, 5];
export const DIFICULDADE_MIN_LABEL = 'Nenhuma dificuldade';
export const DIFICULDADE_MAX_LABEL = 'Muita dificuldade';

/** Pular a pergunta de dificuldade no cadastro deixa o nível vazio (null). */
export const DIFICULDADE_PREFIRO_NAO_DIZER = 'Prefiro não dizer';

/**
 * Nome de qualquer código que possa estar salvo, inclusive os que o app não
 * oferece mais (OUTRO; PREFIRO_NAO_DIZER no daltonismo, que só existia em
 * Informações pessoais), para nunca mostrar um valor salvo como vazio.
 */
const GENERO_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  NAO_BINARIO: 'Não binário',
  PREFIRO_NAO_DIZER: GENERO_PREFIRO_NAO_DIZER,
  OUTRO: 'Outro',
};

const DALTONISMO_LABEL: Record<string, string> = {
  ...Object.fromEntries(
    DALTONISMO_OPCOES.map((opcao) => [opcao.value, opcao.label]),
  ),
  PREFIRO_NAO_DIZER: DALTONISMO_PREFIRO_NAO_DIZER,
};

export function generoLabel(genero: string | null | undefined) {
  return genero ? (GENERO_LABEL[genero] ?? genero) : null;
}

export function daltonismoLabel(tipo: string | null | undefined) {
  return tipo ? (DALTONISMO_LABEL[tipo] ?? tipo) : null;
}
