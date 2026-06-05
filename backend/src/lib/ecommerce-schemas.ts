import { z } from 'zod';
import { formatCnpjStored, formatCpfStored, validarCnpj, validarCpf } from './br-documentos.js';

export const enderecoSchema = z.object({
  cep: z.string().min(8).max(9),
  logradouro: z.string().min(1).max(200),
  numero: z.string().min(1).max(20),
  complemento: z.string().max(100).optional(),
  bairro: z.string().min(1).max(100),
  cidade: z.string().min(1).max(100),
  estado: z.string().length(2),
});

export const clienteCheckoutSchema = z
  .object({
    tipo: z.enum(['PF', 'PJ']),
    nomeCompleto: z.string().min(3).max(150),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    email: z.string().email().max(150),
    telefone: z.string().max(20).optional(),
  })
  .merge(enderecoSchema)
  .superRefine((data, ctx) => {
    if (data.tipo === 'PF') {
      if (!data.cpf || !validarCpf(data.cpf)) {
        ctx.addIssue({ code: 'custom', message: 'CPF inválido', path: ['cpf'] });
      }
    } else if (!data.cnpj || !validarCnpj(data.cnpj)) {
      ctx.addIssue({ code: 'custom', message: 'CNPJ inválido', path: ['cnpj'] });
    }
  });

export type ClienteCheckoutInput = z.infer<typeof clienteCheckoutSchema>;

export function normalizeClienteData(data: ClienteCheckoutInput) {
  return {
    tipo: data.tipo,
    nomeCompleto: data.nomeCompleto.trim(),
    cpf: data.tipo === 'PF' ? formatCpfStored(data.cpf!) : null,
    cnpj: data.tipo === 'PJ' ? formatCnpjStored(data.cnpj!) : null,
    email: data.email.trim().toLowerCase(),
    telefone: data.telefone?.trim() || null,
    cep: data.cep.replace(/\D/g, ''),
    logradouro: data.logradouro.trim(),
    numero: data.numero.trim(),
    complemento: data.complemento?.trim() || null,
    bairro: data.bairro.trim(),
    cidade: data.cidade.trim(),
    estado: data.estado.trim().toUpperCase(),
  };
}

export const clienteAdminSchema = clienteCheckoutSchema;

export const pedidoItemSchema = z.object({
  produtoId: z.number().int().positive(),
  quantidade: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  cliente: clienteCheckoutSchema,
  itens: z.array(pedidoItemSchema).min(1),
});
