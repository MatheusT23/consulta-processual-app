import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

/**
 * Componente raiz da aplicação carregado em todas as páginas.
 *
 * Registra o service worker no evento `load` e em seguida
 * renderiza o componente solicitado.
 */
export default function App({ Component, pageProps }: AppProps) {
  // Registra o service worker apenas uma vez
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // falha ao registrar
        });
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
