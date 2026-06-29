import { useI18n } from '../../i18n/I18nContext';
import type { PessoaCadastro, CadastroSecaoConfig } from '../../lib/cadastro-secoes';
import { formatResponsaveis } from '../../lib/cadastro-secoes';

interface Props {
  secao: CadastroSecaoConfig;
  pessoas: PessoaCadastro[];
  canWrite: boolean;
  onEdit: (p: PessoaCadastro) => void;
  onDelete: (id: number) => void;
  onAdd: (perfil: CadastroSecaoConfig['perfil']) => void;
}

export default function CadastroSecaoTable({
  secao,
  pessoas,
  canWrite,
  onEdit,
  onDelete,
  onAdd,
}: Props) {
  const { t, dateLocale } = useI18n();

  return (
    <section className="bg-[var(--color-surface)] rounded-xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
        <div>
          <h3 className="font-serif text-[var(--color-accent)]">{t(secao.titleKey)}</h3>
          <p className="text-xs text-white/50 mt-0.5">{t(secao.listKey)}</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => onAdd(secao.perfil)}
            className="text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-black font-medium"
          >
            {t('erp.common.new')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/60">
              <th className="p-3">{t('erp.common.name')}</th>
              <th className="p-3">{t('erp.common.phone')}</th>
              {secao.showResponsaveis && (
                <th className="p-3">{t('erp.pessoas.colGuardians')}</th>
              )}
              <th className="p-3">{t('erp.pessoas.registeredAt')}</th>
              {canWrite && <th className="p-3">{t('erp.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3 font-medium">{p.nomeCompleto}</td>
                <td className="p-3 text-white/70">{p.telefone ?? t('erp.common.emptyDash')}</td>
                {secao.showResponsaveis && (
                  <td className="p-3 text-white/70 max-w-xs text-xs">
                    {!p.maiorDeIdade
                      ? formatResponsaveis(p.responsaveis, t('erp.pessoas.guardiansRequired'))
                      : t('erp.common.emptyDash')}
                  </td>
                )}
                <td className="p-3 text-white/60 whitespace-nowrap">
                  {new Date(p.dataCadastro).toLocaleDateString(dateLocale)}
                </td>
                {canWrite && (
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10"
                      >
                        {t('erp.common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="text-xs px-2 py-1 rounded border border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                      >
                        {t('erp.common.delete')}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {pessoas.length === 0 && (
              <tr>
                <td
                  colSpan={(secao.showResponsaveis ? 4 : 3) + (canWrite ? 1 : 0)}
                  className="p-6 text-center text-white/50"
                >
                  {t('erp.pessoas.sectionEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
