import type { NextApiRequest, NextApiResponse } from 'next'

async function loadPuppeteer() {
  const puppeteerExtra = await import('puppeteer-extra')
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
  puppeteerExtra.default.use(StealthPlugin())
  return puppeteerExtra.default
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const { numeroProcesso, token } = req.body || {}
  if (!numeroProcesso || !token) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  const puppeteer = await loadPuppeteer()
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })

  try {
    const page = await browser.newPage()

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
    })
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )

    await page.goto(
      'https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica'
    )
    await page.type('input.infraText', numeroProcesso)

    await page.evaluate((t: string) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, token)

    await page.click('button[type="submit"]')
    await page.waitForSelector('#tabelaEventos tbody tr', { timeout: 60000 })

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#tabelaEventos tbody tr'))
      const events = rows.slice(0, 2).map(row => {
        const cols = row.querySelectorAll('td')
        const data = cols[0]?.textContent?.trim() || ''
        const descricao = cols[1]?.textContent?.trim() || ''
        return { data, descricao }
      })
      const classe = (document.querySelector('#classe') as HTMLElement)?.innerText || ''
      const assunto = (document.querySelector('#assunto') as HTMLElement)?.innerText || ''
      const vara = (document.querySelector('#vara') as HTMLElement)?.innerText || ''
      return { events, info: { classe, assunto, vara } }
    })

    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Consulta falhou' })
  } finally {
    await browser.close()
  }
}
