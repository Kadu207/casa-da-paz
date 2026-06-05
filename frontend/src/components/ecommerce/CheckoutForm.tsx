import { useState } from 'react';
import { maskCep, maskCnpj, maskCpf, maskTelefone, UFS } from '../../lib/masks';
import { fetchViaCep } from '../../lib/viacep';

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

export function CheckoutForm({ onSubmit, submitLabel = 'Finalizar pedido', initial }: CheckoutFormProps) {
  const [form, setForm] = useState<CheckoutFormData>({ ...empty, ...initial });
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [salvando, setSalvando] = useState(false);

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
    setSalvando(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar');
    } finally {
      setSalvando(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/20 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {erro && <p className="text-[var(--color-danger)] text-sm">{erro}</p>}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-primary mb-1">Identificação</legend>
        <div className="flex gap-2">
          {(['PF', 'PJ'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ tipo: t })}
              className={`flex-1 py-2 rounded-lg text-sm border ${
                form.tipo === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-card'
              }`}
            >
              {t === 'PF' ? 'Pessoa física (CPF)' : 'Pessoa jurídica (CNPJ)'}
            </button>
          ))}
        </div>
        <input
          value={form.nomeCompleto}
          onChange={(e) => set({ nomeCompleto: e.target.value })}
          placeholder="Nome completo / Razão social"
          className={inputClass}
          required
        />
        {form.tipo === 'PF' ? (
          <input
            value={form.cpf}
            onChange={(e) => set({ cpf: maskCpf(e.target.value) })}
            placeholder="CPF"
            inputMode="numeric"
            className={inputClass}
            required
          />
        ) : (
          <input
            value={form.cnpj}
            onChange={(e) => set({ cnpj: maskCnpj(e.target.value) })}
            placeholder="CNPJ"
            inputMode="numeric"
            className={inputClass}
            required
          />
        )}
        <input
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="E-mail"
          className={inputClass}
          required
        />
        <input
          value={form.telefone}
          onChange={(e) => set({ telefone: maskTelefone(e.target.value) })}
          placeholder="Telefone / WhatsApp"
          inputMode="tel"
          className={inputClass}
        />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-primary mb-1">Endereço de entrega</legend>
        <div className="flex gap-2">
          <input
            value={form.cep}
            onChange={(e) => buscarCep(e.target.value)}
            onBlur={() => buscarCep(form.cep)}
            placeholder="CEP"
            inputMode="numeric"
            className={inputClass + ' flex-1'}
            required
          />
          {buscandoCep && <span className="text-xs self-center text-white/50">…</span>}
        </div>
        <input
          value={form.logradouro}
          onChange={(e) => set({ logradouro: e.target.value })}
          placeholder="Logradouro"
          className={inputClass}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.numero}
            onChange={(e) => set({ numero: e.target.value })}
            placeholder="Número"
            className={inputClass}
            required
          />
          <input
            value={form.complemento}
            onChange={(e) => set({ complemento: e.target.value })}
            placeholder="Complemento"
            className={inputClass}
          />
        </div>
        <input
          value={form.bairro}
          onChange={(e) => set({ bairro: e.target.value })}
          placeholder="Bairro"
          className={inputClass}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.cidade}
            onChange={(e) => set({ cidade: e.target.value })}
            placeholder="Cidade"
            className={inputClass}
            required
          />
          <select
            value={form.estado}
            onChange={(e) => set({ estado: e.target.value })}
            className={inputClass}
            required
          >
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <p className="text-xs text-white/50">
        Pagamento via Stripe em breve. Seu pedido ficará registrado com status pendente até a confirmação.
      </p>

      <button
        type="submit"
        disabled={salvando}
        className="w-full min-h-12 py-3 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-60"
      >
        {salvando ? 'Processando…' : submitLabel}
      </button>
    </form>
  );
}

export { empty as emptyCheckoutForm };
