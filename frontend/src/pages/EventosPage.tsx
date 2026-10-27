import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { MediaUploadPanel } from '../components/MediaUploadPanel';
import { useAuth, hasPermission } from '../context/AuthContext';
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
  codigo: string | null;
  canceladaEm: string | null;
  ingressoLoteId: number | null;
  pessoa: Pessoa;
  ingressoLote?: { id: number; nome: string } | null;
}

interface IngressoLote {
  id: number;
  nome: string;
  quantidade: number;
  valor: string | number;
  ativo: boolean;
  ocupadas: number;
  vagasRestantes: number;
}

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  tipo?: 'GIRA' | 'OFICINA';
  status: string;
  capacidadeMax: number | null;
  _count: { presencas: number; inscricoes: number };
  inscricoes?: Inscricao[];
  ingressoLotes?: IngressoLote[];
}

const emptyForm = {
  nomeEvento: '',
  dataEvento: '',
  tipo: 'GIRA' as 'GIRA' | 'OFICINA',
  capacidadeMax: '',
};

function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventosPage() {
  const { t, locale, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'eventos', 'write');

  const [aba, setAba] = useState<'cadastro' | 'inscricoes' | 'lotes'>('cadastro');
  const [filtroStatus, setFiltroStatus] = useState<'ABERTO' | 'ENCERRADO' | ''>('ABERTO');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [formEvento, setFormEvento] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [formInscricao, setFormInscricao] = useState({
    pessoaId: '',
    valor: '',
    vencimento: '',
    ingressoLoteId: '',
  });
  const [formLote, setFormLote] = useState({ nome: '', quantidade: '', valor: '' });
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const evento = eventos.find((e) => e.id === eventoId);

  const carregarLista = useCallback(async () => {
    setErro('');
    const q = filtroStatus ? `?status=${filtroStatus}` : '';
    const data = await api<Evento[]>(`/eventos${q}`);
    setEventos(data);
    setEventoId((prev) => {
      if (prev && data.some((e) => e.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
  }, [filtroStatus]);

  const carregarDetalhe = useCallback(async (id: number) => {
    const det = await api<Evento>(`/eventos/${id}`);
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, ...det } : e)));
  }, []);

  useEffect(() => {
    carregarLista().catch((err) =>
      setErro(err instanceof Error ? err.message : t('erp.eventos.loadError'))
    );
  }, [carregarLista, t]);

  useEffect(() => {
    if (eventoId == null) return;
    carregarDetalhe(eventoId).catch(() => undefined);
  }, [eventoId, carregarDetalhe]);

  useEffect(() => {
    api<Pessoa[]>('/pessoas').then(setPessoas).catch(() => undefined);
  }, []);

  const resetForm = () => {
    setEditId(null);
    setFormEvento(emptyForm);
  };

  const editarEvento = (ev: Evento) => {
    setEditId(ev.id);
    setFormEvento({
      nomeEvento: ev.nomeEvento,
      dataEvento: toDateInput(ev.dataEvento),
      tipo: (ev.tipo ?? 'GIRA') as 'GIRA' | 'OFICINA',
      capacidadeMax: ev.capacidadeMax != null ? String(ev.capacidadeMax) : '',
    });
    setAba('cadastro');
    setMsg('');
    setErro('');
  };

  const salvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setErro('');
    setMsg('');
    const payload: {
      nomeEvento: string;
      dataEvento: string;
      tipo: 'GIRA' | 'OFICINA';
      capacidadeMax?: number | null;
    } = {
      nomeEvento: formEvento.nomeEvento,
      dataEvento: formEvento.dataEvento,
      tipo: formEvento.tipo,
    };
    if (formEvento.capacidadeMax) {
      payload.capacidadeMax = Number(formEvento.capacidadeMax);
    } else if (editId != null) {
      payload.capacidadeMax = null;
    }
    try {
      if (editId != null) {
        await api(`/eventos/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMsg(t('erp.eventos.updated'));
      } else {
        await api('/eventos', { method: 'POST', body: JSON.stringify(payload) });
        setMsg(t('erp.eventos.created'));
      }
      resetForm();
      await carregarLista();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.saveError'));
    }
  };

  const alterarStatus = async (ev: Evento, status: 'ABERTO' | 'ENCERRADO') => {
    if (!canWrite) return;
    setErro('');
    try {
      await api(`/eventos/${ev.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setMsg(status === 'ENCERRADO' ? t('erp.eventos.closed') : t('erp.eventos.reopened'));
      await carregarLista();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.saveError'));
    }
  };

  const excluirEvento = async (ev: Evento) => {
    if (!canWrite) return;
    if (!window.confirm(t('erp.eventos.confirmDelete', { name: ev.nomeEvento }))) return;
    setErro('');
    try {
      await api(`/eventos/${ev.id}`, { method: 'DELETE' });
      setMsg(t('erp.eventos.deleted'));
      if (eventoId === ev.id) setEventoId(null);
      await carregarLista();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.deleteError'));
    }
  };

  const inscrever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId || !canWrite) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/inscricoes`, {
        method: 'POST',
        body: JSON.stringify({
          pessoaId: Number(formInscricao.pessoaId),
          valor: formInscricao.valor ? Number(formInscricao.valor) : undefined,
          vencimento: formInscricao.vencimento,
          ingressoLoteId: formInscricao.ingressoLoteId
            ? Number(formInscricao.ingressoLoteId)
            : undefined,
        }),
      });
      setFormInscricao({ pessoaId: '', valor: '', vencimento: '', ingressoLoteId: '' });
      await carregarDetalhe(eventoId);
      await carregarLista();
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
    await carregarDetalhe(eventoId);
  };

  const cancelarInscricao = async (inscricaoId: number) => {
    if (!eventoId || !canWrite) return;
    if (!window.confirm(t('erp.eventos.cancelConfirm'))) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/inscricoes/${inscricaoId}/cancelar`, { method: 'POST' });
      await carregarDetalhe(eventoId);
      await carregarLista();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.registerError'));
    }
  };

  const criarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventoId || !canWrite) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/lotes`, {
        method: 'POST',
        body: JSON.stringify({
          nome: formLote.nome,
          quantidade: Number(formLote.quantidade),
          valor: Number(formLote.valor),
        }),
      });
      setFormLote({ nome: '', quantidade: '', valor: '' });
      await carregarDetalhe(eventoId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.loteError'));
    }
  };

  const toggleLoteAtivo = async (lote: IngressoLote) => {
    if (!eventoId || !canWrite) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/lotes/${lote.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: !lote.ativo }),
      });
      await carregarDetalhe(eventoId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.loteError'));
    }
  };

  const excluirLote = async (lote: IngressoLote) => {
    if (!eventoId || !canWrite) return;
    if (!window.confirm(t('erp.eventos.loteDelete'))) return;
    setErro('');
    try {
      await api(`/eventos/${eventoId}/lotes/${lote.id}`, { method: 'DELETE' });
      await carregarDetalhe(eventoId);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.eventos.loteError'));
    }
  };

  const vagasRestantes =
    evento?.capacidadeMax != null
      ? Math.max(0, evento.capacidadeMax - evento._count.inscricoes)
      : null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.eventos.title')}</h2>
      <MediaUploadPanel />

      <div className="flex flex-wrap gap-2">
        {(['cadastro', 'inscricoes', 'lotes'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setAba(tab)}
            className={`px-4 py-2 rounded text-sm ${
              aba === tab ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
            }`}
          >
            {tab === 'cadastro'
              ? t('erp.eventos.tabCadastro')
              : tab === 'inscricoes'
                ? t('erp.eventos.tabInscricoes')
                : t('erp.eventos.tabLotes')}
          </button>
        ))}
      </div>

      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
      {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}

      {aba === 'cadastro' && (
        <>
          {canWrite && (
            <form onSubmit={salvarEvento} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-lg">
              <h3 className="font-medium text-[var(--color-accent)]">
                {editId != null ? t('erp.eventos.editTitle') : t('erp.eventos.newTitle')}
              </h3>
              <input
                value={formEvento.nomeEvento}
                onChange={(e) => setFormEvento({ ...formEvento, nomeEvento: e.target.value })}
                placeholder={t('erp.eventos.namePlaceholder')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <input
                type="datetime-local"
                value={formEvento.dataEvento}
                onChange={(e) => setFormEvento({ ...formEvento, dataEvento: e.target.value })}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <select
                value={formEvento.tipo}
                onChange={(e) =>
                  setFormEvento({ ...formEvento, tipo: e.target.value as 'GIRA' | 'OFICINA' })
                }
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              >
                <option value="GIRA">{t('events.tipo.GIRA')}</option>
                <option value="OFICINA">{t('events.tipo.OFICINA')}</option>
              </select>
              <input
                type="number"
                min="1"
                value={formEvento.capacidadeMax}
                onChange={(e) => setFormEvento({ ...formEvento, capacidadeMax: e.target.value })}
                placeholder={t('erp.eventos.capacityPlaceholder')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
                  {editId != null ? t('erp.common.save') : t('erp.eventos.create')}
                </button>
                {editId != null && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 bg-white/10 rounded text-sm">
                    {t('erp.common.cancel')}
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-white/60">{t('erp.eventos.filterStatus')}</span>
            <button
              type="button"
              onClick={() => setFiltroStatus('ABERTO')}
              className={`px-3 py-1 rounded text-xs ${
                filtroStatus === 'ABERTO' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
              }`}
            >
              {t('erp.eventos.statusOpen')}
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ENCERRADO')}
              className={`px-3 py-1 rounded text-xs ${
                filtroStatus === 'ENCERRADO' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
              }`}
            >
              {t('erp.eventos.statusClosed')}
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('')}
              className={`px-3 py-1 rounded text-xs ${
                filtroStatus === '' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10'
              }`}
            >
              {t('erp.common.all')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="p-2">{t('erp.eventos.colName')}</th>
                  <th className="p-2">{t('erp.eventos.colDate')}</th>
                  <th className="p-2">{t('erp.eventos.colType')}</th>
                  <th className="p-2">{t('erp.usuarios.colStatus')}</th>
                  <th className="p-2">{t('erp.eventos.colRegs')}</th>
                  {canWrite && <th className="p-2">{t('erp.common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr key={ev.id} className="border-b border-white/10">
                    <td className="p-2">{ev.nomeEvento}</td>
                    <td className="p-2">
                      {new Date(ev.dataEvento).toLocaleString(dateLocale)}
                    </td>
                    <td className="p-2">
                      {(ev.tipo ?? 'GIRA') === 'OFICINA'
                        ? t('events.tipo.OFICINA')
                        : t('events.tipo.GIRA')}
                    </td>
                    <td className="p-2">
                      {ev.status === 'ABERTO'
                        ? t('erp.eventos.statusOpen')
                        : t('erp.eventos.statusClosed')}
                    </td>
                    <td className="p-2">
                      {ev._count.inscricoes}
                      {ev.capacidadeMax != null ? ` / ${ev.capacidadeMax}` : ''}
                    </td>
                    {canWrite && (
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => editarEvento(ev)}
                            className="text-xs text-[var(--color-accent)] hover:underline"
                          >
                            {t('erp.common.edit')}
                          </button>
                          {ev.status === 'ABERTO' ? (
                            <button
                              type="button"
                              onClick={() => alterarStatus(ev, 'ENCERRADO')}
                              className="text-xs hover:underline"
                            >
                              {t('erp.eventos.closeAction')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alterarStatus(ev, 'ABERTO')}
                              className="text-xs hover:underline"
                            >
                              {t('erp.eventos.reopenAction')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => excluirEvento(ev)}
                            className="text-xs text-[var(--color-danger)] hover:underline"
                          >
                            {t('erp.common.delete')}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="p-4 text-center text-white/50">
                      {t('erp.eventos.emptyList')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'inscricoes' && (
        <>
          <select
            value={eventoId ?? ''}
            onChange={(e) => setEventoId(Number(e.target.value) || null)}
            className="w-full max-w-md px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {eventos.length === 0 && <option value="">{t('erp.eventos.emptyList')}</option>}
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nomeEvento} — {t('erp.eventos.registeredCount', { count: ev._count.inscricoes })}
                {ev.capacidadeMax ? ` / ${ev.capacidadeMax}` : ''}
                {ev.status === 'ENCERRADO' ? ` (${t('erp.eventos.statusClosed')})` : ''}
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

          {canWrite && evento && evento.status === 'ABERTO' && (
            <form onSubmit={inscrever} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
              <h3 className="font-medium text-[var(--color-accent)]">{t('erp.eventos.newRegistration')}</h3>
              <select
                value={formInscricao.pessoaId}
                onChange={(e) => setFormInscricao({ ...formInscricao, pessoaId: e.target.value })}
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
              {(evento.ingressoLotes?.length ?? 0) > 0 && (
                <select
                  value={formInscricao.ingressoLoteId}
                  onChange={(e) => {
                    const loteId = e.target.value;
                    const lote = evento.ingressoLotes?.find((l) => String(l.id) === loteId);
                    setFormInscricao({
                      ...formInscricao,
                      ingressoLoteId: loteId,
                      valor: lote ? String(lote.valor) : formInscricao.valor,
                    });
                  }}
                  className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                >
                  <option value="">{t('erp.eventos.loteNone')}</option>
                  {(evento.ingressoLotes ?? [])
                    .filter((l) => l.ativo)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} — {formatMoney(locale, Number(l.valor))} (
                        {t('erp.eventos.loteSpots', {
                          restantes: l.vagasRestantes,
                          total: l.quantidade,
                        })}
                        )
                      </option>
                    ))}
                </select>
              )}
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formInscricao.valor}
                onChange={(e) => setFormInscricao({ ...formInscricao, valor: e.target.value })}
                placeholder={t('erp.common.value')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required={!formInscricao.ingressoLoteId}
              />
              <input
                type="date"
                value={formInscricao.vencimento}
                onChange={(e) => setFormInscricao({ ...formInscricao, vencimento: e.target.value })}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
                {t('erp.eventos.register')}
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="p-2">{t('erp.common.person')}</th>
                  <th className="p-2">{t('erp.eventos.lote')}</th>
                  <th className="p-2">{t('erp.eventos.code')}</th>
                  <th className="p-2">{t('erp.common.value')}</th>
                  <th className="p-2">{t('erp.common.dueDate')}</th>
                  <th className="p-2">{t('erp.financeiro.colCompliance')}</th>
                  <th className="p-2">{t('erp.common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {(evento?.inscricoes ?? []).map((i) => (
                  <tr
                    key={i.id}
                    className={`border-b border-white/10 ${i.canceladaEm ? 'opacity-50' : ''}`}
                  >
                    <td className="p-2">{i.pessoa.nomeCompleto}</td>
                    <td className="p-2">{i.ingressoLote?.nome ?? t('erp.eventos.loteNone')}</td>
                    <td className="p-2 font-mono text-xs">{i.codigo ?? t('erp.common.emptyDash')}</td>
                    <td className="p-2">{formatMoney(locale, Number(i.valor))}</td>
                    <td className="p-2">
                      {i.vencimento
                        ? new Date(i.vencimento).toLocaleDateString(dateLocale)
                        : t('erp.common.emptyDash')}
                    </td>
                    <td className="p-2">
                      {i.canceladaEm
                        ? t('erp.eventos.cancelled')
                        : labelEnum(t, 'adimplencia', i.adimplencia)}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        {!i.canceladaEm && i.statusPagamento === 'PENDENTE' && canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => confirmarPagamento(i.id)}
                              className="text-[var(--color-accent)] hover:underline text-xs"
                            >
                              {t('erp.eventos.confirmPayment')}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelarInscricao(i.id)}
                              className="text-[var(--color-danger)] hover:underline text-xs"
                            >
                              {t('erp.eventos.cancelRegistration')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(evento?.inscricoes?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-white/50">
                      {t('erp.eventos.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === 'lotes' && (
        <>
          <select
            value={eventoId ?? ''}
            onChange={(e) => setEventoId(Number(e.target.value) || null)}
            className="w-full max-w-md px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            {eventos.length === 0 && <option value="">{t('erp.eventos.emptyList')}</option>}
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nomeEvento}
                {ev.capacidadeMax ? ` / ${ev.capacidadeMax}` : ''}
              </option>
            ))}
          </select>

          {canWrite && evento && (
            <form onSubmit={criarLote} className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 max-w-md">
              <h3 className="font-medium text-[var(--color-accent)]">{t('erp.eventos.lotesTitle')}</h3>
              <input
                value={formLote.nome}
                onChange={(e) => setFormLote({ ...formLote, nome: e.target.value })}
                placeholder={t('erp.eventos.loteName')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <input
                type="number"
                min="1"
                value={formLote.quantidade}
                onChange={(e) => setFormLote({ ...formLote, quantidade: e.target.value })}
                placeholder={t('erp.eventos.loteQty')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formLote.valor}
                onChange={(e) => setFormLote({ ...formLote, valor: e.target.value })}
                placeholder={t('erp.common.value')}
                className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
                required
              />
              <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
                {t('erp.eventos.loteCreate')}
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/20">
                  <th className="p-2">{t('erp.eventos.loteName')}</th>
                  <th className="p-2">{t('erp.common.value')}</th>
                  <th className="p-2">{t('erp.eventos.loteQty')}</th>
                  <th className="p-2">{t('erp.usuarios.colStatus')}</th>
                  {canWrite && <th className="p-2">{t('erp.common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {(evento?.ingressoLotes ?? []).map((lote) => (
                  <tr key={lote.id} className="border-b border-white/10">
                    <td className="p-2">{lote.nome}</td>
                    <td className="p-2">{formatMoney(locale, Number(lote.valor))}</td>
                    <td className="p-2">
                      {t('erp.eventos.loteSpots', {
                        restantes: lote.vagasRestantes,
                        total: lote.quantidade,
                      })}
                    </td>
                    <td className="p-2">
                      {lote.ativo ? t('erp.eventos.statusOpen') : t('erp.eventos.statusClosed')}
                    </td>
                    {canWrite && (
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleLoteAtivo(lote)}
                            className="text-xs text-[var(--color-accent)] hover:underline"
                          >
                            {lote.ativo ? t('erp.eventos.loteDeactivate') : t('erp.eventos.loteActivate')}
                          </button>
                          <button
                            type="button"
                            onClick={() => excluirLote(lote)}
                            className="text-xs text-[var(--color-danger)] hover:underline"
                          >
                            {t('erp.common.delete')}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(evento?.ingressoLotes?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="p-4 text-center text-white/50">
                      {t('erp.eventos.loteEmpty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
