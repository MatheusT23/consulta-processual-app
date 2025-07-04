# consulta-processual-app

This project provides a small Next.js application to query court information.

## Environment

Set `OPENAI_API_KEY` for OpenAI requests and `TWOCAPTCHA_API_KEY` for solving Cloudflare Turnstile challenges.

If the API endpoints return `502` errors, verify that these environment variables
are properly configured and that the external services are reachable.

