import { Image, ImageSourcePropType } from 'react-native';

type ColorAddSymbolData = {
  label: string;
  image: ImageSourcePropType;
};

// Cópias de 144 px dos símbolos de assets/coloradd/preto (3x o maior tamanho
// em que aparecem, 46 px na câmera). Os originais têm 568 a 1024 px e
// demoravam para aparecer em toda tela com símbolo.
const amareloClaro = require('../../assets/coloradd/app/simbolos/amarelo claro.png');
const amareloEscuro = require('../../assets/coloradd/app/simbolos/amarelo escuro.png');
const amarelo = require('../../assets/coloradd/app/simbolos/amarelo.png');

const azulClaro = require('../../assets/coloradd/app/simbolos/azul claro.png');
const azulEscuro = require('../../assets/coloradd/app/simbolos/azul escuro.png');
const azul = require('../../assets/coloradd/app/simbolos/azul.png');

const branco = require('../../assets/coloradd/app/simbolos/branco.png');

const castanhoClaro = require('../../assets/coloradd/app/simbolos/castanho claro.png');
const castanhoEscuro = require('../../assets/coloradd/app/simbolos/castanho escuro.png');
const castanho = require('../../assets/coloradd/app/simbolos/castanho.png');

const cinzaClaro = require('../../assets/coloradd/app/simbolos/cinza claro.png');
const cinzaEscuro = require('../../assets/coloradd/app/simbolos/cinza escuro.png');
const cinza = require('../../assets/coloradd/app/simbolos/cinza.png');

const dourado = require('../../assets/coloradd/app/simbolos/dourado.png');

const laranjaClaro = require('../../assets/coloradd/app/simbolos/laranja claro.png');
const laranjaEscuro = require('../../assets/coloradd/app/simbolos/laranja escuro.png');
const laranja = require('../../assets/coloradd/app/simbolos/laranja.png');

const prateado = require('../../assets/coloradd/app/simbolos/prateado.png');
const preto = require('../../assets/coloradd/app/simbolos/preto.png');

const rosaClaro = require('../../assets/coloradd/app/simbolos/rosa claro.png');
const rosaEscuro = require('../../assets/coloradd/app/simbolos/rosa escuro.png');
const rosa = require('../../assets/coloradd/app/simbolos/rosa.png');

const roxoClaro = require('../../assets/coloradd/app/simbolos/roxo claro.png');
const roxoEscuro = require('../../assets/coloradd/app/simbolos/roxo escuro.png');
const roxo = require('../../assets/coloradd/app/simbolos/roxo.png');

const verdeClaro = require('../../assets/coloradd/app/simbolos/verde claro.png');
const verdeEscuro = require('../../assets/coloradd/app/simbolos/verde escuro.png');
const verde = require('../../assets/coloradd/app/simbolos/verde.png');

const vermelhoClaro = require('../../assets/coloradd/app/simbolos/vermelho claro.png');
const vermelhoEscuro = require('../../assets/coloradd/app/simbolos/vermelho escuro.png');
const vermelho = require('../../assets/coloradd/app/simbolos/vermelho.png');

const symbolMap: Record<string, ColorAddSymbolData> = {
  AMARELO_CLARO: {
    label: 'amarelo claro',
    image: amareloClaro,
  },
  AMARELO_ESCURO: {
    label: 'amarelo escuro',
    image: amareloEscuro,
  },
  AMARELO: {
    label: 'amarelo',
    image: amarelo,
  },

  AZUL_CLARO: {
    label: 'azul claro',
    image: azulClaro,
  },
  AZUL_ESCURO: {
    label: 'azul escuro',
    image: azulEscuro,
  },
  AZUL: {
    label: 'azul',
    image: azul,
  },

  BRANCO: {
    label: 'branco',
    image: branco,
  },

  CASTANHO_CLARO: {
    label: 'castanho claro',
    image: castanhoClaro,
  },
  CASTANHO_ESCURO: {
    label: 'castanho escuro',
    image: castanhoEscuro,
  },
  CASTANHO: {
    label: 'castanho',
    image: castanho,
  },

  CINZA_CLARO: {
    label: 'cinza claro',
    image: cinzaClaro,
  },
  CINZA_ESCURO: {
    label: 'cinza escuro',
    image: cinzaEscuro,
  },
  CINZA: {
    label: 'cinza',
    image: cinza,
  },

  DOURADO: {
    label: 'dourado',
    image: dourado,
  },

  LARANJA_CLARO: {
    label: 'laranja claro',
    image: laranjaClaro,
  },
  LARANJA_ESCURO: {
    label: 'laranja escuro',
    image: laranjaEscuro,
  },
  LARANJA: {
    label: 'laranja',
    image: laranja,
  },

  PRATEADO: {
    label: 'prateado',
    image: prateado,
  },

  PRETO: {
    label: 'preto',
    image: preto,
  },

  ROSA_CLARO: {
    label: 'rosa claro',
    image: rosaClaro,
  },
  ROSA_ESCURO: {
    label: 'rosa escuro',
    image: rosaEscuro,
  },
  ROSA: {
    label: 'rosa',
    image: rosa,
  },

  ROXO_CLARO: {
    label: 'roxo claro',
    image: roxoClaro,
  },
  ROXO_ESCURO: {
    label: 'roxo escuro',
    image: roxoEscuro,
  },
  ROXO: {
    label: 'roxo',
    image: roxo,
  },

  VERDE_CLARO: {
    label: 'verde claro',
    image: verdeClaro,
  },
  VERDE_ESCURO: {
    label: 'verde escuro',
    image: verdeEscuro,
  },
  VERDE: {
    label: 'verde',
    image: verde,
  },

  VERMELHO_CLARO: {
    label: 'vermelho claro',
    image: vermelhoClaro,
  },
  VERMELHO_ESCURO: {
    label: 'vermelho escuro',
    image: vermelhoEscuro,
  },
  VERMELHO: {
    label: 'vermelho',
    image: vermelho,
  },
};

function normalizeSymbolName(symbolName?: string | null) {
  if (!symbolName) {
    return '';
  }

  return symbolName
    .trim()
    .replace(/^COLORADD_/i, '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .toUpperCase();
}

export function getColorAddSymbol(symbolName?: string | null) {
  const normalized = normalizeSymbolName(symbolName);

  return symbolMap[normalized] ?? null;
}

/** Logo e ilustração da tela do ColorADD, também reduzidos (assets/coloradd/app). */
export const logoColorAddVertical = require('../../assets/coloradd/app/logo_vertical_branco.png');
export const sinteseColorAdd = require('../../assets/coloradd/app/sintese_branco.png');

/**
 * Baixa e guarda em cache todas as imagens do ColorADD enquanto a splash está
 * na tela. No Expo Go cada imagem vem do Metro pela rede na primeira vez que
 * aparece, e era isso que fazia os símbolos surgirem atrasados. Num build
 * instalado elas já estão no app; o prefetch é inofensivo.
 */
export function preCarregarImagensColorAdd() {
  const fontes = [
    ...Object.values(symbolMap).map((symbol) => symbol.image),
    logoColorAddVertical,
    sinteseColorAdd,
  ];

  for (const fonte of fontes) {
    const uri = Image.resolveAssetSource(fonte)?.uri;

    if (uri?.startsWith('http')) {
      Image.prefetch(uri).catch(() => {
        // Sem cache, a imagem só carrega quando aparecer: nada a fazer.
      });
    }
  }
}
