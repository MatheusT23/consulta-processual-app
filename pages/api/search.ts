import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Consulta a API pública do CNJ e gera um resumo via OpenAI.
 *
 * @param req - Requisição HTTP recebida.
 * @param res - Resposta HTTP enviada ao cliente.
 * @returns JSON com o resumo ou mensagem de erro.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { numeroProcesso, tribunal } = req.body
  if (!numeroProcesso) {
    return res.status(400).json({ error: 'Missing numeroProcesso' })
  }

  // Define a URL de acordo com o tribunal escolhido
  const endpoint =
    tribunal === 'TRT1'
      ? 'https://api-publica.datajud.cnj.jus.br/api_publica_trt1/_search'
      : 'https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search';

  // Corpo da requisição para a API do CNJ
  const payload = {
    query: {
      match: {
        numeroProcesso,
      },
    },
  }

  try {
    // Chamada à API do CNJ
    const dataRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${process.env.DATAJUD_API_KEY ?? '<API Key>'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!dataRes.ok) {
      const text = await dataRes.text()
      return res.status(dataRes.status).send(text)
    }

    const data = await dataRes.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
    }

    // Utiliza o GPT para resumir os dados encontrados
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Você é um especialista jurídico com a missão de explicar o andamento de processos judiciais para clientes leigos. Sua explicação deve ser precisa, didática e compreensível mesmo para quem não entende nada de direito. Evite jargões jurídicos e traduza todos os termos técnicos para uma linguagem do dia a dia.',
          },
          {
            role: 'user',
            content:
              'Este é o conjunto de dados retornado da API pública com os principais eventos de um processo judicial. Analise o contexto geral do processo e explique de forma clara, objetiva e detalhada o que significa o andamento mais recente. Use uma linguagem simples, como se estivesse explicando para alguém que não tem nenhum conhecimento jurídico. Informe também, se possível, quais são os próximos passos que podem ocorrer nesse processo.\n\nAqui estão os dados:\n\n```json\n' +
              JSON.stringify(data) +
              '\n```',
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!chatRes.ok) {
      const text = await chatRes.text()
      return res.status(chatRes.status).send(text)
    }

    const chatData = await chatRes.json()
    const summary = chatData.choices?.[0]?.message?.content ?? ''

    return res.status(200).json({ summary })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch' })
  }
}
