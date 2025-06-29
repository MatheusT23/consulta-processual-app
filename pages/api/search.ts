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
    tribunal === 'TJRJ'
      ? 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search'
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

    // Utiliza o GPT para resumir os dados encontrados
    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Você é um advogado experiente e deve resumir os movimentos do processo baseado na resposta a seguir. A sua resposta deverá separar cada movimento em um parágrafo, devidamente datados, e explique objetivamente o que esse movimento pode representar para o andamento processual. Cada movimento deve ser explicado em até 1 linha',
          },
          { role: 'user', content: JSON.stringify(data) },
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
