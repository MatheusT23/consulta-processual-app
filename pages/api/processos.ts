import type { NextApiRequest, NextApiResponse } from "next";

interface Processo {
  id: number;
  numero: string;
  descricao: string;
  ownerId: number;
}

const dados: Processo[] = [
  { id: 1, numero: "1234567-89.2024.1.00.0001", descricao: "Ação trabalhista", ownerId: 1 },
  { id: 2, numero: "2345678-90.2024.1.00.0002", descricao: "Recurso fiscal", ownerId: 2 },
  { id: 3, numero: "3456789-01.2024.1.00.0003", descricao: "Inventário", ownerId: 1 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const level = Number(req.query.level ?? 1);

  if (level === 1) {
    const result = dados.filter((p) => p.ownerId === 1);
    return res.status(200).json({ processos: result });
  }

  return res.status(200).json({ processos: dados });
}
