import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import AgendamentosFila from '../components/AgendamentosFila';
import { useI18n } from '../i18n/I18nContext';
import { labelEnum } from '../i18n/helpers';

interface Pessoa {
  id: number;
  nomeCompleto: string;
  telefone: string | null;
  maiorDeIdade: boolean;
  tipoPerfil: string;
}

interface Presenca {
  id: number;
  tipoPresenca: string;
  nomeResponsavel: string | null;
  horarioChegada: string;
  pessoa: Pessoa;
}

interface Evento {
  id: number;
  nomeEvento: string;
  dataEvento: string;
  status: string;
  capacidadeMax: number | null;
  _count: { presencas: number; inscricoes: number };
  presencas?: Presenca[];
}

export default function RecepcaoPage() {
  const { t, dateLocale } = useI18n();
  const [aba, setAba] = useState<'checkin' | 'agendamentos'>('agendamentos');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [telefone, setTelefone] = useState('');
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [selecionada, setSelecionada] = useState<Pessoa | null>(null);
  const [tipoPresenca, setTipoPresenca] = useState<'CONSULENTE' | 'MEDIUM'>('CONSULENTE');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [novoEvento, setNovoEvento] = useState({ nomeEvento: '', dataEvento: '', capacidadeMax: '' });
  const [mostrarNovoEvento, setMostrarNovoEvento] = useState(false);

  const eventoAtual = eventos.find((e) => e.id === eventoId) ?? null;

  const carregarEventos = useCallback(async () => {
    const data = await api<Evento[]>('/eventos?status=ABERTO');
    setEventos(data);
    if (data.length && !eventoId) setEventoId(data[0].id);
    if (eventoId) {
      const detalhe = await api<Evento>(`/eventos/${eventoId}`);
      setEventos((prev) => prev.map((e) => (e.id === eventoId ? { ...e, ...detalhe } : e)));
    }
  }, [eventoId]);

  useEffect(() => {
    if (aba === 'checkin') carregarEventos().catch(console.error);
  }, [carregarEventos, aba]);

  const buscar = async () => {
    setErro('');
    setSelecionada(null);
    const data = await api<Pessoa[]>(`/pessoas?telefone=${encodeURIComponent(telefone)}`);
    setPessoas(data);
    if (data.length === 1) setSelecionada(data[0]);
  };

  const checkin = async () => {
    if (!eventoId || !selecionada) return;
    setErro('');
    setMsg('');
    try {
      await api(`/eventos/${eventoId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          pessoaId: selecionada.id,
          tipoPresenca,
          nomeResponsavel: nomeResponsavel.trim() || undefined,
        }),
      });
      setMsg(t('erp.recepcao.checkinSuccess', { name: selecionada.nomeCompleto }));
      setSelecionada(null);
      setTelefone('');
      setPessoas([]);
      setNomeResponsavel('');
      await carregarEventos();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.recepcao.checkinError'));
    }
  };

  const encerrarEvento = async () => {
    if (!eventoId || !confirm(t('erp.recepcao.closeEventConfirm'))) return;
    await api(`/eventos/${eventoId}/encerrar`, { method: 'PATCH' });
    setEventoId(null);
    await carregarEventos();
  };

  const criarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    const ev = await api<Evento>('/eventos', {
      method: 'POST',
      body: JSON.stringify({
        nomeEvento: novoEvento.nomeEvento,
        dataEvento: novoEvento.dataEvento,
        capacidadeMax: novoEvento.capacidadeMax ? Number(novoEvento.capacidadeMax) : undefined,
      }),
    });
    setMostrarNovoEvento(false);
    setEventoId(ev.id);
    await carregarEventos();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.recepcao.title')}</h2>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setAba('agendamentos')}
          className={`px-4 py-2 rounded-t text-sm ${
            aba === 'agendamentos' ? 'bg-[var(--color-accent)] text-black' : 'text-white/70 hover:bg-white/10'
          }`}
        >
          {t('erp.recepcao.tabAppointments')}
        </button>
        <button
          onClick={() => setAba('checkin')}
          className={`px-4 py-2 rounded-t text-sm ${
            aba === 'checkin' ? 'bg-[var(--color-accent)] text-black' : 'text-white/70 hover:bg-white/10'
          }`}
        >
          {t('erp.recepcao.tabCheckin')}
        </button>
      </div>

      {aba === 'agendamentos' && <AgendamentosFila />}

      {aba === 'checkin' && (
        <>
      <section className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{t('erp.recepcao.activeEvent')}</h3>
          <button
            onClick={() => setMostrarNovoEvento(true)}
            className="text-sm px-3 py-1 bg-[var(--color-accent)] text-black rounded"
          >
            {t('erp.recepcao.newEvent')}
          </button>
        </div>
        {mostrarNovoEvento && (
          <form onSubmit={criarEvento} className="space-y-2 border-t border-white/10 pt-3">
            <input
              value={novoEvento.nomeEvento}
              onChange={(e) => setNovoEvento({ ...novoEvento, nomeEvento: e.target.value })}
              placeholder={t('erp.recepcao.eventName')}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            />
            <input
              type="date"
              value={novoEvento.dataEvento}
              onChange={(e) => setNovoEvento({ ...novoEvento, dataEvento: e.target.value })}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            />
            <input
              type="number"
              value={novoEvento.capacidadeMax}
              onChange={(e) => setNovoEvento({ ...novoEvento, capacidadeMax: e.target.value })}
              placeholder={t('erp.recepcao.maxCapacity')}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
            />
            <button type="submit" className="px-4 py-2 bg-[var(--color-accent)] text-black rounded text-sm">
              {t('erp.recepcao.create')}
            </button>
          </form>
        )}
        <select
          value={eventoId ?? ''}
          onChange={(e) => setEventoId(Number(e.target.value))}
          className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
        >
          {eventos.length === 0 && <option value="">{t('erp.recepcao.noOpenEvent')}</option>}
          {eventos.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.nomeEvento} — {t('erp.recepcao.presentCount', { count: ev._count.presencas })}
              {ev.capacidadeMax ? ` / ${ev.capacidadeMax}` : ''}
            </option>
          ))}
        </select>
        {eventoAtual && (
          <div className="flex gap-2 flex-wrap text-sm text-white/70">
            <span>
              {t('erp.recepcao.status', { status: labelEnum(t, 'evento', eventoAtual.status) })}
            </span>
            <button onClick={encerrarEvento} className="text-[var(--color-danger)] hover:underline">
              {t('erp.recepcao.closeEvent')}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">{t('erp.recepcao.searchPerson')}</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder={t('erp.common.phone')}
            className="px-3 py-2 rounded bg-black/30 border border-white/20 flex-1 min-w-[200px]"
          />
          <button onClick={buscar} className="px-4 py-2 bg-[var(--color-accent)] text-black rounded">
            {t('erp.common.search')}
          </button>
        </div>
        <ul className="space-y-2">
          {pessoas.map((p) => (
            <li
              key={p.id}
              onClick={() => setSelecionada(p)}
              className={`p-3 rounded cursor-pointer ${
                selecionada?.id === p.id ? 'bg-[var(--color-accent)]/30 border border-[var(--color-accent)]' : 'bg-[var(--color-surface)]'
              }`}
            >
              <span>{p.nomeCompleto}</span>
              <span className="text-white/60 text-sm ml-2">{p.telefone}</span>
              {!p.maiorDeIdade && (
                <span className="text-amber-400 text-xs ml-2">{t('erp.recepcao.minor')}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {selecionada && eventoId && (
        <section className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3">
          <h3 className="font-medium">{t('erp.recepcao.checkinTitle', { name: selecionada.nomeCompleto })}</h3>
          {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}
          {msg && <p className="text-[var(--color-success)] text-sm">{msg}</p>}
          <select
            value={tipoPresenca}
            onChange={(e) => setTipoPresenca(e.target.value as 'CONSULENTE' | 'MEDIUM')}
            className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
          >
            <option value="CONSULENTE">{labelEnum(t, 'presenca', 'CONSULENTE')}</option>
            <option value="MEDIUM">{labelEnum(t, 'presenca', 'MEDIUM')}</option>
          </select>
          {!selecionada.maiorDeIdade && (
            <input
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder={t('erp.recepcao.responsibleName')}
              className="w-full px-3 py-2 rounded bg-black/30 border border-white/20"
              required
            />
          )}
          <button onClick={checkin} className="px-4 py-2 bg-[var(--color-accent)] text-black rounded">
            {t('erp.recepcao.confirmCheckin')}
          </button>
        </section>
      )}

      {eventoAtual?.presencas && eventoAtual.presencas.length > 0 && (
        <section>
          <h3 className="font-medium mb-2">
            {t('erp.recepcao.present', { count: eventoAtual.presencas.length })}
          </h3>
          <ul className="space-y-1 text-sm">
            {eventoAtual.presencas.map((pr) => (
              <li key={pr.id} className="flex justify-between bg-[var(--color-surface)] p-2 rounded">
                <span>{pr.pessoa.nomeCompleto}</span>
                <span className="text-white/60">
                  {labelEnum(t, 'presenca', pr.tipoPresenca)} —{' '}
                  {new Date(pr.horarioChegada).toLocaleTimeString(dateLocale)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
      )}
    </div>
  );
}
