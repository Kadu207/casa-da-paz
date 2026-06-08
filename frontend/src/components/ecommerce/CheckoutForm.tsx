import { useState } from 'react';
import { maskCep, maskCnpj, maskCpf, maskTelefone, UFS } from '../../lib/masks';
import { fetchViaCep } from '../../lib/viacep';
import { useI18n } from '../../i18n/I18nContext';
import { LgpdConsentCheckbox } from '../public/LgpdConsentCheckbox';

export interface CheckoutFormData {
  tipo: 'PF' | 'PJ';
  nomeCompleto: string;
  cpf: string;
  cnpj: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

const empty: CheckoutFormData = {
  tipo: 'PF',
  nomeCompleto: '',
  cpf: '',
  cnpj: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: 'MG',
};

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  submitLabel?: string;
  initial?: Partial<CheckoutFormData>;
}

export function CheckoutForm({ onSubmit, submitLabel, initial }: CheckoutFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<CheckoutFormData>({ ...empty, ...initial });
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aceiteLgpd, setAceiteLgpd] = useState(false);

  const set = (patch: Partial<CheckoutFormData>) => setForm((f) => ({ ...f, ...patch }));

  const buscarCep = async (cep: string) => {
    const masked = maskCep(cep);
    set({ cep: masked });
    if (masked.replace(/\D/g, '').length !== 8) return;
    setBuscandoCep(true);
    try {
      const data = await fetchViaCep(masked);
      if (data) {
        set({
          logradouro: data.logradouro || form.logradouro,
          bairro: data.bairro || form.bairro,
          cidade: data.localidade || form.cidade,
          estado: data.uf || form.estado,
          complemento: data.complemento || form.complemento,
        });
      }
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!aceiteLgpd) {
      setErro(t('lgpd.consentRequired'));
      return;
    }
    setSalvando(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setErro(err instanceof Error ? err.message : t('checkout.error.submit'));
    } finally {
      setSalvando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/20 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

  const label = submitLabel ?? t('shop.submitOrder');

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-primary mb-1">{t('checkout.identification')}</legend>
        <div className="flex gap-2">
          {(['PF', 'PJ'] as const).map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => set({ tipo })}
              className={`flex-1 py-2 rounded-lg text-sm border ${
                form.tipo === tipo
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-card'
              }`}
            >
              {tipo === 'PF' ? t('checkout.pf') : t('checkout.pj')}
            </button>
          ))}
        </div>
        <input
          value={form.nomeCompleto}
          onChange={(e) => set({ nomeCompleto: e.target.value })}
          placeholder={t('checkout.namePlaceholder')}
          className={inputClass}
          required
        />
        {form.tipo === 'PF' ? (
          <input
            value={form.cpf}
            onChange={(e) => set({ cpf: maskCpf(e.target.value) })}
            placeholder={t('checkout.cpf')}
            inputMode="numeric"
            className={inputClass}
            required
          />
        ) : (
          <input
            value={form.cnpj}
            onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })}
            placeholder={t('checkout.cnpj')}
            inputMode="numeric"
            className={inputClass}
            required
          />
        )}
        <input
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder={t('checkout.email')}
          className={inputClass}
          required
        />
        <input
          value={form.telefone}
          onChange={(e) => set({ telefone: maskTelefone(e.target.value) })}
          placeholder={t('checkout.phone')}
          inputMode="tel"
          className={inputClass}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-primary mb-1">{t('checkout.address')}</legend>
        <div className="flex gap-2">
          <input
            value={form.cep}
            onChange={(e) => buscarCep(e.target.value)}
            onBlur={() => buscarCep(form.cep)}
            placeholder={t('checkout.cep')}
            inputMode="numeric"
            className={inputClass + ' flex-1'}
            required
          />
          {buscandoCep && <span className="text-xs self-center text-white/50">…</span>}
        </div>
        <input
          value={form.logradouro}
          onChange={(e) => set({ logradouro: e.target.value })}
          placeholder={t('checkout.street')}
          className={inputClass}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.numero}
            onChange={(e) => set({ numero: e.target.value })}
            placeholder={t('checkout.number')}
            className={inputClass}
            required
          />
          <input
            value={form.complemento}
            onChange={(e) => set({ complemento: e.target.value })}
            placeholder={t('checkout.complement')}
            className={inputClass}
          />
        </div>
        <input
          value={form.bairro}
          onChange={(e) => set({ bairro: e.target.value })}
          placeholder={t('checkout.neighborhood')}
          className={inputClass}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.cidade}
            onChange={(e) => set({ cidade: e.target.value })}
            placeholder={t('checkout.city')}
            className={inputClass}
            required
          />
          <select
            value={form.estado}
            onChange={(e) => set({ estado: e.target.value })}
            className={inputClass}
            required
            aria-label={t('checkout.state')}
          >
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <p className="text-xs text-white/50">{t('checkout.stripeNote')}</p>

      <LgpdConsentCheckbox checked={aceiteLgpd} onChange={setAceiteLgpd} id="checkout-lgpd" className="text-white/70" />

      <button
        type="submit"
        disabled={salvando}
        className="w-full min-h-12 py-3 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-60"
      >
        {salvando ? t('checkout.processing') : label}
      </button>
    </form>
  );
}

export { empty as emptyCheckoutForm };
