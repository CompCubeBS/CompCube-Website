# CompCube Website

The public Svelte 5 website for CompCube. It uses the local `CompCube-Client` package for all API calls and server-rendered metadata on every page.

## Setup

Copy `.env.example` to `.env` and configure:

- `PUBLIC_COMPCUBE_API_URL` — the CompCube API root, including `/api`.
- `PUBLIC_BK_API_URL` — the BeatKhana API root, including `/api`.
- `PUBLIC_BK_OAUTH_CLIENT_ID` — the public BeatKhana OAuth application ID. Never put the client secret in this project.
- `PUBLIC_SITE_URL` — the website origin used for canonical metadata.
- `PUBLIC_DISCORD_URL` and `PUBLIC_GITHUB_URL` — footer and home-page links.

The BeatKhana OAuth application must register `${PUBLIC_COMPCUBE_API_URL}/oauth/callback` as its exact redirect URI.

## Authentication

The OAuth callback stores the BeatKhana access and refresh tokens in secure HttpOnly cookies for the website session. Cookies are storage only: SvelteKit reads the access token server-side and the local `CompCube-Client` sends it to every protected API endpoint as `Authorization: Bearer <access-token>`. When the access token expires, SvelteKit reads the refresh cookie and sends that value to the refresh endpoint as a bearer header before updating both cookies. The API does not authenticate from cookies. Browser-side protected requests receive the access token through the hydrated auth state and use the same bearer header.

```sh
npm install
npm run dev
```

Use `npm run check` for Svelte and TypeScript validation and `npm run build` for a production build. Select a production SvelteKit adapter before deploying.

## Plugin downloads

Plugin binaries are not committed to or bundled with the website. Both the home page and download page load the release manifest from the backend's public `/plugin-releases` endpoint and link directly to the backend download route.

## Static assets

The site expects these files:

- `static/assets/logo.svg`
- `static/Quattrocento_Sans/QuattrocentoSans-Regular.ttf`
- `static/Quattrocento_Sans/QuattrocentoSans-Bold.ttf`
- `static/Noto_Sans/NotoSans-VariableFont_wdth,wght.ttf`
- `static/Chakra_Petch/ChakraPetch-Regular.ttf`
- `static/fonts/JetBrainsMono-VariableFont_wght.ttf` (optional until supplied; numeric text has a monospace fallback)

FAQ content lives in `src/lib/server/faq.ts`. Download response types and display mapping live in `src/lib/data/downloads.ts`.
