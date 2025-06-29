import type { NextApiRequest, NextApiResponse } from 'next'

/** Importa o puppeteer apenas quando necessário. */
async function loadPuppeteer() {
  const puppeteer = await import('puppeteer')
  return puppeteer
}

/**
 * Resolve o desafio Turnstile do Cloudflare utilizando o 2captcha.
 *
 * @param siteKey - Chave do captcha extraída da página.
 * @param pageUrl - URL onde o captcha está presente.
 * @returns Token do captcha devolvido pelo 2captcha.
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
 * Realiza a raspagem do portal eproc do TRF2 e gera um resumo com o OpenAI.
 *
 * @param req - Requisição contendo o `numeroProcesso`.
 * @param res - Resposta com os dados extraídos e o resumo.
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

  // Abre a página de consulta do eproc
  await page.goto(
    'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica'
  )
  // Preenche o número do processo no formulário
  await page.type('input[name="numero"]', numeroProcesso)

  // Captura a chave do captcha da página
  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]')
    return el ? (el as HTMLElement).getAttribute('data-sitekey') || '' : ''
  })
  const pageUrl = page.url()

  try {
    // Resolve o captcha usando o serviço externo
    const cfToken = await solveTurnstile(siteKey, pageUrl)
    await page.evaluate((t: string) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, cfToken)
    // Envia o formulário e aguarda a navegação
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ])

    await page.waitForSelector('#tabelaEventos tbody tr')

    // Extrai os dois últimos eventos da tabela
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

    // Monta o prompt para o chat GPT resumir os eventos
    const prompt =
      'Explique de forma clara e simples para um usuário leigo os dois últimos eventos deste processo judicial: ' +
      JSON.stringify(data.events)

    // Chamada ao OpenAI para gerar o resumo
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

    // Retorna os eventos extraídos e o resumo em português simples
    return res.status(200).json({ ...data, resumo })
  } catch (err) {
    console.error(err)
    await browser.close()
    // Qualquer erro durante o processo resulta em falha 500
    return res.status(500).json({ error: 'Consulta falhou' })
  }
}
