import type { NextApiRequest, NextApiResponse } from 'next'

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

  const endpoint =
    tribunal === 'TJRJ'
      ? 'https://api-publica.datajud.cnj.jus.br/api_publica_tjrj/_search'
      : 'https://api-publica.datajud.cnj.jus.br/api_publica_trf2/_search'

  const payload = {
    query: {
      match: {
        numeroProcesso,
      },
    },
  }

  try {
    const dataRes = await fetch(
      endpoint,
      {
        method: 'POST',
        headers: {
          Authorization: `ApiKey ${process.env.DATAJUD_API_KEY ?? '<API Key>'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!dataRes.ok) {
      const text = await dataRes.text()
      return res.status(dataRes.status).send(text)
    }

    const data = await dataRes.json()

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
              'Você é um advogado experiente e deve resumir brevemente os movimentos do processo baseado na resposta a seguir.',
          },
          { role: 'user', content: JSON.stringify(data) },
        ],
        max_tokens: 200,
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
