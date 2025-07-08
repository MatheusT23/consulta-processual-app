import { Html, Head, Main, NextScript } from "next/document";

/** Documento base utilizado pelo Next.js. */

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Configurações de PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2a365e" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
