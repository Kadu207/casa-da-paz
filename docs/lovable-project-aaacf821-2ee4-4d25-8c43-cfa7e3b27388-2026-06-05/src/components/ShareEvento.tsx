import { useState } from "react";

type Props = {
  title: string;
  text: string;
  path: string; // e.g. "/eventos/abc"
};

export function ShareEvento({ title, text, path }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? new URL(path, window.location.origin).toString()
      : path;

  const waMessage = `${text}\n${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url,
  )}&quote=${encodeURIComponent(title)}`;

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const base =
    "min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-border text-foreground font-medium px-4 py-2.5 text-sm hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-colors";

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Compartilhar este evento"
    >
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        aria-label="Compartilhar no WhatsApp"
      >
        WhatsApp
      </a>
      <a
        href={facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
        aria-label="Compartilhar no Facebook"
      >
        Facebook
      </a>
      <button type="button" onClick={copyLink} className={base} aria-live="polite">
        {copied ? "Link copiado ✓" : "Copiar link"}
      </button>
    </div>
  );
}
