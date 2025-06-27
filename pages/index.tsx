import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, Bot, User, Send, Mic, Search, Cpu } from 'lucide-react';

// Main App Component
export default function App() {


  // State to store the conversation messages
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);

  // State for the input field value
  const [inputValue, setInputValue] = useState('');
  // State to track if the bot is "thinking"
  const [isLoading, setIsLoading] = useState(false);

  // Ref to the chat container for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Guard to ensure intro messages run only once
  const typingInitialized = useRef(false);

  // Effect to scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing effect for the initial bot messages
  useEffect(() => {
    if (typingInitialized.current) return;
    typingInitialized.current = true;

    const botMessages = [
      'Olá, seja bem vindo',
      'Para que eu possa te atualizar sobre o andamento, por favor digite o número do processo.'
    ];

    let messageIndex = 0;
    let interval: NodeJS.Timeout;

    const typeNextMessage = () => {
      const text = botMessages[messageIndex];
      let charIndex = 0;
      let currentIndex = 0;

      setMessages((prev) => {
        currentIndex = prev.length;
        return [...prev, { sender: 'bot', text: '' }];
      });

      interval = setInterval(() => {
        charIndex += 1;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[currentIndex] = {
            ...newMessages[currentIndex],
            text: text.slice(0, charIndex),
          };
          return newMessages;
        });

        if (charIndex === text.length) {
          clearInterval(interval);
          messageIndex += 1;
          if (messageIndex < botMessages.length) {
            setTimeout(() => {
              typeNextMessage();
            }, 300);
          }
        }
      }, 15);
    };

    // Start typing the first message
    typeNextMessage();

    return () => clearInterval(interval);
  }, []);

  const typeBotMessage = (text: string) => {
    let charIndex = 0;
    let currentIndex = 0;

    setMessages((prev) => {
      currentIndex = prev.length;
      return [...prev, { sender: 'bot', text: '' }];
    });

    const interval = setInterval(() => {
      charIndex += 1;
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[currentIndex] = {
          ...newMessages[currentIndex],
          text: text.slice(0, charIndex),
        };
        return newMessages;
      });

      if (charIndex === text.length) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 5);
  };

  // --- Event Handlers ---

  /**
   * Handles sending a message from the user.
   */
  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput === '' || isLoading) {
      return; // Don't send empty messages or while loading
    }

    // Add user's message to the chat
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
        body: JSON.stringify({ numeroProcesso: trimmedInput }),
      });

      if (!res.ok) {
        throw new Error('Erro ao consultar a API');
      }

      const data = await res.json();
      const message = data.summary ?? JSON.stringify(data, null, 2);
      typeBotMessage(message);
    } catch (error) {
      typeBotMessage(`Erro: ${(error as Error).message}`);
    }
  };

  /**
   * Handles key presses in the textarea, specifically for "Enter".
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} event - The keyboard event.
   */
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault(); // Prevent new line on Enter
    handleSendMessage();
  }
};

  // --- Render Method ---

  return (
    <div className="flex flex-col h-screen bg-[#fff] text-blue font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-md hover:bg-gray-700/50 transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold">Acompanhar Processo</h1>
        </div>
        <div className="flex items-center gap-2">
           <Link href="/login" className="bg-black text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Entrar
           </Link>
           {/*<button className="p-2 rounded-md hover:bg-gray-700/50 transition-colors">
            <Bot size={20} />
           </button>*/}
        </div>
      </header>

      {/* Chat Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-4 ${message.sender === 'user' ? 'justify-end text-white' : ''}`}>
              {/* Bot/User Icon */}
              {message.sender === 'bot' && (
                <div className="w-8 h-8 flex-shrink-0 bg-black rounded-full flex items-center justify-center text-white">
                  <Bot size={20} />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-xl p-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gray-700/80 rounded-br-lg'
                    : 'bg-gray-800/60 rounded-bl-lg'
                }`}
              >
                <p className="whitespace-pre-wrap text-white">{message.text}</p>
              </div>
              
               {message.sender === 'user' && (
                <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {/* Loading Indicator */}
          {isLoading && (
             <div className="flex items-start gap-4">
                <div className="w-8 h-8 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="max-w-xl p-4 rounded-2xl bg-gray-800/60 rounded-bl-lg flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></span>
                </div>
             </div>
          )}
          {/* Empty div to ensure scrolling to the end */}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Message Input Footer #014bea */}
      
      <footer className="w-full p-6 md:p-6 flex-shrink-0 bg-[#000]">
        <div className="max-w-3xl mx-auto">
           {/* Action Buttons */}
          {/*<div className="flex items-center gap-2 mb-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                <Cpu size={16} /> Processo
            </button>
             <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-600 rounded-lg hover:bg-gray-700/50 transition-colors">
                <Search size={16} /> Search
            </button>
          </div>*/}
        
          {/* Text Input Area #2a2b30 */}
          <div className="relative flex items-center p-2 bg-[#fff] border border-gray-700/50 rounded-2xl">
            <textarea
              value={inputValue}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, '');
                setInputValue(onlyNumbers);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite o Número do Processo..."
              rows={1}
              className="flex-1 bg-transparent p-2 resize-none outline-none placeholder-gray-500"
              style={{ maxHeight: '150px' }}
              inputMode="numeric"
            />
            <div className="flex items-center">
              {/*<button className="p-2 rounded-lg hover:bg-gray-600/50 transition-colors">
                <Mic size={20} />
              </button>*/}
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-lg bg-black text-[#daa520] disabled:bg-gray-500 disabled:text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">Koda - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
}
