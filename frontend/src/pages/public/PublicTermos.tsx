import { PublicLayout } from '../../components/public/PublicLayout';
import { useI18n } from '../../i18n/I18nContext';
import { Link } from 'react-router-dom';
import { LGPD_POLICY_VERSION } from '../../lib/lgpd';

type Section = { title: string; body: string; list?: string[] };

const SECTIONS_PT: Section[] = [
  {
    title: '1. Sobre este portal',
    body: 'O portal Casa da Paz é mantido pela comunidade de terreiro afro-indígena Casa da Paz, em Conselheiro Lafaiete (MG), para divulgar atividades, eventos, agendamentos e canais de contato abertos à comunidade.',
  },
  {
    title: '2. Termos de uso',
    body: 'O acesso é livre e gratuito. O conteúdo tem caráter informativo e religioso, e não substitui acompanhamento médico, psicológico ou jurídico. Pedimos respeito à tradição, à comunidade e às pessoas que frequentam a Casa.',
  },
  {
    title: '3. Agendamentos e eventos',
    body: 'Pedidos pelo formulário público dependem de confirmação pela equipe. Giras e oficinas seguem regras de convivência do terreiro. A Casa da Paz reserva-se o direito de recusar entrada em casos de desrespeito.',
  },
  {
    title: '4. Dados pessoais que coletamos',
    body: 'Coletamos apenas dados que você nos envia voluntariamente:',
    list: [
      'Nome, telefone/WhatsApp e e-mail',
      'Data preferida e observações em agendamentos',
      'Dados de identificação e endereço em pedidos da livraria (CPF/CNPJ)',
      'E-mail na newsletter (opt-in)',
    ],
  },
  {
    title: '5. Finalidade e base legal (LGPD)',
    body: 'Usamos seus dados para retornar contato, confirmar agendamentos, processar pedidos, enviar novidades (quando autorizado) e registro interno. O tratamento baseia-se no consentimento (art. 7º, I) e no legítimo interesse da Casa em manter contato com a comunidade (art. 7º, IX), conforme a Lei 13.709/2018.',
  },
  {
    title: '6. Seus direitos',
    body: 'Você pode solicitar a qualquer momento:',
    list: [
      'Confirmação da existência de tratamento e acesso aos dados',
      'Correção de dados incompletos ou desatualizados',
      'Anonimização, bloqueio ou eliminação de dados desnecessários',
      'Revogação do consentimento',
      'Informação sobre compartilhamento com terceiros',
    ],
  },
  {
    title: '7. Compartilhamento',
    body: 'Não vendemos dados. Podemos usar processadores (hospedagem, e-mail, pagamentos Stripe quando ativo, automação N8N) apenas para operar o serviço, sob contratos que exigem proteção equivalente à LGPD.',
  },
  {
    title: '8. Cookies e armazenamento local',
    body: 'Não usamos cookies de rastreamento publicitário. Podem existir cookies técnicos (Cloudflare Turnstile, sessão de login no ERP) e preferências salvas no navegador (idioma, consentimento de cookies).',
  },
  {
    title: '9. Retenção e segurança',
    body: 'Mantemos dados pelo tempo necessário às finalidades descritas ou exigências legais. Aplicamos controle de acesso (RBAC), auditoria administrativa e comunicação criptografada (HTTPS) na produção.',
  },
  {
    title: '10. Encarregado / contato',
    body: 'Para exercer seus direitos ou dúvidas sobre privacidade: utilize a página de Contato, WhatsApp institucional ou presencialmente em Rua Valério Eugênio, 570 — Bairro Areal, Conselheiro Lafaiete — MG.',
  },
  {
    title: '11. Alterações',
    body: 'Esta política pode ser atualizada. A versão vigente e a data abaixo indicam a revisão aplicável aos novos consentimentos.',
  },
];

const SECTIONS_EN: Section[] = [
  {
    title: '1. About this portal',
    body: 'The Casa da Paz portal is maintained by the Casa da Paz Afro-Indigenous terreiro community in Conselheiro Lafaiete (MG) to share activities, events, appointments and public contact channels.',
  },
  {
    title: '2. Terms of use',
    body: 'Access is free. Content is informational and religious in nature and does not replace medical, psychological or legal care. We ask for respect for the tradition, the community and everyone who visits.',
  },
  {
    title: '3. Appointments and events',
    body: 'Public form requests require team confirmation. Open circles and workshops follow terreiro guidelines. Casa da Paz may refuse entry in cases of disrespect.',
  },
  {
    title: '4. Personal data we collect',
    body: 'We only collect data you voluntarily provide:',
    list: [
      'Name, phone/WhatsApp and email',
      'Preferred date and notes for appointments',
      'Identification and address for shop orders (CPF/CNPJ)',
      'Email for newsletter (opt-in)',
    ],
  },
  {
    title: '5. Purpose and legal basis (LGPD)',
    body: 'We use your data to respond, confirm appointments, process orders, send updates (when authorized) and for internal records. Processing is based on consent (Art. 7, I) and legitimate interest in community contact (Art. 7, IX), under Brazilian Law 13.709/2018.',
  },
  {
    title: '6. Your rights',
    body: 'You may request at any time:',
    list: [
      'Confirmation of processing and access to your data',
      'Correction of incomplete or outdated data',
      'Anonymization, blocking or deletion of unnecessary data',
      'Withdrawal of consent',
      'Information on sharing with third parties',
    ],
  },
  {
    title: '7. Sharing',
    body: 'We do not sell data. We may use processors (hosting, email, Stripe when enabled, N8N automation) solely to operate the service, under agreements requiring LGPD-equivalent protection.',
  },
  {
    title: '8. Cookies and local storage',
    body: 'We do not use advertising tracking cookies. Technical cookies (Cloudflare Turnstile, ERP login session) and browser preferences (language, cookie consent) may apply.',
  },
  {
    title: '9. Retention and security',
    body: 'We retain data as long as needed for the purposes above or legal requirements. We apply access control (RBAC), administrative audit logs and encrypted communication (HTTPS) in production.',
  },
  {
    title: '10. Contact',
    body: 'To exercise your rights or ask about privacy: use the Contact page, institutional WhatsApp or visit us at Rua Valério Eugênio, 570 — Bairro Areal, Conselheiro Lafaiete — MG.',
  },
  {
    title: '11. Changes',
    body: 'This policy may be updated. The version and date below indicate the revision applicable to new consents.',
  },
];

export default function PublicTermos() {
  const { t, locale } = useI18n();
  const sections = locale === 'en' ? SECTIONS_EN : SECTIONS_PT;

  return (
    <PublicLayout showBack>
      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('terms.title')}</h1>
        <p className="mt-2 text-sm text-foreground/75">
          {t('terms.updated')} · {t('terms.version', { version: LGPD_POLICY_VERSION })}
        </p>

        <article className="mt-8 space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-serif text-lg text-primary">{s.title}</h2>
              <p className="mt-2 text-foreground/85 leading-relaxed">{s.body}</p>
              {s.list && (
                <ul className="mt-2 list-disc pl-5 space-y-1 text-foreground/85">
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </article>

        <p className="mt-10 text-sm text-foreground/70">
          <Link to="/public/agendar" className="text-primary hover:underline">
            {t('nav.schedule')}
          </Link>
          {' · '}
          <Link to="/public/contato" className="text-primary hover:underline">
            {t('nav.contact')}
          </Link>
        </p>
      </section>
    </PublicLayout>
  );
}
