import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'

interface Session {
  browser: any
  page: any
}

const sessions = new Map<string, Session>()

async function loadPuppeteer() {
  const puppeteerExtra = await import('puppeteer-extra')
  const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default
  puppeteerExtra.default.use(StealthPlugin())
  return puppeteerExtra.default
}

async function startSession(numeroProcesso: string) {
  const puppeteer = await loadPuppeteer()
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  })
  const page = await browser.newPage()
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
  await page.goto('https://eproc-consulta.trf2.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica')

  await page.type('input.infraText', numeroProcesso)

  const siteKey = await page.evaluate(() => {
    const el = document.querySelector('.cf-turnstile')
    return el ? (el as HTMLElement).getAttribute('data-sitekey') || '' : ''
  })
  const pageUrl = page.url()

  const id = randomUUID()
  sessions.set(id, { browser, page })

  return { id, siteKey, pageUrl }
}

async function solveSession(id: string, token: string) {
  const session = sessions.get(id)
  if (!session) throw new Error('Sessão não encontrada')
  const { browser, page } = session

  try {
    await page.evaluate((t: string) => {
      const input = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null
      if (input) input.value = t
    }, token)
    await page.click('button[type="submit"]')
    await page.waitForSelector('table.infraTable', { timeout: 60000 })
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
    return data
  } finally {
    sessions.delete(id)
    await browser.close()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end('Method Not Allowed')
  }

  const { action, numeroProcesso, sessionId, token } = req.body || {}

  try {
    if (action === 'start') {
      if (!numeroProcesso) return res.status(400).json({ error: 'Missing numeroProcesso' })
      const { id, siteKey, pageUrl } = await startSession(String(numeroProcesso))
      return res.status(200).json({ sessionId: id, siteKey, pageUrl })
    }
    if (action === 'solve') {
      if (!sessionId || !token) return res.status(400).json({ error: 'Missing parameters' })
      const data = await solveSession(String(sessionId), String(token))
      return res.status(200).json(data)
    }
    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Falha na consulta' })
  }
}
