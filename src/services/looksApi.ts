import { apiRequest } from './api';
import { Peca } from './pecasApi';

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
  | { tipo: 'PERGUNTA' | 'FORA_DE_ESCOPO'; mensagem: string }
  | { tipo: 'SEM_LOOK'; mensagem: string; avisos: string[] }
  | {
      tipo: 'LOOK';
      mensagem: string;
      avisos: string[];
      pecas: PecaDoLook[];
    };

export type SugerirLookInput = {
  mensagem: string;
  /** Últimas mensagens, para o back entender respostas curtas ("trabalho"). */
  historico?: MensagemHistorico[];
  /** Peças do look anterior, para "quero outro" trazer algo diferente. */
  pecasAnteriores?: string[];
  /** Peças dos últimos looks da conversa, para o back variar as sugestões. */
  pecasRecentes?: string[];
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
