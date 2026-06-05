import { useRouter } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";

export function RouteErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-2xl text-primary">
          Não foi possível abrir esta página
        </h1>
        <p className="mt-3 text-foreground/80">
          Tivemos um contratempo ao carregar este conteúdo. Tente novamente em
          instantes.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="min-h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
          >
            Ir para o início
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}

export function RouteNotFoundFallback() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-primary">Página não encontrada</h1>
        <p className="mt-3 text-foreground/80">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <a
          href="/"
          className="mt-6 min-h-11 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-medium px-5 py-2.5 hover:bg-primary/10 transition-colors"
        >
          Ir para o início
        </a>
      </div>
    </PublicLayout>
  );
}
