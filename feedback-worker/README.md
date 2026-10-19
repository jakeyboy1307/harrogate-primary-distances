# Feedback worker

A tiny Cloudflare Worker behind the site's footer "Feedback" popup. It takes the message and emails it to the address in `wrangler.toml` using [Resend](https://resend.com). The Resend key lives here as a secret, never in the website.

## Set up

1. Create a Resend API key at resend.com/api-keys.
2. Deploy the worker:

   ```sh
   cd feedback-worker
   npx wrangler login
   npx wrangler secret put RESEND_API_KEY     # paste the key
   npx wrangler deploy                         # prints the worker's URL
   ```

3. Give the site that URL when building it:

   ```sh
   cd ../astro
   PUBLIC_FEEDBACK_URL=https://ysc-feedback.<your-subdomain>.workers.dev npm run build
   ```

   For local development put `PUBLIC_FEEDBACK_URL=...` in `astro/.env`.

## Sender address

`onboarding@resend.dev` works straight away, but Resend only lets it send to the email address your Resend account is registered with. To send from your own address (for example `feedback@mammothwebsites.co.uk`), verify that domain in Resend and change `FEEDBACK_FROM`.

## Settings

- `FEEDBACK_TO`: where messages go.
- `ALLOWED_ORIGINS`: the sites allowed to post. Add any new domain the site moves to.
