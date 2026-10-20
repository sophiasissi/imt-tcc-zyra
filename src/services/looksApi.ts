import { apiRequest } from './api';
import { Localizacao } from './localizacao';
import { Ocasiao, Peca } from './pecasApi';

/** Lugar da peça no look: o app usa para ordenar e descrever. */
export type PapelNoLook =
  | 'SUPERIOR'
  | 'SOBREPOSICAO'
  | 'INFERIOR'
  | 'PECA_UNICA'
  | 'CALCADO';

export type PecaDoLook = Peca & { papel: PapelNoLook };

export type MensagemHistorico = {
  autor: 'usuario' | 'zyra';
  texto: string;
};

/**
 * Resposta do POST /looks/sugerir. O texto já vem pronto do back (montado por
 * código, sem IA); o app só mostra.
 */
export type RespostaLook =
  | {
      tipo: 'POUCAS_PECAS';
      mensagem: string;
      faltamSuperiores: number;
      faltamInferiores: number;
    }
  | { tipo: 'PERGUNTA' | 'FORA_DE_ESCOPO' | 'CONVERSA'; mensagem: string }
  /** O usuário respondeu "sim" para "Quer salvar esse look?". */
  | { tipo: 'SALVO'; mensagem: string; lookId: string }
  | { tipo: 'SEM_LOOK'; mensagem: string; avisos: string[] }
  | {
      tipo: 'LOOK';
      mensagem: string;
      /** De onde veio o clima ("Considerei a previsão para amanhã..."). */
      clima: string | null;
      avisos: string[];
      /** Pergunta para o fim da mensagem: ocasião, clima ou salvar. */
      pergunta: string;
      pecas: PecaDoLook[];
      /** Ocasião entendida no pedido; vai junto quando o look é salvo. */
      ocasiao?: Ocasiao | null;
    };

export type SugerirLookInput = {
  mensagem: string;
  /** Últimas mensagens, para o back entender respostas curtas ("trabalho"). */
  historico?: MensagemHistorico[];
  /** Peças do look anterior, para "quero outro" trazer algo diferente. */
  pecasAnteriores?: string[];
  /** Peças dos últimos looks da conversa, para o back variar as sugestões. */
  pecasRecentes?: string[];
  /** Para a previsão do tempo. Só vai se a pessoa permitir. */
  localizacao?: Localizacao;
  /**
   * Nome e ocasião do look na tela. Se a mensagem pedir para salvar ("sim"),
   * o back salva com eles, igual ao popup de saída.
   */
  lookMostrado?: { pedido?: string; ocasiao?: Ocasiao };
};

export function sugerirLook(input: SugerirLookInput, token: string) {
  return apiRequest<RespostaLook>('/looks/sugerir', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
    // Inclui a interpretação do pedido pela OpenAI.
    timeoutMs: 30_000,
  });
}

/** Look da Galeria de Looks, como o GET /looks devolve. */
export type LookSalvo = {
  id: string;
  /** Título do evento pedido; looks antigos podem não ter. */
  nome: string | null;
  ocasiao: Ocasiao | null;
  criadoEm: string;
  /** Já na ordem do look: superior, sobreposição, inferior, peça única, calçado. */
  pecas: PecaDoLook[];
};

export type SalvarLookInput = {
  pecaIds: string[];
  /** O back aceita até 60 caracteres. */
  nome?: string;
  /** Sem nome, o back cria um título curto a partir do pedido (até 500 caracteres). */
  pedido?: string;
  ocasiao?: Ocasiao;
};

/**
 * Salva o look na Galeria de Looks. Salvar as mesmas peças de novo devolve o
 * look que já existe, sem criar cópia.
 */
export function salvarLook(input: SalvarLookInput, token: string) {
  return apiRequest<LookSalvo>('/looks', {
    method: 'POST',
    body: JSON.stringify(input),
    token,
  });
}

/** Looks salvos, do mais recente para o mais antigo. */
export function listarLooks(token: string) {
  return apiRequest<LookSalvo[]>('/looks', { token });
}

/** Tira o look da Galeria de Looks. As peças continuam no armário. */
export function removerLook(id: string, token: string) {
  return apiRequest<{ message: string }>(`/looks/${id}`, {
    method: 'DELETE',
    token,
  });
}
