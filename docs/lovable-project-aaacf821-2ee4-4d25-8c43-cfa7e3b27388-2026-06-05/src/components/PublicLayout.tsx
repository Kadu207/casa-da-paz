import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/casa-da-paz-logo.png.asset.json";

export function PublicLayout({
  children,
  showBack = true,
}: {
  children: ReactNode;
  showBack?: boolean;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border/50 bg-background/85 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Ir para a página inicial da Casa da Paz"
          >
            <img
              src={logo.url}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
            <span className="font-serif text-lg text-primary">Casa da Paz</span>
          </Link>
          {showBack && (
            <Link
              to="/"
              className="text-sm text-foreground/85 hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md min-h-11 px-2 flex items-center transition-colors"
            >
              ← Início
            </Link>
          )}
        </div>
      </header>
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-foreground/80">
          <div className="grid gap-6 sm:grid-cols-3 text-center sm:text-left">
            <div>
              <p className="font-serif text-primary text-base">Casa da Paz</p>
              <p className="mt-1 text-foreground/75">
                Rua Valério Eugênio, 570
                <br />
                Areal, Conselheiro Lafaiete — MG
              </p>
            </div>
            <nav aria-label="Rodapé" className="space-y-1.5">
              <p className="font-serif text-primary text-base mb-1">Navegar</p>
              <Link to="/" className="block hover:text-primary focus-visible:text-primary">
                Início
              </Link>
              <Link to="/eventos" className="block hover:text-primary focus-visible:text-primary">
                Eventos
              </Link>
              <Link to="/agendar" className="block hover:text-primary focus-visible:text-primary">
                Agendar consulta
              </Link>
              <Link to="/contato" className="block hover:text-primary focus-visible:text-primary">
                Contato
              </Link>
            </nav>
            <div className="space-y-1.5">
              <p className="font-serif text-primary text-base mb-1">Institucional</p>
              <Link to="/login" className="block hover:text-primary focus-visible:text-primary">
                Sobre a Casa
              </Link>
              <Link to="/termos" className="block hover:text-primary focus-visible:text-primary">
                Termos e Privacidade
              </Link>
              <Link to="/health" className="block hover:text-primary focus-visible:text-primary">
                Status do portal
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-foreground/65">
            Comunidade de Terreiro Afro-Indígena · Tradição Umbanda · ©{" "}
            {new Date().getFullYear()} Casa da Paz
          </p>
        </div>
      </footer>
    </div>
  );
}
