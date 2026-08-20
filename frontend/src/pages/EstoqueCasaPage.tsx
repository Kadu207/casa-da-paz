import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth, hasPermission } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';

type Categoria = 'RITUAL' | 'BEBIDA' | 'TABACO' | 'VELA' | 'LIMPEZA' | 'DESCARTAVEL' | 'OUTROS';
type Unidade = 'UN' | 'CX' | 'PCT' | 'L' | 'ML' | 'KG' | 'G';

interface Item {
  id: number;
  nome: string;
  categoria: Categoria;
  unidade: Unidade;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
  observacao?: string | null;
  abaixoDoMinimo: boolean;
}

interface Movimentacao {
  id: number;
  tipo: string;
  quantidade: number;
  saldoApos: number;
  motivo?: string | null;
  createdAt: string;
  item: { id: number; nome: string; categoria: string; unidade: string };
  usuario: { id: number; login: string };
}

interface Grupo {
  id: number;
  nome: string;
  ativo: boolean;
  responsavelUsuarioId: number;
  responsavel: { id: number; login: string; pessoa?: { nomeCompleto: string } | null };
}

interface Checklist {
  id: number;
  grupoId: number;
  competencia: string;
  status: string;
  observacao?: string | null;
  grupo: { id: number; nome: string };
  itens: {
    itemId: number;
    quantidadeBaixa: number;
    conferido: boolean;
    item: { id: number; nome: string; unidade: string; estoqueAtual: number };
  }[];
}

interface Relatorio {
  criticos: Item[];
  consumoPorCategoria: Record<string, number>;
  consumoPorItem: { itemId: number; nome: string; categoria: string; quantidade: number }[];
  totalSaidas: number;
}

interface UsuarioOpt {
  id: number;
  login: string;
  pessoa?: { nomeCompleto: string };
}

const CATEGORIAS: Categoria[] = ['RITUAL', 'BEBIDA', 'TABACO', 'VELA', 'LIMPEZA', 'DESCARTAVEL', 'OUTROS'];
const UNIDADES: Unidade[] = ['UN', 'CX', 'PCT', 'L', 'ML', 'KG', 'G'];

const emptyItem = {
  nome: '',
  categoria: 'RITUAL' as Categoria,
  unidade: 'UN' as Unidade,
  estoqueAtual: '0',
  estoqueMinimo: '0',
  observacao: '',
};

type Aba = 'itens' | 'movimentacoes' | 'grupos' | 'checklist' | 'relatorio';

export default function EstoqueCasaPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'estoque_casa', 'write');
  const canManageGrupos =
    user?.setorAcesso === 'SUPERVISOR' ||
    user?.setorAcesso === 'ADMIN' ||
    user?.setorAcesso === 'DIRETORIA' ||
    user?.setorAcesso === 'TESOURARIA' ||
    user?.policy?.estoque_casa === 'write';

  const [aba, setAba] = useState<Aba>('itens');
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [itens, setItens] = useState<Item[]>([]);
  const [filtroCat, setFiltroCat] = useState('');
  const [soCriticos, setSoCriticos] = useState(false);
  const [formItem, setFormItem] = useState(emptyItem);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [movForm, setMovForm] = useState({ itemId: '', tipo: 'ENTRADA', quantidade: '1', motivo: '', saldoDestino: '' });
  const [movs, setMovs] = useState<Movimentacao[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOpt[]>([]);
  const [grupoForm, setGrupoForm] = useState({ nome: '', responsavelUsuarioId: '', ativo: true });
  const [editGrupoId, setEditGrupoId] = useState<number | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [checkForm, setCheckForm] = useState({ grupoId: '', competencia: new Date().toISOString().slice(0, 10) });
  const [activeChecklist, setActiveChecklist] = useState<Checklist | null>(null);
  const [checkLinhas, setCheckLinhas] = useState<Record<number, string>>({});
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);

  const carregarItens = useCallback(async () => {
    const q = new URLSearchParams();
    if (filtroCat) q.set('categoria', filtroCat);
    if (soCriticos) q.set('abaixoMinimo', '1');
    const data = await api<Item[]>(`/estoque-casa/itens?${q}`);
    setItens(data);
  }, [filtroCat, soCriticos]);

  const carregarMovs = useCallback(async () => {
    setMovs(await api<Movimentacao[]>('/estoque-casa/movimentacoes?limit=100'));
  }, []);

  const carregarGrupos = useCallback(async () => {
    setGrupos(await api<Grupo[]>('/estoque-casa/grupos-limpeza'));
  }, []);

  const carregarChecklists = useCallback(async () => {
    setChecklists(await api<Checklist[]>('/estoque-casa/checklists'));
  }, []);

  const carregarRelatorio = useCallback(async () => {
    setRelatorio(await api<Relatorio>('/estoque-casa/relatorio'));
  }, []);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      if (aba === 'itens') await carregarItens();
      else if (aba === 'movimentacoes') await carregarMovs();
      else if (aba === 'grupos') {
        await carregarGrupos();
        if (canManageGrupos) {
          try {
            setUsuarios(await api<UsuarioOpt[]>('/auth/usuarios'));
          } catch {
            setUsuarios([]);
          }
        }
      } else if (aba === 'checklist') {
        await Promise.all([carregarChecklists(), carregarGrupos(), carregarItens()]);
      } else await carregarRelatorio();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.loadError'));
    }
  }, [
    aba,
    carregarItens,
    carregarMovs,
    carregarGrupos,
    carregarChecklists,
    carregarRelatorio,
    canManageGrupos,
    t,
  ]);

  useEffect(() => {
    carregar().catch(() => undefined);
  }, [carregar]);

  const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const payload = {
      nome: formItem.nome,
      categoria: formItem.categoria,
      unidade: formItem.unidade,
      estoqueAtual: Number(formItem.estoqueAtual),
      estoqueMinimo: Number(formItem.estoqueMinimo),
      observacao: formItem.observacao || null,
    };
    try {
      if (editItemId) {
        await api(`/estoque-casa/itens/${editItemId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMsg(t('erp.estoque.itemUpdated'));
      } else {
        await api('/estoque-casa/itens', { method: 'POST', body: JSON.stringify(payload) });
        setMsg(t('erp.estoque.itemCreated'));
      }
      setFormItem(emptyItem);
      setEditItemId(null);
      await carregarItens();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.saveError'));
    }
  };

  const registrarMov = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      await api('/estoque-casa/movimentacoes', {
        method: 'POST',
        body: JSON.stringify({
          itemId: Number(movForm.itemId),
          tipo: movForm.tipo,
          quantidade: Number(movForm.quantidade),
          motivo: movForm.motivo || undefined,
          saldoDestino: movForm.tipo === 'AJUSTE' ? Number(movForm.saldoDestino) : undefined,
        }),
      });
      setMsg(t('erp.estoque.movOk'));
      setMovForm({ itemId: '', tipo: 'ENTRADA', quantidade: '1', motivo: '', saldoDestino: '' });
      await carregarItens();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.movError'));
    }
  };

  const salvarGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const payload = {
      nome: grupoForm.nome,
      responsavelUsuarioId: Number(grupoForm.responsavelUsuarioId),
      ativo: grupoForm.ativo,
    };
    try {
      if (editGrupoId) {
        await api(`/estoque-casa/grupos-limpeza/${editGrupoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/estoque-casa/grupos-limpeza', { method: 'POST', body: JSON.stringify(payload) });
      }
      setMsg(t('erp.estoque.grupoOk'));
      setGrupoForm({ nome: '', responsavelUsuarioId: '', ativo: true });
      setEditGrupoId(null);
      await carregarGrupos();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.saveError'));
    }
  };

  const criarChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    try {
      const cl = await api<Checklist>('/estoque-casa/checklists', {
        method: 'POST',
        body: JSON.stringify({
          grupoId: Number(checkForm.grupoId),
          competencia: checkForm.competencia,
        }),
      });
      setActiveChecklist(cl);
      setCheckLinhas({});
      setMsg(t('erp.estoque.checklistCreated'));
      await carregarChecklists();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.saveError'));
    }
  };

  const salvarChecklistRascunho = async () => {
    if (!activeChecklist) return;
    setErro('');
    const itensPayload = Object.entries(checkLinhas)
      .filter(([, q]) => q !== '')
      .map(([itemId, q]) => ({
        itemId: Number(itemId),
        quantidadeBaixa: Number(q) || 0,
        conferido: true,
      }));
    try {
      const updated = await api<Checklist>(`/estoque-casa/checklists/${activeChecklist.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ itens: itensPayload }),
      });
      setActiveChecklist(updated);
      setMsg(t('erp.estoque.checklistSaved'));
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.saveError'));
    }
  };

  const concluirChecklist = async () => {
    if (!activeChecklist) return;
    await salvarChecklistRascunho();
    try {
      await api(`/estoque-casa/checklists/${activeChecklist.id}/concluir`, { method: 'POST' });
      setMsg(t('erp.estoque.checklistDone'));
      setActiveChecklist(null);
      await Promise.all([carregarChecklists(), carregarItens()]);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.estoque.saveError'));
    }
  };

  const criticosCount = itens.filter((i) => i.abaixoDoMinimo).length;

  const tabs: { id: Aba; label: string }[] = [
    { id: 'itens', label: t('erp.estoque.tabItens') },
    { id: 'movimentacoes', label: t('erp.estoque.tabMov') },
    { id: 'grupos', label: t('erp.estoque.tabGrupos') },
    { id: 'checklist', label: t('erp.estoque.tabChecklist') },
    { id: 'relatorio', label: t('erp.estoque.tabRelatorio') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif text-[var(--color-accent)]">{t('erp.estoque.title')}</h2>
          <p className="text-sm text-white/60 mt-1">{t('erp.estoque.subtitle')}</p>
        </div>
        {aba === 'itens' && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {t('erp.estoque.alertSummary', { count: String(criticosCount) })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAba(tab.id);
              setMsg('');
              setErro('');
            }}
            className={`px-3 py-1.5 rounded text-sm ${
              aba === tab.id ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' : 'bg-white/10 text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {erro && <p className="text-red-300 text-sm">{erro}</p>}
      {msg && <p className="text-emerald-300 text-sm">{msg}</p>}

      {aba === 'itens' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="bg-white/10 rounded px-2 py-1 text-sm"
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
            >
              <option value="">{t('erp.common.all')}</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="text-sm text-white/70 flex items-center gap-2">
              <input type="checkbox" checked={soCriticos} onChange={(e) => setSoCriticos(e.target.checked)} />
              {t('erp.estoque.onlyCritical')}
            </label>
          </div>

          {canWrite && (
            <form onSubmit={salvarItem} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 bg-white/5 p-3 rounded-lg">
              <input
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                placeholder={t('erp.estoque.namePlaceholder')}
                value={formItem.nome}
                onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })}
                required
              />
              <select
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                value={formItem.categoria}
                onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value as Categoria })}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                value={formItem.unidade}
                onChange={(e) => setFormItem({ ...formItem, unidade: e.target.value as Unidade })}
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                type="number"
                min={0}
                placeholder={t('erp.estoque.currentStock')}
                value={formItem.estoqueAtual}
                onChange={(e) => setFormItem({ ...formItem, estoqueAtual: e.target.value })}
              />
              <input
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                type="number"
                min={0}
                placeholder={t('erp.estoque.minStock')}
                value={formItem.estoqueMinimo}
                onChange={(e) => setFormItem({ ...formItem, estoqueMinimo: e.target.value })}
              />
              <button type="submit" className="bg-[var(--color-accent)] text-[var(--color-bg)] rounded px-3 py-1.5 text-sm font-medium">
                {editItemId ? t('erp.common.save') : t('erp.common.new')}
              </button>
            </form>
          )}

          {canWrite && (
            <form onSubmit={registrarMov} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 bg-white/5 p-3 rounded-lg">
              <select
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                value={movForm.itemId}
                onChange={(e) => setMovForm({ ...movForm, itemId: e.target.value })}
                required
              >
                <option value="">{t('erp.estoque.selectItem')}</option>
                {itens.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
              <select
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                value={movForm.tipo}
                onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}
              >
                <option value="ENTRADA">ENTRADA</option>
                <option value="SAIDA">SAIDA</option>
                <option value="AJUSTE">AJUSTE</option>
              </select>
              <input
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                type="number"
                min={1}
                value={movForm.quantidade}
                onChange={(e) => setMovForm({ ...movForm, quantidade: e.target.value })}
              />
              {movForm.tipo === 'AJUSTE' && (
                <input
                  className="bg-white/10 rounded px-2 py-1.5 text-sm"
                  type="number"
                  min={0}
                  placeholder={t('erp.estoque.adjustTo')}
                  value={movForm.saldoDestino}
                  onChange={(e) => setMovForm({ ...movForm, saldoDestino: e.target.value })}
                  required
                />
              )}
              <button type="submit" className="bg-white/15 rounded px-3 py-1.5 text-sm">
                {t('erp.estoque.registerMov')}
              </button>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-white/70">
                <tr>
                  <th className="px-3 py-2">{t('erp.estoque.colName')}</th>
                  <th className="px-3 py-2">{t('erp.estoque.colCategory')}</th>
                  <th className="px-3 py-2">{t('erp.estoque.colUnit')}</th>
                  <th className="px-3 py-2">{t('erp.estoque.colCurrent')}</th>
                  <th className="px-3 py-2">{t('erp.estoque.colMin')}</th>
                  <th className="px-3 py-2">{t('erp.estoque.colStatus')}</th>
                  {canWrite && <th className="px-3 py-2">{t('erp.common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id} className="border-t border-white/5">
                    <td className="px-3 py-2">{i.nome}</td>
                    <td className="px-3 py-2">{i.categoria}</td>
                    <td className="px-3 py-2">{i.unidade}</td>
                    <td className="px-3 py-2">{i.estoqueAtual}</td>
                    <td className="px-3 py-2">{i.estoqueMinimo}</td>
                    <td className="px-3 py-2">
                      {i.abaixoDoMinimo ? (
                        <span className="text-amber-300">{t('erp.estoque.belowMin')}</span>
                      ) : (
                        <span className="text-emerald-300/80">{t('erp.estoque.ok')}</span>
                      )}
                    </td>
                    {canWrite && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-[var(--color-accent)] text-xs underline"
                          onClick={() => {
                            setEditItemId(i.id);
                            setFormItem({
                              nome: i.nome,
                              categoria: i.categoria,
                              unidade: i.unidade,
                              estoqueAtual: String(i.estoqueAtual),
                              estoqueMinimo: String(i.estoqueMinimo),
                              observacao: i.observacao ?? '',
                            });
                          }}
                        >
                          {t('erp.common.edit')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {itens.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-white/50">
                      {t('erp.estoque.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aba === 'movimentacoes' && (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-white/70">
              <tr>
                <th className="px-3 py-2">{t('erp.estoque.colDate')}</th>
                <th className="px-3 py-2">{t('erp.estoque.colName')}</th>
                <th className="px-3 py-2">{t('erp.estoque.colType')}</th>
                <th className="px-3 py-2">Qtd</th>
                <th className="px-3 py-2">{t('erp.estoque.colBalance')}</th>
                <th className="px-3 py-2">User</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{m.item.nome}</td>
                  <td className="px-3 py-2">{m.tipo}</td>
                  <td className="px-3 py-2">{m.quantidade}</td>
                  <td className="px-3 py-2">{m.saldoApos}</td>
                  <td className="px-3 py-2">{m.usuario.login}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'grupos' && (
        <div className="space-y-4">
          {canManageGrupos && (
            <form onSubmit={salvarGrupo} className="grid gap-2 sm:grid-cols-3 bg-white/5 p-3 rounded-lg">
              <input
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                placeholder={t('erp.estoque.groupName')}
                value={grupoForm.nome}
                onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })}
                required
              />
              <select
                className="bg-white/10 rounded px-2 py-1.5 text-sm"
                value={grupoForm.responsavelUsuarioId}
                onChange={(e) => setGrupoForm({ ...grupoForm, responsavelUsuarioId: e.target.value })}
                required
              >
                <option value="">{t('erp.estoque.selectResponsible')}</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.login} {u.pessoa?.nomeCompleto ? `— ${u.pessoa.nomeCompleto}` : ''}
                  </option>
                ))}
              </select>
              <button type="submit" className="bg-[var(--color-accent)] text-[var(--color-bg)] rounded px-3 py-1.5 text-sm">
                {editGrupoId ? t('erp.common.save') : t('erp.estoque.createGroup')}
              </button>
            </form>
          )}
          <ul className="space-y-2">
            {grupos.map((g) => (
              <li key={g.id} className="bg-white/5 rounded px-3 py-2 text-sm flex justify-between gap-2">
                <span>
                  <strong>{g.nome}</strong> — {g.responsavel.pessoa?.nomeCompleto ?? g.responsavel.login}
                  {!g.ativo && <span className="text-white/40"> (inativo)</span>}
                </span>
                {canManageGrupos && (
                  <button
                    type="button"
                    className="text-[var(--color-accent)] text-xs underline"
                    onClick={() => {
                      setEditGrupoId(g.id);
                      setGrupoForm({
                        nome: g.nome,
                        responsavelUsuarioId: String(g.responsavelUsuarioId),
                        ativo: g.ativo,
                      });
                    }}
                  >
                    {t('erp.common.edit')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aba === 'checklist' && (
        <div className="space-y-4">
          <form onSubmit={criarChecklist} className="flex flex-wrap gap-2 items-end bg-white/5 p-3 rounded-lg">
            <select
              className="bg-white/10 rounded px-2 py-1.5 text-sm"
              value={checkForm.grupoId}
              onChange={(e) => setCheckForm({ ...checkForm, grupoId: e.target.value })}
              required
            >
              <option value="">{t('erp.estoque.selectGroup')}</option>
              {grupos.filter((g) => g.ativo).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="bg-white/10 rounded px-2 py-1.5 text-sm"
              value={checkForm.competencia}
              onChange={(e) => setCheckForm({ ...checkForm, competencia: e.target.value })}
              required
            />
            <button type="submit" className="bg-[var(--color-accent)] text-[var(--color-bg)] rounded px-3 py-1.5 text-sm">
              {t('erp.estoque.openChecklist')}
            </button>
          </form>

          {activeChecklist && activeChecklist.status === 'RASCUNHO' && (
            <div className="space-y-3 border border-white/10 rounded-lg p-3">
              <h3 className="font-medium text-[var(--color-accent)]">
                {t('erp.estoque.checklistEditing')} #{activeChecklist.id} — {activeChecklist.grupo.nome}
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {itens.map((i) => (
                  <label key={i.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">
                      {i.nome} <span className="text-white/40">({i.estoqueAtual} {i.unidade})</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-20 bg-white/10 rounded px-2 py-1"
                      value={checkLinhas[i.id] ?? ''}
                      onChange={(e) => setCheckLinhas({ ...checkLinhas, [i.id]: e.target.value })}
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={salvarChecklistRascunho} className="bg-white/15 rounded px-3 py-1.5 text-sm">
                  {t('erp.common.save')}
                </button>
                <button type="button" onClick={concluirChecklist} className="bg-[var(--color-accent)] text-[var(--color-bg)] rounded px-3 py-1.5 text-sm">
                  {t('erp.estoque.concludeChecklist')}
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-2 text-sm">
            {checklists.map((c) => (
              <li key={c.id} className="bg-white/5 rounded px-3 py-2 flex justify-between">
                <span>
                  #{c.id} {c.grupo.nome} — {String(c.competencia).slice(0, 10)} — {c.status}
                </span>
                {c.status === 'RASCUNHO' && (
                  <button
                    type="button"
                    className="text-[var(--color-accent)] text-xs underline"
                    onClick={() => {
                      setActiveChecklist(c);
                      const linhas: Record<number, string> = {};
                      c.itens.forEach((lin) => {
                        linhas[lin.itemId] = String(lin.quantidadeBaixa);
                      });
                      setCheckLinhas(linhas);
                    }}
                  >
                    {t('erp.common.edit')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aba === 'relatorio' && relatorio && (
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {t('erp.estoque.totalOut')}: <strong>{relatorio.totalSaidas}</strong>
          </p>
          <div>
            <h3 className="text-[var(--color-accent)] mb-2">{t('erp.estoque.criticalItems')}</h3>
            <ul className="text-sm space-y-1">
              {relatorio.criticos.map((i) => (
                <li key={i.id}>
                  {i.nome}: {i.estoqueAtual}/{i.estoqueMinimo}
                </li>
              ))}
              {relatorio.criticos.length === 0 && <li className="text-white/40">{t('erp.estoque.noCritical')}</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-[var(--color-accent)] mb-2">{t('erp.estoque.consumption')}</h3>
            <ul className="text-sm space-y-1">
              {relatorio.consumoPorItem.slice(0, 20).map((c) => (
                <li key={c.itemId}>
                  {c.nome} ({c.categoria}): {c.quantidade}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
