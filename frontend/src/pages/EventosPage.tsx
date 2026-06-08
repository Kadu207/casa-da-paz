import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MediaUploadPanel } from '../components/MediaUploadPanel';
import { useI18n } from '../i18n/I18nContext';
import { formatMoney, labelEnum } from '../i18n/helpers';

interface Pessoa {
  id: number;
  nomeCompleto: string;
}

interface Inscricao {
  id: number;
  valor: string;
  statusPagamento: string;
  adimplencia: string;
  vencimento: string | null;
  pessoa: Pessoa;
}

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  status: string;
  capacidadeMax: number | null;
  _count: { presencas: number; inscricoes: number };
  inscricoes?: Inscricao[];
}

export default function EventosPage() {
  const { t, locale, dateLocale } = useI18n();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [form, setForm] = useState({ pessoaId: '', valor: '', vencimento: '' });
  const [erro, setErro] = useState('');

  const evento = eventos.find((e) => e.id === eventoId);

  const carregar = useCallback(async () => {
    const data = await api<Evento[]>('/eventos?status=ABERTO');
    setEventos(data);
    if (data.length && !eventoId) setEventoId(data[0].id);
    if (eventoId) {
      const det = await api<Evento>(`/eventos/${eventoId}`);
      setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, ...det } : e)));
    }
  }, [eventoId]);

  useEffect(() => {
    carregar().catch(console.error);
    api<Pessoa[]>('/pessoas').then(setPessoas).catch(console.error);
  }, [carregar]);

  const inscrever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/inscricoes`, {
        method: 'POST',
        body: JSON.stringify({
          pessoaId: Number(form.pessoaId),
          valor: Number(form.valor),
          vencimento: form.vencimento,
        }),
      });
      setForm({ pessoaId: '', valor: '', vencimento: '' });
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.registerError'));
    }
  };

  const confirmarPagamento = async (inscricaoId: number) => {
    if (!eventoId) return;
    await api(`/eventos/${eventoId}/inscricoes/${inscricaoId}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONCLUIDO' }),
    });
    await carregar();
  };

  const vagasRestantes =
    evento?.capacidadeMax != null
      ? Math.max(0, evento.capacidadeMax - evento._count.inscricoes)
      : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.eventos.title')}</h2>
      <MediaUploadPanel />

      <select
        value={eventoId ?? ''}
        onChange={(e) => setEventoId(Number(e.target.value))}
        className="w-full max-w-md px-3 py-2 rounded bg-black/30 border border-white/20"
      >
        {eventos.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.nomeEvento} — {t('erp.eventos.registeredCount', { count: ev._count.inscricoes })}
            {ev.capacidadeMax ? ` / ${ev.capacidadeMax}` : ''}
          </option>
        ))}
      </select>

      {evento && (
        <p className="text-sm text-white/70">
          {vagasRestantes != null
            ? t('erp.eventos.spotsLeft', { count: vagasRestantes })
            : t('erp.eventos.noCapacityLimit')}
        </p>
      )}

      <form onSubmit={inscrever} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
        <h3 className="font-medium text-[var(--color-accent)]">{t('erp.eventos.newRegistration')}</h3>
        {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
        <select
          value={form.pessoaId}
          onChange={(e) => setForm({ ...form, pessoaId: e.target.value })}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        >
          <option value="">{t('erp.common.person')}</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nomeCompleto}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={form.valor}
          onChange={(e) => setForm({ ...form, valor: e.target.value })}
          placeholder={t('erp.common.value')}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <input
          type="date"
          value={form.vencimento}
          onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          required
        />
        <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
          {t('erp.eventos.register')}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/20">
              <th className="p-2">{t('erp.common.person')}</th>
              <th className="p-2">{t('erp.common.value')}</th>
              <th className="p-2">{t('erp.common.dueDate')}</th>
              <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
              <th className="p-2">{t('erp.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(evento?.inscricoes ?? []).map((i) => (
              <tr key={i.id} className="border-b border-white/10">
                <td className="p-2">{i.pessoa.nomeCompleto}</td>
                <td className="p-2">{formatMoney(locale, Number(i.valor))}</td>
                <td className="p-2">
                  {i.vencimento
                    ? new Date(i.vencimento).toLocaleDateString(dateLocale)
                    : t('erp.common.emptyDash')}
                </td>
                <td className="p-2">{labelEnum(t, 'adimplencia', i.adimplencia)}</td>
                <td className="p-2">
                  {i.statusPagamento === 'PENDENTE' && (
                    <button
                      onClick={() => confirmarPagamento(i.id)}
                      className="text-[var(--color-accent)] hover:underline text-xs"
                    >
                      {t('erp.eventos.confirmPayment')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {(evento?.inscricoes?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-white/50">
                  {t('erp.eventos.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
