# Celestia — Western & Vedic Chart Calculator

Next.js 14 + Tailwind + astronomy-engine.

```bash
npm install
npm run dev
```
Open http://localhost:3000

Use **Export PDF** to download a branded A4 report with the selected Western and/or Vedic chart sections. The Cosmic Chaos Club logo is served from `public/logo.png`. PDF brand text and website settings are in `components/PdfExportModal.tsx`.

## AI chart readings

The optional Western and Vedic reading buttons use Google Gemini 3.8 Flash to interpret placements calculated by the chart engine. Before a reading is requested, the user must agree to send their name, birth date and time, location, and chart placements to Google. The API requires only a Gemini API key; it has no Redis dependency or built-in rate limit. Restrict key usage and monitor its quota in Google AI Studio because public readings can consume your Gemini quota.

Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey). Keep it private; do not use a `NEXT_PUBLIC_` prefix.

For local development, create `.env.local` in the project root (next to `package.json`) and add:

```text
GEMINI_API_KEY=your_gemini_api_key
```

Replace the example value with your key, save the file, and restart `npm run dev`. Do not commit `.env.local` or paste the key into chat.

For Vercel, open the **astro-chart** project, then go to **Settings → Environment Variables**. Add a variable named `GEMINI_API_KEY`, paste the key into its value field, and select **Production** (also select **Preview** and/or **Development** if those deployments need AI readings). Save it, then trigger a new deployment; environment variables only apply to new deployments. Keep it server-only and do not name it `NEXT_PUBLIC_GEMINI_API_KEY`.

The API returns a configuration error when `GEMINI_API_KEY` is missing. Review Google's current privacy, data-use, and pricing terms for the Gemini API before enabling the feature.
