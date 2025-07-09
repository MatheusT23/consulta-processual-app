import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface TurnstileWidgetProps {
  siteKey: string
  onSuccess: (token: string) => void
  onExpired?: () => void
}

export default function TurnstileWidget({ siteKey, onSuccess, onExpired }: TurnstileWidgetProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    ;(window as any).onTurnstileSuccess = (token: string) => {
      onSuccess(token)
    }
    ;(window as any).onTurnstileExpired = () => {
      onExpired?.()
    }
  }, [onSuccess, onExpired])

  useEffect(() => {
    if (!(window as any).turnstile || !divRef.current) return
    idRef.current = (window as any).turnstile.render(divRef.current, {
      sitekey: siteKey,
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
  }, [siteKey])

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div ref={divRef} className="cf-turnstile" />
    </>
  )
}
