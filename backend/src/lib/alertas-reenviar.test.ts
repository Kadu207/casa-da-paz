import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Alerta } from '@prisma/client';
import { reenviarAlerta } from './alertas-reenviar.js';

vi.mock('./n8n.js', () => ({
  dispararN8n: vi.fn(),
}));

import { dispararN8n } from './n8n.js';

const alertaBase: Alerta = {
  id: 1,
  tipo: 'MENSALIDADE_ATRASADA',
  mensagem: 'João — mensalidade vencida',
  pessoaId: 5,
  canal: 'WHATSAPP',
  disparado: false,
  createdAt: new Date('2026-06-01'),
};

describe('reenviarAlerta', () => {
  beforeEach(() => {
    vi.mocked(dispararN8n).mockReset();
  });

  it('dispara lembrete_atraso com payload completo', async () => {
    vi.mocked(dispararN8n).mockResolvedValue({ enviado: true });

    const result = await reenviarAlerta(alertaBase, { telefone: '31999990000' });

    expect(dispararN8n).toHaveBeenCalledWith('lembrete_atraso', {
      alertaId: 1,
      pessoaId: 5,
      telefone: '31999990000',
      mensagem: alertaBase.mensagem,
      tipo: 'MENSALIDADE_ATRASADA',
    });
    expect(result).toEqual({ enviado: true });
  });

  it('propaga falha do N8N', async () => {
    vi.mocked(dispararN8n).mockResolvedValue({ enviado: false, motivo: 'N8N indisponível' });

    const result = await reenviarAlerta(alertaBase, null);

    expect(result).toEqual({ enviado: false, motivo: 'N8N indisponível' });
  });
});
