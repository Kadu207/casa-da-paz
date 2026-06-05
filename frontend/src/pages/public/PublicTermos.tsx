import { PublicLayout } from '../../components/public/PublicLayout';
import { useI18n } from '../../i18n/I18nContext';
import { Link } from 'react-router-dom';

const SECTIONS_PT = [
  {
    title: '1. Aceitação',
    body: 'Ao utilizar o portal público da Casa da Paz, você concorda com estes termos. O agendamento de consultas e a inscrição em eventos não substituem orientação médica ou psicológica convencional.',
  },
  {
    title: '2. Agendamentos',
    body: 'Pedidos feitos pelo formulário público são sujeitos à confirmação pela equipe. O protocolo gerado serve apenas para acompanhamento do status. Dados informados devem ser verdadeiros.',
  },
  {
    title: '3. Eventos e presença',
    body: 'Giras e oficinas seguem regras de convivência do terreiro: vestimenta adequada, respeito ao ambiente sagrado e pontualidade. A Casa da Paz reserva-se o direito de recusar entrada em casos de desrespeito.',
  },
  {
    title: '4. Privacidade',
    body: 'Coletamos nome, telefone e e-mail apenas para contato, confirmação de agendamentos, newsletter (opt-in) e gestão interna. Não vendemos dados. Logs de auditoria registram ações administrativas conforme política interna.',
  },
  {
    title: '5. Newsletter',
    body: 'A inscrição na newsletter é voluntária. Você pode solicitar remoção entrando em contato pelo WhatsApp ou e-mail institucional.',
  },
  {
    title: '6. Contato',
    body: 'Dúvidas sobre estes termos: utilize a página de Contato ou fale conosco presencialmente no endereço indicado no portal.',
  },
];

const SECTIONS_EN = [
  {
    title: '1. Acceptance',
    body: 'By using the Casa da Paz public portal, you agree to these terms. Booking sessions and event registration do not replace conventional medical or psychological care.',
  },
  {
    title: '2. Appointments',
    body: 'Requests submitted through the public form are subject to confirmation by our team. The generated protocol is for status tracking only. Information provided must be accurate.',
  },
  {
    title: '3. Events and attendance',
    body: 'Open circles and workshops follow the terreiro’s guidelines: appropriate dress, respect for the sacred space, and punctuality. Casa da Paz may refuse entry in cases of disrespect.',
  },
  {
    title: '4. Privacy',
    body: 'We collect name, phone and email only for contact, appointment confirmation, newsletter (opt-in) and internal management. We do not sell data. Audit logs record administrative actions per internal policy.',
  },
  {
    title: '5. Newsletter',
    body: 'Newsletter signup is voluntary. You may request removal via WhatsApp or institutional email.',
  },
  {
    title: '6. Contact',
    body: 'Questions about these terms: use the Contact page or visit us at the address shown on the portal.',
  },
];

export default function PublicTermos() {
  const { t, locale } = useI18n();
  const sections = locale === 'en' ? SECTIONS_EN : SECTIONS_PT;

  return (
    <PublicLayout showBack>
      <section className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
        <h1 className="font-serif text-3xl sm:text-4xl text-primary">{t('terms.title')}</h1>
        <p className="mt-2 text-sm text-foreground/75">{t('terms.updated')}</p>

        <article className="mt-8 space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-serif text-lg text-primary">{s.title}</h2>
              <p className="mt-2 text-foreground/85 leading-relaxed">{s.body}</p>
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
