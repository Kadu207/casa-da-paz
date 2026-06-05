import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";
import { SafeImage, buildSrcSet } from "@/components/SafeImage";
import logo from "@/assets/casa-da-paz-logo.png.asset.json";
import heroAfroIndigena from "@/assets/hero-afroindigena.jpg.asset.json";
import pretoVelho from "@/assets/preto-velho.jpg.asset.json";
import atabaque from "@/assets/atabaque.jpg.asset.json";
import iemanja from "@/assets/iemanja.jpg.asset.json";
import ervasOferenda from "@/assets/ervas-oferenda.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Casa da Paz — Terreiro de Umbanda Afro-Indígena" },
      {
        name: "description",
        content:
          "Casa da Paz: espaço de cura, escuta e espiritualidade ancestral em Conselheiro Lafaiete, MG. Tradição Umbanda com respeito à natureza e aos povos originários.",
      },
      { property: "og:title", content: "Casa da Paz — Terreiro de Umbanda Afro-Indígena" },
      {
        property: "og:description",
        content:
          "Espaço de cura, escuta e espiritualidade ancestral em Conselheiro Lafaiete, MG.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
      },
      // Preload da imagem LCP (hero) — acelera o First Contentful / Largest
      // Contentful Paint na home, antes mesmo do JS hidratar.
      {
        rel: "preload",
        as: "image",
        href: heroAfroIndigena.url,
        fetchpriority: "high",
      },
    ],
  }),
  component: HomePage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

const ADDRESS_QUERY =
  "Rua Valério Eugênio, 570 - Areal, Conselheiro Lafaiete - MG";
// Para que o pin do Google Maps apareça rotulado como "Casa da Paz" no
// embed e nos links de busca/navegação, prefixamos o nome do local.
const MAP_QUERY = `Casa da Paz - ${ADDRESS_QUERY}`;
// Coordenadas aproximadas para o Waze (geocodificadas do endereço).
const WAZE_COORDS = "-20.659,-43.788";

function HomePage() {
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    MAP_QUERY
  )}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    MAP_QUERY
  )}&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    MAP_QUERY
  )}`;
  const wazeHref = `https://www.waze.com/ul?ll=${WAZE_COORDS}&navigate=yes&q=${encodeURIComponent(
    ADDRESS_QUERY,
  )}`;



  return (
    <PublicLayout showBack={false}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={heroAfroIndigena.url}
            alt=""
            width={1280}
            height={800}
            loading="eager"
            fetchPriority="high"
            fallbackLabel="Casa da Paz"
            className="h-full w-full object-cover"
            srcSet={buildSrcSet(heroAfroIndigena.url, [640, 960, 1280, 1920])}
            sizes="100vw"
          />

          {/* Véu mais leve para deixar a imagem ancestral em primeiro plano */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 text-center">
          <img
            src={logo.url}
            alt="Logo Casa da Paz"
            width={140}
            height={140}
            className="mx-auto h-28 w-28 sm:h-32 sm:w-32 rounded-full shadow-2xl ring-1 ring-primary/30"
          />
          <h1 className="mt-6 font-serif text-4xl sm:text-5xl text-primary">
            Casa da Paz
          </h1>
          <p className="mt-6 text-base sm:text-lg text-foreground/85 max-w-xl mx-auto leading-relaxed">
            Um ecossistema digital inteligente, responsivo e seguro para fortalecer o
            acolhimento, a gestão e a comunidade afro-indígena.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg">
          <h2 className="font-serif text-2xl text-primary mb-3">Nossa missão</h2>
          <p className="text-foreground/85 leading-relaxed">
            A Casa da Paz é um espaço de cura, escuta e espiritualidade ancestral
            afro-indígena. Carregamos a tradição da Umbanda com respeito profundo
            à natureza, aos povos originários e a cada pessoa que cruza nossa
            porteira em busca de equilíbrio.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <section className="max-w-2xl mx-auto px-4 pb-12">
        <div className="flex flex-col gap-3">
          <Link
            to="/eventos"
            className="min-h-12 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-6 py-3 hover:bg-primary/90 transition-colors shadow"
          >
            Ver próximos eventos
          </Link>
          <Link
            to="/agendar"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 transition-colors"
          >
            Agendar consulta
          </Link>
          <Link
            to="/contato"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-border text-foreground/90 font-medium px-6 py-3 hover:bg-card transition-colors"
          >
            Falar com a Casa
          </Link>
          <Link
            to="/login"
            className="min-h-12 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-6 py-3 hover:bg-primary/10 transition-colors"
          >
            Área interna
          </Link>
        </div>
      </section>

      {/* Tradição — galeria umbandista em destaque */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Nossa Tradição</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Salve a Umbanda
          </h2>
          <p className="mt-3 text-foreground/80 leading-relaxed">
            Pretos velhos, caboclos, orixás e guias da natureza caminham conosco.
            Cada vela acesa, cada batida de atabaque, cada folha sagrada carrega
            séculos de fé, resistência e acolhimento.
          </p>
        </div>

        {/* Bento grid: Iemanjá em destaque (vertical), demais ao redor */}
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 grid-rows-2 gap-3 sm:gap-4 sm:h-[520px]">
          {[
            {
              src: iemanja.url,
              label: "Iemanjá — Mãe das águas",
              w: 1024,
              h: 1024,
              className: "sm:row-span-2 aspect-square sm:aspect-auto",
              sizes: "(min-width: 640px) 33vw, 50vw",
            },
            {
              src: pretoVelho.url,
              label: "Pretos Velhos",
              w: 1024,
              h: 768,
              className: "aspect-square sm:aspect-auto",
              sizes: "(min-width: 640px) 33vw, 50vw",
            },
            {
              src: atabaque.url,
              label: "Atabaques sagrados",
              w: 1024,
              h: 768,
              className: "aspect-square sm:aspect-auto",
              sizes: "(min-width: 640px) 33vw, 50vw",
            },
            {
              src: ervasOferenda.url,
              label: "Ervas e oferendas",
              w: 1024,
              h: 768,
              className: "col-span-2 sm:col-span-2 aspect-[16/9] sm:aspect-auto",
              sizes: "(min-width: 640px) 66vw, 100vw",
            },
          ].map((it) => (
            <li
              key={it.label}
              className={
                "group relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-xl ring-1 ring-primary/10 " +
                it.className
              }
            >
              <SafeImage
                src={it.src}
                alt={it.label}
                width={it.w}
                height={it.h}
                fallbackLabel={it.label}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                srcSet={buildSrcSet(it.src, [320, 640, 960, 1280])}
                sizes={it.sizes}
              />
              {/* Véu sutil só no rodapé, para o título ficar legível sem encobrir a imagem */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
              <span className="absolute bottom-3 left-4 right-4 font-serif text-primary text-base sm:text-lg drop-shadow-lg">
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Address + Map */}
      <section className="max-w-3xl mx-auto px-4 pb-16">

        <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-lg">
          <div className="p-6 sm:p-7">
            <h2 className="font-serif text-2xl text-primary">Onde nos encontrar</h2>
            <p className="mt-2 text-foreground/85 leading-relaxed">
              Rua Valério Eugênio, 570
              <br />
              Bairro Areal — Conselheiro Lafaiete, MG
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                Traçar rota
              </a>
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                Abrir no Google Maps
              </a>
              <a
                href={wazeHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir endereço no Waze"
                className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
              >
                Abrir no Waze
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] sm:aspect-[16/10] w-full bg-background">
            <iframe
              title="Mapa da Casa da Paz"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

