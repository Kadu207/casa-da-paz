import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import bannerLandscape from "@/assets/banner-landscape.jpg";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Casa da Paz" },
      {
        name: "description",
        content:
          "Fale com a Casa da Paz pelo WhatsApp ou Instagram. Conselheiro Lafaiete, MG.",
      },
      { property: "og:title", content: "Contato — Casa da Paz" },
      {
        property: "og:description",
        content: "Fale com a Casa pelo WhatsApp ou Instagram.",
      },
    ],
  }),
  component: ContatoPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function ContatoPage() {
  const whatsapp = "https://wa.me/5531900000000?text=" +
    encodeURIComponent("Olá! Gostaria de falar com a Casa da Paz.");

  return (
    <PublicLayout>
      <section className="relative h-40 sm:h-52 overflow-hidden">
        <img
          src={bannerLandscape}
          alt=""
          width={1536}
          height={768}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 to-background" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-3xl mx-auto w-full px-4 pb-5">
            <h1 className="font-serif text-3xl sm:text-4xl text-primary">
              Contato
            </h1>
            <p className="text-foreground/75 text-sm mt-1">
              Estamos à sua escuta
            </p>
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

        <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-6">
          <p className="font-serif text-lg text-primary mb-2">Onde estamos</p>
          <p className="text-foreground/85">
            Conselheiro Lafaiete · MG
            <br />
            Bairro Areal
          </p>
        </div>

        {/* Placeholder Chatwoot — substituir pelo script real quando o token Meta estiver disponível */}
        <div className="rounded-2xl border border-dashed border-border/60 p-5 sm:p-6 text-sm text-foreground/55 text-center">
          Chat ao vivo em breve.
        </div>
      </section>
    </PublicLayout>
  );
}
