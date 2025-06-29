import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'

// Store active Puppeteer sessions in memory
const sessions = new Map<string, { browser: any; page: any; siteKey: string; pageUrl: string }>()

async function loadPuppeteer() {
  // Lazy import so build does not fail when dependency is missing
  const puppeteer = await import('puppeteer')
  return puppeteer
}

async function solveTurnstile(siteKey: string, pageUrl: string): Promise<string> {
  const apiKey = process.env.TWOCAPTCHA_API_KEY
  if (!apiKey) {
    throw new Error('Missing 2captcha API key')
  }

  const params = new URLSearchParams()
  params.append('key', apiKey)
  params.append('method', 'turnstile')
  params.append('sitekey', siteKey)
  params.append('pageurl', pageUrl)
  params.append('json', '1')

  const submitRes = await fetch('https://2captcha.com/in.php', {
    method: 'POST',
    body: params,
  })
  const submitData = (await submitRes.json()) as { status: number; request: string }
  if (submitData.status !== 1) {
    throw new Error(submitData.request)
  }
  const id = submitData.request

  await new Promise((r) => setTimeout(r, 15000))
  while (true) {
    const res = await fetch(
      `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${id}&json=1`
    )
    const data = (await res.json()) as { status: number; request: string }
    if (data.status === 1) {
      return data.request
    }
    if (data.request !== 'CAPCHA_NOT_READY') {
      throw new Error(data.request)
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
}

/**
 * Initialize a scraping session and return a session token.
 * GET ?numeroProcesso=0000000
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const numero = req.query.numeroProcesso as string
  if (!numero) {
    return res.status(400).json({ error: 'Missing numeroProcesso' })
  }

  const puppeteer = await loadPuppeteer()
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  // Custom user-agent helps avoid blocks
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  )

  // Navigate to the search page
  await page.goto(
    'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica'
  )

  // Fill in process number - selector may change, adjust if needed
  await page.type('input[name="numero"]', numero)

  // Get Turnstile site key from the page
  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]')
    return el ? (el as HTMLElement).getAttribute('data-sitekey') || '' : ''
  })

  const pageUrl = page.url()

  const token = randomUUID()
  sessions.set(token, { browser, page, siteKey, pageUrl })

  return res.status(200).json({ token })
}

/**
 * Solve Turnstile with 2captcha and extract data.
 * Body: { numeroProcesso, token }
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { numeroProcesso, token } = req.body || {}
  if (!numeroProcesso || !token) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  const session = sessions.get(token)
  if (!session) {
    return res.status(400).json({ error: 'Invalid session' })
  }

  const { browser, page, siteKey, pageUrl } = session
  try {
    const cfToken = await solveTurnstile(siteKey, pageUrl)
    await page.evaluate((t) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, cfToken)
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ])

    // Wait for table with events - adjust selector if the site changes
    await page.waitForSelector('#tabelaEventos tbody tr')

    const data = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll('#tabelaEventos tbody tr')
      )
      const events = rows.slice(0, 2).map((row) => {
        const columns = row.querySelectorAll('td')
        const data = columns[0]?.textContent?.trim() || ''
        const descricao = columns[1]?.textContent?.trim() || ''
        return { data, descricao }
      })

      // Basic information about the process
      const classe = (document.querySelector('#classe') as HTMLElement)?.innerText || ''
      const assunto = (document.querySelector('#assunto') as HTMLElement)?.innerText || ''
      const vara = (document.querySelector('#vara') as HTMLElement)?.innerText || ''

      return { events, info: { classe, assunto, vara } }
    })

    sessions.delete(token)
    await browser.close()

    // Summarize with GPT
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
    sessions.delete(token)
    return res.status(500).json({ error: 'Consulta falhou' })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  }
  if (req.method === 'POST') {
    return handlePost(req, res)
  }
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end('Method Not Allowed')
}

