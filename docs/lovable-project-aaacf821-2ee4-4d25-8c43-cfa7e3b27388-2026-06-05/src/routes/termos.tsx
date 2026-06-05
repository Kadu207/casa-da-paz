import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { RouteErrorFallback, RouteNotFoundFallback } from "@/components/RouteFallbacks";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso e Privacidade — Casa da Paz" },
      {
        name: "description",
        content:
          "Termos de uso e política de privacidade do portal Casa da Paz, em Conselheiro Lafaiete, MG.",
      },
      { property: "og:title", content: "Termos e Privacidade — Casa da Paz" },
      {
        property: "og:description",
        content: "Como usamos as informações compartilhadas no portal Casa da Paz.",
      },
      { property: "og:url", content: "/termos" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/termos" }],
  }),
  component: TermosPage,
  errorComponent: RouteErrorFallback,
  notFoundComponent: RouteNotFoundFallback,
});

function TermosPage() {
  return (
    <PublicLayout>
      <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14 prose-invert">
        <header>
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary/85">
            Documento legal
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl text-primary">
            Termos de Uso e Política de Privacidade
          </h1>
          <p className="mt-3 text-sm text-foreground/75">
            Última atualização: junho de 2026
          </p>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">1. Sobre este portal</h2>
          <p className="text-foreground/90 leading-relaxed">
            O portal Casa da Paz é mantido pela comunidade de terreiro
            afro-indígena Casa da Paz, em Conselheiro Lafaiete (MG), com a
            finalidade de divulgar atividades, eventos e canais de contato
            abertos à comunidade.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">2. Uso do portal</h2>
          <p className="text-foreground/90 leading-relaxed">
            O acesso é livre e gratuito. O conteúdo aqui publicado tem caráter
            informativo e religioso, e não substitui acompanhamento médico,
            psicológico ou jurídico.
          </p>
          <p className="text-foreground/90 leading-relaxed">
            Pedimos respeito à tradição, à comunidade e às pessoas que
            frequentam a Casa.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">
            3. Dados pessoais que coletamos
          </h2>
          <p className="text-foreground/90 leading-relaxed">
            Coletamos apenas os dados que você nos envia voluntariamente pelo
            formulário de agendamento ou pelos canais de contato:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
            <li>Nome</li>
            <li>Telefone / WhatsApp</li>
            <li>Data preferida para atendimento</li>
            <li>Observação que você optar por compartilhar</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">
            4. Como usamos seus dados
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
            <li>Para retornar o contato e confirmar agendamentos.</li>
            <li>Para informar sobre giras, oficinas e eventos da Casa.</li>
            <li>Para registro interno de presença, quando aplicável.</li>
          </ul>
          <p className="text-foreground/90 leading-relaxed">
            Não vendemos, alugamos ou compartilhamos seus dados com terceiros
            para fins comerciais.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">
            5. Base legal (LGPD)
          </h2>
          <p className="text-foreground/90 leading-relaxed">
            O tratamento de dados se baseia no seu consentimento ao enviar um
            formulário e no legítimo interesse da Casa em manter contato com a
            comunidade, conforme a Lei Geral de Proteção de Dados (Lei
            13.709/2018).
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">6. Seus direitos</h2>
          <p className="text-foreground/90 leading-relaxed">
            Você pode, a qualquer momento, solicitar:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-foreground/90">
            <li>Acesso aos dados que mantemos sobre você;</li>
            <li>Correção de dados incorretos;</li>
            <li>Exclusão dos seus dados de nossos registros;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p className="text-foreground/90 leading-relaxed">
            Para isso, fale conosco pelo WhatsApp na página de{" "}
            <a href="/contato" className="text-primary underline">
              contato
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">7. Cookies</h2>
          <p className="text-foreground/90 leading-relaxed">
            Este portal não utiliza cookies de rastreamento publicitário.
            Podem existir cookies técnicos estritamente necessários para o
            funcionamento da página.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">8. Alterações</h2>
          <p className="text-foreground/90 leading-relaxed">
            Estes termos podem ser atualizados a qualquer momento. A data no
            topo desta página indica a última revisão.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-serif text-2xl text-primary">9. Contato</h2>
          <p className="text-foreground/90 leading-relaxed">
            Casa da Paz — Rua Valério Eugênio, 570, Bairro Areal, Conselheiro
            Lafaiete — MG.
          </p>
        </section>
      </article>
    </PublicLayout>
  );
}
