import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

interface Processo {
  id: number;
  numero: string;
  descricao: string;
  ownerId: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [level, setLevel] = useState<number>(1);
  const [tab, setTab] = useState<string>("meus");
  const [processos, setProcessos] = useState<Processo[]>([]);

  // Nível pode vir de localStorage ou query, aqui apenas exemplo
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("userLevel");
      if (stored) setLevel(Number(stored));
    }
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/processos?level=${level}`);
      const data = await res.json();
      setProcessos(data.processos);
    }
    load();
  }, [level]);

  const filtered = tab === "meus"
    ? processos.filter((p) => p.ownerId === 1 || level === 0)
    : processos;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r p-4 space-y-2">
        {level === 1 && (
          <button
            className={`block w-full text-left px-3 py-2 rounded-md ${tab === "meus" ? "bg-gray-200" : ""}`}
            onClick={() => setTab("meus")}
          >
            Meus Processos
          </button>
        )}
        {level === 0 && (
          <>
            <button
              className={`block w-full text-left px-3 py-2 rounded-md ${tab === "notificados" ? "bg-gray-200" : ""}`}
              onClick={() => setTab("notificados")}
            >
              Processos Notificados
            </button>
            <button
              className={`block w-full text-left px-3 py-2 rounded-md ${tab === "escritorios" ? "bg-gray-200" : ""}`}
              onClick={() => setTab("escritorios")}
            >
              Gestão de Escritórios
            </button>
          </>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-end border-b p-4">
          <Link href="/login" className="text-sm font-semibold underline">
            Sair
          </Link>
        </header>

        <main className="p-4 flex-1 overflow-y-auto">
          {tab === "meus" && (
            <div>
              <h1 className="text-xl font-bold mb-4">Meus Processos</h1>
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Número</th>
                    <th className="border px-2 py-1 text-left">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="border px-2 py-1">{p.numero}</td>
                      <td className="border px-2 py-1">{p.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {level === 0 && tab === "notificados" && (
            <div>
              <h1 className="text-xl font-bold mb-4">Processos Notificados</h1>
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-2 py-1 text-left">Número</th>
                    <th className="border px-2 py-1 text-left">Descrição</th>
                    <th className="border px-2 py-1 text-left">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {processos.map((p) => (
                    <tr key={p.id}>
                      <td className="border px-2 py-1">{p.numero}</td>
                      <td className="border px-2 py-1">{p.descricao}</td>
                      <td className="border px-2 py-1">Usuário {p.ownerId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {level === 0 && tab === "escritorios" && (
            <div>
              <h1 className="text-xl font-bold mb-4">Gestão de Escritórios</h1>
              <p>Área restrita ao administrador.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
