import type { NextApiRequest, NextApiResponse } from 'next'

/** Dynamically import puppeteer only when needed. */
async function loadPuppeteer() {
  const puppeteer = await import('puppeteer')
  return puppeteer
}

/**
 * Solves Cloudflare Turnstile using the 2captcha service.
 *
 * @param siteKey - Captcha site key from the page.
 * @param pageUrl - Full URL where the captcha is rendered.
 * @returns The captcha token provided by 2captcha.
 */
async function solveTurnstile(siteKey: string, pageUrl: string): Promise<string> {
  const apiKey = process.env.TWOCAPTCHA_API_KEY
  if (!apiKey) {
    throw new Error('Missing 2captcha API key')
  }

  const createRes = await fetch('https://api.2captcha.com/createTask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientKey: apiKey,
      task: {
        type: 'TurnstileTaskProxyless',
        websiteURL: pageUrl,
        websiteKey: siteKey,
      },
    }),
  })
  const createData = await createRes.json() as {
    errorId: number
    errorDescription?: string
    taskId?: number
  }
  if (createData.errorId !== 0 || !createData.taskId) {
    throw new Error(createData.errorDescription || 'Failed to create captcha task')
  }
  const id = createData.taskId

  while (true) {
    await new Promise((r) => setTimeout(r, 5000))
    const res = await fetch('https://api.2captcha.com/getTaskResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientKey: apiKey, taskId: id }),
    })
    const data = await res.json() as {
      status: 'processing' | 'ready'
      solution?: { token?: string }
      errorId?: number
      errorDescription?: string
    }
    if (data.status === 'ready' && data.solution?.token) {
      return data.solution.token
    }
    if (data.status !== 'processing') {
      throw new Error(data.errorDescription || 'Captcha solving failed')
    }
  }
}

/**
 * Scrapes the TRF2 eproc portal to fetch the latest events of a process
 * and generates a simplified summary using OpenAI.
 *
 * @param req - Incoming HTTP request containing `numeroProcesso`.
 * @param res - HTTP response with the extracted data and summary.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const { numeroProcesso } = req.body || {}
  if (!numeroProcesso) {
    return res.status(400).json({ error: 'Missing numeroProcesso' })
  }

  const puppeteer = await loadPuppeteer()
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  )

  await page.goto(
    'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica'
  )
  await page.type('input[name="numero"]', numeroProcesso)

  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]')
    return el ? (el as HTMLElement).getAttribute('data-sitekey') || '' : ''
  })
  const pageUrl = page.url()

  try {
    const cfToken = await solveTurnstile(siteKey, pageUrl)
    await page.evaluate((t: string) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, cfToken)
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ])

    await page.waitForSelector('#tabelaEventos tbody tr')

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#tabelaEventos tbody tr'))
      const events = rows.slice(0, 2).map((row) => {
        const columns = row.querySelectorAll('td')
        const data = columns[0]?.textContent?.trim() || ''
        const descricao = columns[1]?.textContent?.trim() || ''
        return { data, descricao }
      })

      const classe = (document.querySelector('#classe') as HTMLElement)?.innerText || ''
      const assunto = (document.querySelector('#assunto') as HTMLElement)?.innerText || ''
      const vara = (document.querySelector('#vara') as HTMLElement)?.innerText || ''

      return { events, info: { classe, assunto, vara } }
    })

    await browser.close()

    const prompt =
      'Explique de forma clara e simples para um usuário leigo os dois últimos eventos deste processo judicial: ' +
      JSON.stringify(data.events)

    const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    })

    if (!chatRes.ok) {
      const text = await chatRes.text()
      return res.status(chatRes.status).send(text)
    }
    const chatData = await chatRes.json()
    const resumo = chatData.choices?.[0]?.message?.content || ''

    return res.status(200).json({ ...data, resumo })
  } catch (err) {
    console.error(err)
    await browser.close()
    return res.status(500).json({ error: 'Consulta falhou' })
  }
}
