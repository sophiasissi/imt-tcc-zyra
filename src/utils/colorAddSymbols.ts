import { ImageSourcePropType } from 'react-native';

type ColorAddSymbolData = {
  label: string;
  image: ImageSourcePropType;
};

const amareloClaro = require('../../assets/coloradd/preto/amarelo claro.png');
const amareloEscuro = require('../../assets/coloradd/preto/amarelo escuro.png');
const amarelo = require('../../assets/coloradd/preto/amarelo.png');

const azulClaro = require('../../assets/coloradd/preto/azul claro.png');
const azulEscuro = require('../../assets/coloradd/preto/azul escuro.png');
const azul = require('../../assets/coloradd/preto/azul.png');

const branco = require('../../assets/coloradd/preto/branco.png');

const castanhoClaro = require('../../assets/coloradd/preto/castanho claro.png');
const castanhoEscuro = require('../../assets/coloradd/preto/castanho escuro.png');
const castanho = require('../../assets/coloradd/preto/castanho.png');

const cinzaClaro = require('../../assets/coloradd/preto/cinza claro.png');
const cinzaEscuro = require('../../assets/coloradd/preto/cinza escuro.png');
const cinza = require('../../assets/coloradd/preto/cinza.png');

const dourado = require('../../assets/coloradd/preto/dourado.png');

const laranjaClaro = require('../../assets/coloradd/preto/laranja claro.png');
const laranjaEscuro = require('../../assets/coloradd/preto/laranja escuro.png');
const laranja = require('../../assets/coloradd/preto/laranja.png');

const prateado = require('../../assets/coloradd/preto/prateado.png');
const preto = require('../../assets/coloradd/preto/preto.png');

const rosaClaro = require('../../assets/coloradd/preto/rosa claro.png');
const rosaEscuro = require('../../assets/coloradd/preto/rosa escuro.png');
const rosa = require('../../assets/coloradd/preto/rosa.png');

const roxoClaro = require('../../assets/coloradd/preto/roxo claro.png');
const roxoEscuro = require('../../assets/coloradd/preto/roxo escuro.png');
const roxo = require('../../assets/coloradd/preto/roxo.png');

const verdeClaro = require('../../assets/coloradd/preto/verde claro.png');
const verdeEscuro = require('../../assets/coloradd/preto/verde escuro.png');
const verde = require('../../assets/coloradd/preto/verde.png');

const vermelhoClaro = require('../../assets/coloradd/preto/vermelho claro.png');
const vermelhoEscuro = require('../../assets/coloradd/preto/vermelho escuro.png');
const vermelho = require('../../assets/coloradd/preto/vermelho.png');

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