import type { NextApiRequest, NextApiResponse } from 'next'

/** Importa o puppeteer dinamicamente apenas quando necessário. */
async function loadPuppeteer() {

  const puppeteerExtra = await import('puppeteer-extra')
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
  puppeteerExtra.default.use(StealthPlugin())
  return puppeteerExtra.default // <- aqui sim retorna o correto com .launch()

  /**const puppeteer = await import('puppeteer')
  return puppeteer**/
}

/**
 * Resolve o desafio Cloudflare Turnstile usando o serviço 2captcha.
 *
 * @param siteKey - Chave do captcha presente na página.
 * @param pageUrl - URL completa onde o captcha aparece.
 * @returns Token do captcha obtido via 2captcha.
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
 * Coleta os últimos eventos do eproc do TRF2 e gera um resumo com o OpenAI.
 *
 * @param req - Requisição recebendo `numeroProcesso`.
 * @param res - Resposta contendo os dados extraídos e o resumo.
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

  if (!process.env.TWOCAPTCHA_API_KEY) {
    return res.status(503).json({ error: 'TWOCAPTCHA_API_KEY not configured' })
  }

  const puppeteer = await loadPuppeteer()
  
  // Abre navegador visível para depuração
  const browser = await puppeteer.launch({ headless: false, executablePath: '/usr/bin/google-chrome', args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled', // bloqueia detecção direta
  ] })
  const page = await browser.newPage()
  
  await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  })
})

  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  )

  await page.goto(
    'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica'
  )
  // Preenche o número do processo no campo de busca
  await page.type('input.infraText', numeroProcesso)

  // Captura a chave do captcha na página
  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('[data-sitekey]')
    return el ? (el as HTMLElement).getAttribute('data-sitekey') || '' : ''
  })
  const pageUrl = page.url()

  try {
    // Resolve o captcha utilizando a API do 2captcha
    const cfToken = await solveTurnstile(siteKey, pageUrl)
    await page.evaluate((t: string) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, cfToken)

    // Aguarda até que o campo do token esteja preenchido. Em modo headless false
    // isso permite ao usuário resolver manualmente o captcha caso deseje.
    await page.waitForFunction(() => {
      const el = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      return !!el && el.value.trim().length > 0
    })

    await page.click('button[type="submit"]');
    await page.waitForSelector('table.infraTable', { timeout: 60000 });

    const data = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table.infraTable'))
      let events: { dataHora: string; descricao: string; documentos: string }[] = []

      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll('th')).map(h => h.textContent?.trim())
        if (headers[1] === 'Data/Hora' && headers[2] === 'Descrição') {
          const rows = Array.from(table.querySelectorAll('tr')).slice(1, 3)
          events = rows.map(row => {
            const cols = row.querySelectorAll('td')
            const dataHora = cols[1]?.textContent?.trim() || ''
            const descricao = cols[2]?.textContent?.trim() || ''
            const docCell = cols[4]
            let documentos = ''
            if (docCell) {
              const links = Array.from(docCell.querySelectorAll('a')).map(a => (a as HTMLAnchorElement).href)
              documentos = links.join(', ')
              if (!documentos) documentos = docCell.textContent?.trim() || ''
            }
            return { dataHora, descricao, documentos }
          })
          break
        }
      }

      return { events }
    })

    // Fecha o navegador após a extração
    await browser.close()

    // Retorna apenas o JSON extraído da página
    return res.status(200).json(data)

    /*
    const prompt =
      'Explique de forma clara e simples para um usuário leigo os dois últimos eventos deste processo judicial: ' +
      JSON.stringify(data.events)

    // Envia para o GPT gerar um resumo dos eventos
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
    */
  } catch (err) {
    console.error(err)
    // Garante que o navegador seja fechado em caso de erro
    await browser.close()
    return res.status(500).json({ error: 'Consulta falhou' })
  }
}
