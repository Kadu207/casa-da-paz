import { PublicLayout } from '../../components/public/PublicLayout';
import { SafeImage } from '../../components/public/SafeImage';
import { ADDRESS, WHATSAPP_NUMBER, portalAssets } from '../../lib/portal-assets';

const CHATWOOT_WEBSITE_TOKEN = import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN;

export default function PublicContato() {
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Olá! Gostaria de falar com a Casa da Paz.',
  )}`;

  return (
    <PublicLayout>
      <section className="relative h-40 sm:h-52 overflow-hidden">
        <SafeImage
          src={portalAssets.bannerLandscape}
          alt=""
          width={1536}
          height={768}
          fallbackLabel="Paisagem"
          className="cover-fill"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">Contato</h1>
            <p className="text-foreground/75 text-sm mt-1">Estamos à sua escuta</p>
          </div>
        </div>
      </section>

      <section className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-primary text-primary-foreground p-5 sm:p-6 shadow-lg hover:bg-primary/90 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/15 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <p className="font-serif text-xl">WhatsApp</p>
              <p className="text-sm opacity-90">Toque para abrir uma conversa</p>
            </div>
          </div>
        </a>

        <a
          href="https://instagram.com/umbandacasadapaz"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-card border border-border/60 p-5 sm:p-6 hover:border-primary/40 transition-colors"
        >
          <p className="font-serif text-lg text-primary">Instagram</p>
          <p className="text-foreground/80">@umbandacasadapaz</p>
        </a>

        <a
          href="mailto:terreirocasadapaz@gmail.com"
          className="block rounded-2xl bg-card border border-border/60 p-5 sm:p-6 hover:border-primary/40 transition-colors"
        >
          <p className="font-serif text-lg text-primary">E-mail</p>
          <p className="text-foreground/80">terreirocasadapaz@gmail.com</p>
        </a>

        <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
          <p className="font-serif text-lg text-primary mb-2">Onde estamos</p>
          <p className="text-foreground/85">
            {ADDRESS.line1}
            <br />
            {ADDRESS.line2}
          </p>
        </div>

        {CHATWOOT_WEBSITE_TOKEN ? (
          <p className="text-xs text-foreground/55 text-center">Chat online disponível em produção.</p>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-5 sm:p-6 text-sm text-foreground/55 text-center">
            Chat ao vivo em breve.
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
