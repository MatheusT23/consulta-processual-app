import type { NextApiRequest, NextApiResponse } from 'next'

async function fetchTRF2Eproc(numero: string): Promise<string[]> {
  const response = await fetch(
    'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `numero=${encodeURIComponent(numero)}`,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`TRF2-Eproc request failed: ${response.status} ${text}`)
  }

  const html = await response.text()

  const clean = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
  const lines = clean.split(/\n|\r/).map((l) => l.trim()).filter(Boolean)

  const events: string[] = []
  for (const line of lines) {
    if (/\d{2}\/\d{2}\/\d{4}/.test(line)) {
      events.push(line)
    }
    if (events.length >= 2) break
  }

  if (events.length === 0) {
    events.push('Nenhum evento encontrado')
  }

  return events
}

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

  if (tribunal === 'TRF2_EPROC') {
    try {
      const events = await fetchTRF2Eproc(numeroProcesso)

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
                'Você é um advogado experiente e deve resumir brevemente os movimentos do processo baseado nos eventos a seguir.',
            },
            { role: 'user', content: events.join('\n') },
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
      return res
        .status(500)
        .json({ error: (error as Error).message || 'Failed to fetch' })
    }
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
