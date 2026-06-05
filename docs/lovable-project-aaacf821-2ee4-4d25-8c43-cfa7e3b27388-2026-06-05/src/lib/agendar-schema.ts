import { z } from "zod";

export const agendarSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo (mínimo 2 letras)")
    .max(120, "Nome muito longo (máximo 120 caracteres)")
    .regex(/^[\p{L}\s'.-]+$/u, "Use apenas letras e espaços"),
  telefone: z
    .string()
    .trim()
    .min(10, "Informe DDD + número (mínimo 10 dígitos)")
    .max(20, "Telefone muito longo")
    .regex(
      /^[0-9()+\-\s]+$/,
      "Use apenas números, espaços, parênteses, + ou -",
    )
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "Telefone precisa de pelo menos 10 dígitos",
    ),
  dataPreferida: z
    .string()
    .min(1, "Escolha uma data")
    .refine((v) => {
      const d = new Date(v + "T00:00:00");
      if (Number.isNaN(d.getTime())) return false;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return d >= hoje;
    }, "A data não pode ser no passado"),
  observacao: z
    .string()
    .trim()
    .max(500, "Máximo de 500 caracteres")
    .optional()
    .or(z.literal("")),
  // Honeypot: deve sempre estar vazio. Bots tendem a preencher todos os campos.
  website: z
    .string()
    .max(0, "Campo inválido")
    .optional()
    .or(z.literal("")),
  // Token do Cloudflare Turnstile (preenchido pelo widget).
  turnstileToken: z
    .string()
    .min(10, "Conclua a verificação anti-spam")
    .max(4096),
});

export type AgendarFormData = z.infer<typeof agendarSchema>;

// Tempo mínimo (ms) entre carregar o formulário e enviá-lo.
// Envios mais rápidos do que isto são tratados como prováveis bots.
export const MIN_FORM_FILL_MS = 1500;
