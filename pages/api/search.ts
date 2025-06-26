import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { numeroProcesso } = req.body
  if (!numeroProcesso) {
    return res.status(400).json({ error: 'Missing numeroProcesso' })
  }

  const payload = {
    query: {
      match: {
        numeroProcesso,
      },
    },
  }

  try {
    const dataRes = await fetch(
      'https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search',
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
    return res.status(200).json(data)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch' })
  }
}
