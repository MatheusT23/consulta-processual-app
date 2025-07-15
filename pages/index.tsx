import Head from 'next/head'
import Link from 'next/link'
import { Search, Eye, Folder } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Head>
        <title>Consulta Processual</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500&display=swap" rel="stylesheet" />
      </Head>
      <div className="flex flex-col min-h-screen font-sans" style={{ fontFamily: 'Manrope, sans-serif' }}>
        <header className="bg-[#2a365e] text-white">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <img src="/next.svg" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">Consulta Processual</span>
            </div>
            <Link
              href="/consulta"
              className="bg-white text-[#2a365e] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              <Search className="md:hidden size-5" />
              <span className="hidden md:inline">Consultar Processo</span>
            </Link>
          </div>
        </header>
        <main className="flex-1">
          <section className="bg-gray-50 text-center py-20 px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Acompanhe seus processos em um só lugar</h1>
            <p className="text-lg md:text-xl mb-8">Facilitamos a consulta processual em diversos tribunais de forma rápida e simples.</p>
            <Link href="/consulta" className="inline-block bg-[#2a365e] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1e294a]">
              Começar agora
            </Link>
          </section>
          <section className="container mx-auto py-16 px-4 space-y-12">
            <h2 className="text-3xl font-bold text-center">Como funciona</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center p-4">
                <Search className="mx-auto mb-2 size-8 text-[#2a365e]" />
                <h3 className="text-xl font-semibold mb-2">1. Pesquise</h3>
                <p>Informe o número do processo que deseja acompanhar.</p>
              </div>
              <div className="text-center p-4">
                <Eye className="mx-auto mb-2 size-8 text-[#2a365e]" />
                <h3 className="text-xl font-semibold mb-2">2. Acompanhe</h3>
                <p>Receba um resumo dos últimos andamentos de forma clara.</p>
              </div>
              <div className="text-center p-4">
                <Folder className="mx-auto mb-2 size-8 text-[#2a365e]" />
                <h3 className="text-xl font-semibold mb-2">3. Organize</h3>
                <p>Mantenha todos os seus processos reunidos para consulta rápida.</p>
              </div>
            </div>
          </section>
          <section className="bg-gray-50 py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-10">Planos</h2>
            <div className="container mx-auto grid gap-8 md:grid-cols-3">
              <div className="border rounded-lg p-6 text-center flex flex-col">
                <h3 className="text-xl font-semibold mb-4">Grátis</h3>
                <p className="text-4xl font-bold mb-4">R$0</p>
                <ul className="list-disc list-inside text-left flex-1">
                  <li>Consultas limitadas</li>
                  <li>Acesso ao chat</li>
                </ul>
                <Link href="/consulta" className="mt-6 block bg-[#2a365e] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#1e294a]">
                  Usar grátis
                </Link>
              </div>
              <div className="border rounded-lg p-6 text-center flex flex-col">
                <h3 className="text-xl font-semibold mb-4">Profissional</h3>
                <p className="text-4xl font-bold mb-4">R$29<span className="text-base font-normal">/mês</span></p>
                <ul className="list-disc list-inside text-left flex-1">
                  <li>Consultas ilimitadas</li>
                  <li>Notificações de novos andamentos</li>
                  <li>Suporte prioritário</li>
                </ul>
                <a href="#" className="mt-6 block bg-[#2a365e] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#1e294a]">Assinar</a>
              </div>
              <div className="border rounded-lg p-6 text-center flex flex-col">
                <h3 className="text-xl font-semibold mb-4">Empresarial</h3>
                <p className="text-4xl font-bold mb-4">R$79<span className="text-base font-normal">/mês</span></p>
                <ul className="list-disc list-inside text-left flex-1">
                  <li>Integração via API</li>
                  <li>Equipe colaborativa</li>
                  <li>Relatórios completos</li>
                </ul>
                <a href="#" className="mt-6 block bg-[#2a365e] text-white px-4 py-2 rounded-md font-semibold hover:bg-[#1e294a]">Falar com vendas</a>
              </div>
            </div>
          </section>
          <section className="container mx-auto py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Dúvidas Frequentes</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="font-semibold">Como faço para consultar um processo?</h3>
                <p>É só acessar a página de consulta e informar o número completo do processo.</p>
              </div>
              <div>
                <h3 className="font-semibold">Quais tribunais são suportados?</h3>
                <p>Atualmente trabalhamos com os principais tribunais federais e trabalhistas, expandindo constantemente.</p>
              </div>
              <div>
                <h3 className="font-semibold">Posso cancelar quando quiser?</h3>
                <p>Sim. Você pode cancelar sua assinatura a qualquer momento sem multas.</p>
              </div>
            </div>
          </section>
          <section className="bg-[#2a365e] text-white text-center py-16 px-4">
            <h2 className="text-3xl font-bold mb-6">Pronto para começar?</h2>
            <Link href="/consulta" className="inline-block bg-white text-[#2a365e] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Consultar Processo
            </Link>
          </section>
        </main>
        <footer className="py-6 text-center text-sm text-gray-500">© 2024 Consulta Processual</footer>
      </div>
    </>
  )
}
