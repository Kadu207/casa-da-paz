import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { hasPermission, useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

interface PessoaOpt {
  id: number;
  nomeCompleto: string;
  telefone?: string | null;
  email?: string | null;
}

interface Responsavel {
  id: number;
  pessoaId: number;
  papel?: string | null;
  pessoa: PessoaOpt;
}

interface Funcao {
  id: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  ordem: number;
  ativo: boolean;
  pendentes: number;
  responsaveis: Responsavel[];
}

interface Tarefa {
  id: number;
  funcaoId: number;
  pessoaId?: number | null;
  titulo: string;
  descricao?: string | null;
  status: 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';
  vencimento?: string | null;
  concluidaEm?: string | null;
  atrasada?: boolean;
  pessoa?: PessoaOpt | null;
  funcao?: { id: number; nome: string; slug: string };
}

interface Resumo {
  pendentes: number;
  atrasadas: number;
}

export default function DelegacoesPage() {
  const { t, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'delegacoes', 'write');

  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [pessoas, setPessoas] = useState<PessoaOpt[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [funcaoId, setFuncaoId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [novaTarefa, setNovaTarefa] = useState({
    funcaoId: '',
    titulo: '',
    descricao: '',
    vencimento: '',
    pessoaId: '',
  });
  const [novaFuncao, setNovaFuncao] = useState({ nome: '', descricao: '' });
  const [respDraft, setRespDraft] = useState<{ funcaoId: number; pessoaIds: number[] } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const qs = funcaoId === 'all' ? '' : `?funcaoId=${funcaoId}`;
      const [f, tar, r] = await Promise.all([
        api<Funcao[]>('/delegacoes/funcoes'),
        api<Tarefa[]>(`/delegacoes/tarefas${qs}`),
        api<Resumo>('/delegacoes/resumo'),
      ]);
      setFuncoes(f);
      setTarefas(tar);
      setResumo(r);
      if (canWrite && pessoas.length === 0) {
        try {
          const list = await api<PessoaOpt[]>('/pessoas');
          setPessoas(Array.isArray(list) ? list : []);
        } catch {
          setPessoas([]);
        }
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.delegacoes.loadError'));
    } finally {
      setLoading(false);
    }
  }, [funcaoId, canWrite, pessoas.length, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (id: number) => {
    setTogglingId(id);
    try {
      await api(`/delegacoes/tarefas/${id}/toggle`, { method: 'POST' });
      showToast(t('erp.delegacoes.toggled'));
      await load();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t('erp.delegacoes.toggleError'));
    } finally {
      setTogglingId(null);
    }
  };

  const criarTarefa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.funcaoId || !novaTarefa.titulo.trim()) return;
    try {
      await api('/delegacoes/tarefas', {
        method: 'POST',
        body: JSON.stringify({
          funcaoId: Number(novaTarefa.funcaoId),
          titulo: novaTarefa.titulo.trim(),
          descricao: novaTarefa.descricao.trim() || null,
          vencimento: novaTarefa.vencimento || null,
          pessoaId: novaTarefa.pessoaId ? Number(novaTarefa.pessoaId) : null,
        }),
      });
      setNovaTarefa({ funcaoId: '', titulo: '', descricao: '', vencimento: '', pessoaId: '' });
      showToast(t('erp.delegacoes.taskCreated'));
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.delegacoes.saveError'));
    }
  };

  const criarFuncao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaFuncao.nome.trim()) return;
    try {
      await api('/delegacoes/funcoes', {
        method: 'POST',
        body: JSON.stringify({
          nome: novaFuncao.nome.trim(),
          descricao: novaFuncao.descricao.trim() || null,
        }),
      });
      setNovaFuncao({ nome: '', descricao: '' });
      showToast(t('erp.delegacoes.funcCreated'));
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.delegacoes.saveError'));
    }
  };

  const salvarResponsaveis = async () => {
    if (!respDraft) return;
    try {
      await api(`/delegacoes/funcoes/${respDraft.funcaoId}/responsaveis`, {
        method: 'PUT',
        body: JSON.stringify({
          pessoas: respDraft.pessoaIds.map((pessoaId) => ({ pessoaId })),
        }),
      });
      setRespDraft(null);
      showToast(t('erp.delegacoes.respSaved'));
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.delegacoes.saveError'));
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    const d = iso.slice(0, 10);
    try {
      return new Date(`${d}T12:00:00`).toLocaleDateString(dateLocale);
    } catch {
      return d;
    }
  };

  const selectedFuncao = funcoes.find((f) => f.id === funcaoId);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.delegacoes.title')}</h2>
          <p className="text-sm text-white/70 mt-1">{t('erp.delegacoes.subtitle')}</p>
        </div>
        {resumo && (
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1.5 rounded bg-white/10">
              {t('erp.delegacoes.pending')}: {resumo.pendentes}
            </span>
            <span
              className={`px-3 py-1.5 rounded ${
                resumo.atrasadas > 0 ? 'bg-red-500/30 text-red-100' : 'bg-white/10'
              }`}
            >
              {t('erp.delegacoes.overdue')}: {resumo.atrasadas}
            </span>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm shadow-lg">
          {toast}
        </div>
      )}
      {erro && <p className="text-red-300 text-sm">{erro}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFuncaoId('all')}
          className={`px-3 py-1.5 rounded text-sm ${
            funcaoId === 'all' ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10 hover:bg-white/15'
          }`}
        >
          {t('erp.delegacoes.allFunctions')}
        </button>
        {funcoes
          .filter((f) => f.ativo)
          .map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFuncaoId(f.id)}
              className={`px-3 py-1.5 rounded text-sm ${
                funcaoId === f.id ? 'bg-[var(--color-accent)] text-black' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              {f.nome}
              {f.pendentes > 0 ? ` (${f.pendentes})` : ''}
            </button>
          ))}
      </div>

      {selectedFuncao && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
          <h3 className="font-medium text-[var(--color-accent)]">{selectedFuncao.nome}</h3>
          {selectedFuncao.descricao && (
            <p className="text-sm text-white/70">{selectedFuncao.descricao}</p>
          )}
          <p className="text-sm text-white/80">
            <span className="text-white/50">{t('erp.delegacoes.responsibles')}: </span>
            {selectedFuncao.responsaveis.length === 0
              ? t('erp.delegacoes.noResponsibles')
              : selectedFuncao.responsaveis.map((r) => r.pessoa.nomeCompleto).join(', ')}
          </p>
          {canWrite && (
            <button
              type="button"
              className="text-xs underline text-white/70 hover:text-[var(--color-accent)]"
              onClick={() =>
                setRespDraft({
                  funcaoId: selectedFuncao.id,
                  pessoaIds: selectedFuncao.responsaveis.map((r) => r.pessoaId),
                })
              }
            >
              {t('erp.delegacoes.editResponsibles')}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-white/60 text-sm">{t('erp.delegacoes.loading')}</p>
      ) : (
        <ul className="space-y-2">
          {tarefas.length === 0 && (
            <li className="text-sm text-white/50 py-4">{t('erp.delegacoes.noTasks')}</li>
          )}
          {tarefas.map((tar) => (
            <li
              key={tar.id}
              className={`flex gap-3 items-start rounded-lg border px-3 py-3 ${
                tar.atrasada
                  ? 'border-red-400/40 bg-red-500/10'
                  : tar.status === 'CONCLUIDA'
                    ? 'border-white/5 bg-white/[0.03] opacity-70'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                checked={tar.status === 'CONCLUIDA'}
                disabled={tar.status === 'CANCELADA' || togglingId === tar.id}
                onChange={() => toggle(tar.id)}
                aria-label={t('erp.delegacoes.toggle')}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-medium ${
                      tar.status === 'CONCLUIDA' ? 'line-through text-white/50' : ''
                    }`}
                  >
                    {tar.titulo}
                  </span>
                  {tar.atrasada && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/40">
                      {t('erp.delegacoes.overdueBadge')}
                    </span>
                  )}
                  {funcaoId === 'all' && tar.funcao && (
                    <span className="text-xs text-white/50">{tar.funcao.nome}</span>
                  )}
                </div>
                {tar.descricao && <p className="text-sm text-white/60 mt-0.5">{tar.descricao}</p>}
                <p className="text-xs text-white/45 mt-1">
                  {t('erp.delegacoes.due')}: {formatDate(tar.vencimento)}
                  {tar.pessoa ? ` · ${tar.pessoa.nomeCompleto}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-white/10">
          <form onSubmit={criarTarefa} className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-accent)]">
              {t('erp.delegacoes.newTask')}
            </h3>
            <select
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              value={novaTarefa.funcaoId}
              onChange={(e) => setNovaTarefa((s) => ({ ...s, funcaoId: e.target.value }))}
              required
            >
              <option value="">{t('erp.delegacoes.selectFunction')}</option>
              {funcoes
                .filter((f) => f.ativo)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
            </select>
            <input
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              placeholder={t('erp.delegacoes.taskTitle')}
              value={novaTarefa.titulo}
              onChange={(e) => setNovaTarefa((s) => ({ ...s, titulo: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              placeholder={t('erp.delegacoes.taskDesc')}
              rows={2}
              value={novaTarefa.descricao}
              onChange={(e) => setNovaTarefa((s) => ({ ...s, descricao: e.target.value }))}
            />
            <input
              type="date"
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              value={novaTarefa.vencimento}
              onChange={(e) => setNovaTarefa((s) => ({ ...s, vencimento: e.target.value }))}
            />
            <select
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              value={novaTarefa.pessoaId}
              onChange={(e) => setNovaTarefa((s) => ({ ...s, pessoaId: e.target.value }))}
            >
              <option value="">{t('erp.delegacoes.optionalAssignee')}</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomeCompleto}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
            >
              {t('erp.delegacoes.createTask')}
            </button>
          </form>

          <form onSubmit={criarFuncao} className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-accent)]">
              {t('erp.delegacoes.newFunction')}
            </h3>
            <input
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              placeholder={t('erp.delegacoes.funcName')}
              value={novaFuncao.nome}
              onChange={(e) => setNovaFuncao((s) => ({ ...s, nome: e.target.value }))}
              required
            />
            <textarea
              className="w-full rounded bg-black/30 border border-white/15 px-3 py-2 text-sm"
              placeholder={t('erp.delegacoes.funcDesc')}
              rows={2}
              value={novaFuncao.descricao}
              onChange={(e) => setNovaFuncao((s) => ({ ...s, descricao: e.target.value }))}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded border border-white/20 text-sm hover:bg-white/10"
            >
              {t('erp.delegacoes.createFunction')}
            </button>
          </form>
        </div>
      )}

      {respDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-[var(--color-surface)] border border-white/15 p-4 space-y-3">
            <h3 className="font-medium text-[var(--color-accent)]">
              {t('erp.delegacoes.editResponsibles')}
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {pessoas.map((p) => {
                const checked = respDraft.pessoaIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 text-sm py-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setRespDraft((d) =>
                          d
                            ? {
                                ...d,
                                pessoaIds: checked
                                  ? d.pessoaIds.filter((id) => id !== p.id)
                                  : [...d.pessoaIds, p.id],
                              }
                            : d
                        )
                      }
                    />
                    {p.nomeCompleto}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded hover:bg-white/10"
                onClick={() => setRespDraft(null)}
              >
                {t('erp.delegacoes.cancel')}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-sm rounded bg-[var(--color-accent)] text-black"
                onClick={salvarResponsaveis}
              >
                {t('erp.delegacoes.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
