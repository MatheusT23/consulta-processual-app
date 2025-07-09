import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess: (token: string) => void
  onExpired?: () => void
}

export default function TurnstileWidget({ siteKey, onSuccess, onExpired }: TurnstileWidgetProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const idRef = useRef<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    ;(window as any).onTurnstileSuccess = (token: string) => {
      onSuccess(token)
    }
    ;(window as any).onTurnstileExpired = () => {
      onExpired?.()
    }
  }, [onSuccess, onExpired])

  useEffect(() => {
    if (!scriptLoaded || !(window as any).turnstile || !divRef.current) return
    if (!siteKey) {
      console.warn('Turnstile siteKey is missing')
      return
    }
    idRef.current = (window as any).turnstile.render(divRef.current, {
      sitekey: String(siteKey),
      callback: 'onTurnstileSuccess',
      'expired-callback': 'onTurnstileExpired',
      'error-callback': 'onTurnstileExpired'
    })
    return () => {
      try {
        if (idRef.current && (window as any).turnstile) {
          ;(window as any).turnstile.remove(idRef.current)
        }
      } catch {
        // ignore
      }
    }
  }, [siteKey, scriptLoaded])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={divRef} className="cf-turnstile" />
    </>
  )
}
