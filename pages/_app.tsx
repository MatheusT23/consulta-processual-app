import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { CourtProvider } from "@/hooks/use-court";

/**
 * Componente raiz carregado em todas as páginas.
 *
 * Registra o service worker no evento `load` e
 * em seguida renderiza a página solicitada.
 */
export default function App({ Component, pageProps }: AppProps) {
  // Registra o service worker apenas uma vez
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // Tenta registrar o service worker
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Falha no registro é ignorada
        });
      });
    }
  }, []);

  return (
    <CourtProvider>
      <Component {...pageProps} />
    </CourtProvider>
  );
}
