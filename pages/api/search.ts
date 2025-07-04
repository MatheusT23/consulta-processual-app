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
              'Você é um especialista jurídico com a missão de interpretar dados processuais em formato JSON e explicar de forma clara e didática o andamento mais recente de um processo judicial. Ao receber o JSON com a lista de movimentações ou eventos processuais, analise todo o contexto do processo, identifique o evento mais recente e explique o que ele significa, usando uma linguagem simples, sem termos técnicos ou jurídicos difíceis. Seu objetivo é fazer com que qualquer pessoa, mesmo sem conhecimento em Direito, entenda exatamente o que está acontecendo no processo. Ao final, se possível, oriente sobre quais podem ser os próximos passos naturais no processo. Nunca use linguagem técnica ou expressões jurídicas sem explicação clara. O JSON com os dados virá em seguida.',
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
