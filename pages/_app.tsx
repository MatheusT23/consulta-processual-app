import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

/**
 * Root application component loaded for every page.
 *
 * Registers the service worker on the `load` event and
 * then renders the requested page component.
 */
export default function App({ Component, pageProps }: AppProps) {
  // Register service worker once on mount
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // registration failed
        });
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
