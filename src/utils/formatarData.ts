const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Data por extenso ("6 de outubro de 2026"), no fuso do celular.
 *
 * Montada à mão em vez de `toLocaleDateString`: o resultado não depende do
 * suporte a Intl do motor JavaScript nem do idioma configurado no aparelho.
 */
export function formatarDataPorExtenso(iso: string) {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) {
    return '';
  }

  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}
