import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { hasPermission, useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';

type TipoContribuinte = 'PATROCINIO' | 'PADRINHO';

interface Contribuinte {
  id: number;
  tipo: TipoContribuinte;
  nome: string;
  valor: string;
  telefone: string | null;
  ativo: boolean;
  observacao: string | null;
}

const emptyForm = {
  nome: '',
  valor: '',
  telefone: '',
  observacao: '',
};

function formatMoney(locale: string, value: string | number) {
  const n = typeof value === 'number' ? value : Number(value);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(n) ? n : 0
  );
}

export default function FinanceiroContribuintesPage() {
  const { t, dateLocale } = useI18n();
  const { user } = useAuth();
  const canWrite = hasPermission(user, 'contribuintes', 'write');
  const [list, setList] = useState<Contribuinte[]>([]);
  const [tipoAtivo, setTipoAtivo] = useState<TipoContribuinte>('PATROCINIO');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<Contribuinte[]>('/contribuintes');
      setList(data);
    } catch (e) {
      console.error(e);
      setErro(t('erp.financeiro.contrib.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const filtrados = useMemo(
    () => list.filter((c) => c.tipo === tipoAtivo && c.ativo),
    [list, tipoAtivo]
  );

  const total = useMemo(
    () => filtrados.reduce((acc, c) => acc + Number(c.valor), 0),
    [filtrados]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setErro('');
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const valor = Number(form.valor.replace(',', '.'));
    if (!form.nome.trim() || !Number.isFinite(valor) || valor <= 0) {
      setErro(t('erp.financeiro.contrib.invalid'));
      return;
    }
    const payload = {
      tipo: tipoAtivo,
      nome: form.nome.trim(),
      valor,
      telefone: form.telefone.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      ativo: true,
    };
    try {
      if (editId) {
        await api(`/contribuintes/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/contribuintes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('erp.financeiro.contrib.saveError'));
    }
  };

  const editar = (c: Contribuinte) => {
    setTipoAtivo(c.tipo);
    setEditId(c.id);
    setForm({
      nome: c.nome,
      valor: String(c.valor),
      telefone: c.telefone ?? '',
      observacao: c.observacao ?? '',
    });
  };

  const desativar = async (id: number) => {
    if (!confirm(t('erp.financeiro.contrib.deactivateConfirm'))) return;
    await api(`/contribuintes/${id}`, { method: 'DELETE' });
    if (editId === id) resetForm();
    await load();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">{t('erp.financeiro.contrib.hint')}</p>

      <div className="flex flex-wrap gap-2">
        {(['PATROCINIO', 'PADRINHO'] as const).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => {
              setTipoAtivo(tipo);
              resetForm();
            }}
            className={`px-3 py-2 rounded text-sm ${
              tipoAtivo === tipo
                ? 'bg-[var(--color-accent)] text-black font-medium'
                : 'bg-white/10 text-white/80'
            }`}
          >
            {tipo === 'PATROCINIO'
              ? t('erp.financeiro.contrib.patrocinios')
              : t('erp.financeiro.contrib.padrinhos')}
          </button>
        ))}
      </div>

      {canWrite && (
        <form
          onSubmit={salvar}
          className="bg-[var(--color-surface)] p-4 rounded-xl space-y-3 border border-white/10"
        >
          <h3 className="text-sm text-[var(--color-accent)] font-medium">
            {editId
              ? t('erp.financeiro.contrib.edit')
              : tipoAtivo === 'PATROCINIO'
                ? t('erp.financeiro.contrib.newPatrocinio')
                : t('erp.financeiro.contrib.newPadrinho')}
          </h3>
          {erro && <p className="text-sm text-[var(--color-danger)]">{erro}</p>}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              required
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder={t('erp.common.name')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder={t('erp.financeiro.contrib.value')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              placeholder={t('erp.common.phone')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
            <input
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder={t('erp.financeiro.contrib.notes')}
              className="px-3 py-2 rounded bg-black/30 border border-white/20 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
            >
              {t('erp.common.save')}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded bg-white/10 text-sm"
              >
                {t('erp.common.cancel')}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">
          {t('erp.financeiro.contrib.count', { count: String(filtrados.length) })}
        </span>
        <span className="text-[var(--color-accent)] font-medium">
          {t('erp.financeiro.contrib.total')}: {formatMoney(dateLocale, total)}
        </span>
      </div>

      {loading ? (
        <div className="h-40 bg-[var(--color-surface)] rounded-xl animate-pulse" />
      ) : (
        <div className="overflow-x-auto bg-[var(--color-surface)] rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="p-3">{t('erp.common.name')}</th>
                <th className="p-3">{t('erp.financeiro.contrib.value')}</th>
                <th className="p-3">{t('erp.common.phone')}</th>
                <th className="p-3">{t('erp.financeiro.contrib.notes')}</th>
                {canWrite && <th className="p-3">{t('erp.common.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 font-medium">{c.nome}</td>
                  <td className="p-3 whitespace-nowrap">{formatMoney(dateLocale, c.valor)}</td>
                  <td className="p-3 text-white/70">{c.telefone ?? t('erp.common.emptyDash')}</td>
                  <td className="p-3 text-white/60 text-xs max-w-xs truncate">
                    {c.observacao ?? t('erp.common.emptyDash')}
                  </td>
                  {canWrite && (
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => editar(c)}
                          className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10"
                        >
                          {t('erp.common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => desativar(c.id)}
                          className="text-xs px-2 py-1 rounded border border-[var(--color-danger)]/50 text-[var(--color-danger)]"
                        >
                          {t('erp.common.delete')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={canWrite ? 5 : 4}
                    className="p-6 text-center text-white/50"
                  >
                    {t('erp.financeiro.contrib.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
