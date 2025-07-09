import Link from 'next/link';
import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import TurnstileWidget from '@/components/turnstile-widget'
import { Bot, User, Send, Mic, Search, Cpu } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'

/**
 * Página principal do chat. Gerencia o estado da conversa
 * e realiza chamadas às rotas de API.
 */
export default function App() {


  // Guarda as mensagens trocadas no chat
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);

  // Valor atual do campo de entrada
  const [inputValue, setInputValue] = useState('');
  // Indica se o bot está processando
  const [isLoading, setIsLoading] = useState(false);
  // Tribunal selecionado pelo usuário
  const [court, setCourt] = useState('TRF2');
  const [captchaToken, setCaptchaToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Referência para rolar o chat automaticamente
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Garante que as mensagens iniciais sejam exibidas uma única vez
  const typingInitialized = useRef(false);

  // Role até o final quando surgirem novas mensagens
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setCaptchaToken('');
    setResult(null);
    setErrorMsg('');
  }, [court]);

  // Efeito de digitação das mensagens iniciais do bot
  // useEffect(() => {
  //   if (typingInitialized.current) return;
  //   typingInitialized.current = true;
  //
  //   const botMessages = [
  //     'Olá, seja bem vindo',
  //     'Para que eu possa te atualizar sobre o andamento, por favor digite o número do processo.'
  //   ];
  //
  //   let messageIndex = 0;
  //   let interval: NodeJS.Timeout;
  //
  //   const typeNextMessage = () => {
  //     const text = botMessages[messageIndex];
  //     let charIndex = 0;
  //     let currentIndex = 0;
  //
  //     setMessages((prev) => {
  //       currentIndex = prev.length;
  //       return [...prev, { sender: 'bot', text: '' }];
  //     });
  //
  //     interval = setInterval(() => {
  //       charIndex += 1;
  //       setMessages((prev) => {
  //         const newMessages = [...prev];
  //         newMessages[currentIndex] = {
  //           ...newMessages[currentIndex],
  //           text: text.slice(0, charIndex),
  //         };
  //         return newMessages;
  //       });
  //
  //       if (charIndex === text.length) {
  //         clearInterval(interval);
  //         messageIndex += 1;
  //         if (messageIndex < botMessages.length) {
  //           setTimeout(() => {
  //             typeNextMessage();
  //           }, 300);
  //         }
  //       }
  //     }, 15);
  //   };
  //
  //   // Inicia a digitação da primeira mensagem
  //   typeNextMessage();
  //
  //   return () => clearInterval(interval);
  // }, []);
  
  // Mensagens iniciais sem animação
  useEffect(() => {
    if (typingInitialized.current) return;
    typingInitialized.current = true;
    setMessages([
      { sender: 'bot', text: 'Olá, seja bem vindo' },
      {
        sender: 'bot',
        text:
          'Para que eu possa te atualizar sobre o andamento, por favor digite o número do processo.'
      }
    ]);
  }, []);

  /**
   * Anima a digitação de uma mensagem do bot.
   *
   * @param text - Texto que deve aparecer no chat.
   */
  const typeBotMessage = (text: string) => {
    // Efeito de digitação desativado temporariamente
    // let charIndex = 0;
    // let currentIndex = 0;
    //
    // setMessages((prev) => {
    //   currentIndex = prev.length;
    //   return [...prev, { sender: 'bot', text: '' }];
    // });
    //
    // const interval = setInterval(() => {
    //   charIndex += 1;
    //   setMessages((prev) => {
    //     const newMessages = [...prev];
    //     newMessages[currentIndex] = {
    //       ...newMessages[currentIndex],
    //       text: text.slice(0, charIndex),
    //     };
    //     return newMessages;
    //   });
    //
    //   if (charIndex === text.length) {
    //     clearInterval(interval);
    //     setIsLoading(false);
    //   }
    // }, 5);

    setMessages((prev) => [...prev, { sender: 'bot', text }]);
    setIsLoading(false);
  };

  // --- Manipuladores de eventos ---

  /**
   * Envia o texto digitado para a API e adiciona a resposta ao chat.
   *
   * @returns Promessa resolvida ao final do ciclo de mensagem.
   */
  const handleSendMessage = async (): Promise<void> => {
    const trimmedInput = inputValue.trim();
    if (isLoading) return;

    if (court === 'TRF2-Eproc') {
      const newUserMessage = { sender: 'user', text: trimmedInput };
      setMessages((prev) => [...prev, newUserMessage]);
      setInputValue('');
      setIsLoading(true);
      try {
        const res = await fetch('/api/trf2/eproc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numeroProcesso: trimmedInput }),
        });
        if (!res.ok) throw new Error('Erro ao consultar o processo');
        const data = await res.json();
        const msg = data.resumo ?? JSON.stringify(data, null, 2);
        typeBotMessage(msg);
      } catch (error) {
        typeBotMessage(`Erro: ${(error as Error).message}`);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (court === 'TRF2-Captcha') {
      setInputValue('');
      setIsLoading(true);
      setErrorMsg('');
      setResult(null);
      try {
        const res = await fetch('/api/trf2/captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numeroProcesso: trimmedInput, token: captchaToken }),
        });
        if (!res.ok) throw new Error('Erro ao consultar o processo');
        const data = await res.json();
        setResult(data);
      } catch (error) {
        setErrorMsg((error as Error).message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (trimmedInput === '') return;

    const newUserMessage = { sender: 'user', text: trimmedInput };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroProcesso: trimmedInput, tribunal: court }),
      });

      if (!res.ok) {
        throw new Error('Erro ao consultar a API');
      }

      const data = await res.json();
      const message = data.summary ?? JSON.stringify(data, null, 2);
      typeBotMessage(message);
    } catch (error) {
      typeBotMessage(`Erro: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Captura a tecla "Enter" para enviar a mensagem sem quebrar linha.
   *
   * @param event - Evento de teclado disparado pelo campo de texto.
   */
  const handleKeyPress = (
    event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Evita quebra de linha ao pressionar Enter
      handleSendMessage();
    }
  };

  // --- Renderização ---

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div
            className="flex flex-col safe-h-screen bg-[#fff] text-blue font-sans font-medium"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
      {/* Cabeçalho */}
      <header className="bg-[#2a365e] text-white flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="p-2 rounded-md hover:bg-gray-700/50 transition-colors" />
          <h1 className="text-2xl font-bold font-sans">Acompanhar Processo</h1>
        </div>
        <div className="flex items-center gap-2">
          {/*
           <Link
             href="/login"
             className="bg-[#2a365e] text-white px-4 py-2 text-sm font-semibold rounded-[0.75rem] shadow-md hover:opacity-90 transition-colors"
           >
            Entrar
           </Link>
          */}
          {/*<button className="p-2 rounded-md hover:bg-gray-700/50 transition-colors">
            <Bot size={20} />
          </button>*/}
        </div>
      </header>

      {/* Área das mensagens */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end text-white' : ''}`}>
              {/* Ícone do bot ou do usuário */}
              {message.sender === 'bot' && (
                <div className="w-8 h-8 flex-shrink-0 bg-black rounded-full flex items-center justify-center text-white">
                  <Bot size={20} />
                </div>
              )}

              {/* Balão de mensagem */}
              <div
                className={`max-w-xl p-4 rounded-2xl shadow ${
                  message.sender === 'user'
                    ? 'bg-[#2a365e] rounded-br-lg'
                    : 'bg-gray-800/60 rounded-bl-lg'
                }`}
              >
                  <p className="whitespace-pre-wrap text-white text-[1.15rem]">{message.text}</p>
              </div>
              
               {message.sender === 'user' && (
                <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {/* Indicador de carregamento */}
          {isLoading && (
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="max-w-xl p-4 rounded-2xl bg-gray-800/60 rounded-bl-lg flex items-center space-x-2 shadow">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></span>
                </div>
             </div>
          )}
          {/* Div vazia para garantir rolagem até o final */}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Rodapé com campo de entrada */}
      
      <footer
        className="w-full p-6 md:p-6 flex-shrink-0 bg-[#2a365e] rounded-t-[1.05rem] shadow-2xl"
      >
        <div className="max-w-3xl mx-auto">
           {/* Botões de ação */}
          {/*<div className="flex items-center gap-2 mb-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                <Cpu size={16} /> Processo
            </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                <Search size={16} /> Search
            </button>
          </div>*/}
        
          {/* Seletor de tribunal */}
          <div className="mb-2">
            <label htmlFor="court" className="mr-2 text-white">Tribunal:</label>
            <select
              id="court"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="rounded-md text-white bg-[#2a365e]"
            >
              <option value="TRF2">TRF2</option>
              <option value="TRF2-Eproc">TRF2 - Eproc</option>
          <option value="TRF2-Captcha">TRF2 - Captcha</option>
          <option value="TRT1">TRT1</option>
        </select>
      </div>

      {court === 'TRF2-Captcha' && (
        <div className="mb-3">
          <TurnstileWidget
            siteKey={String(process.env.NEXT_PUBLIC_CF_SITE_KEY ?? '')}
            onSuccess={(t) => setCaptchaToken(t)}
            onExpired={() => setCaptchaToken('')}
          />
        </div>
      )}


          {/* Área de texto para entrada do número */}
          <div className="relative flex items-center mb-3 p-2 bg-[#2a365e] border border-white rounded-2xl">
            <textarea
              value={inputValue}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, '');
                setInputValue(onlyNumbers);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite o Número do Processo..."
              rows={1}
              className="flex-1 bg-transparent p-2 resize-none outline-none placeholder-white text-[105%] font-bold text-white"
              style={{ maxHeight: '150px' }}
              inputMode="numeric"
            />
            <div className="flex items-center">
              <button
                onClick={handleSendMessage}
                disabled={
                  isLoading ||
                  !inputValue.trim() ||
                  (court === 'TRF2-Captcha' && !captchaToken)
                }
                className="p-2 rounded-lg bg-gray-500 text-white disabled:bg-gray-500 disabled:text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
          {errorMsg && (
            <p className="text-red-500 mt-2">Erro: {errorMsg}</p>
          )}
          {result && (
            <div className="bg-white text-black p-4 mt-2 rounded-md">
              <h2 className="font-bold mb-2">Eventos recentes</h2>
              <ul className="list-disc pl-4">
                {result.events.map((ev: any, idx: number) => (
                  <li key={idx} className="mb-1">
                    <span className="font-semibold">{ev.data}</span> - {ev.descricao}
                  </li>
                ))}
              </ul>
              <p className="mt-2"><strong>Classe:</strong> {result.info.classe}</p>
              <p><strong>Assunto:</strong> {result.info.assunto}</p>
              <p><strong>Vara:</strong> {result.info.vara}</p>
            </div>
          )}
          {/* <p className="text-center text-xs text-gray-500 mt-2">Koda - Todos os direitos reservados</p> */}
        </div>
      </footer>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
