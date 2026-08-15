# Medilingo Authoring

React/Vite authoring frontend for Medilingo, connected to the Medilingo Supabase content platform.

## Features

- Supabase Auth
- Dashboard
- Clinical Case editor with DE/EN content
- Organ system / chapter / case pool mapping
- Case pools
- Chapter overview
- Case of the Week overview
- Upload Inbox using Supabase Storage
- Review Queue

## Local development

```bash
npm install
npm run dev
```

Optional environment variables:

```bash
VITE_SUPABASE_URL=https://bisopiknykosyddcvres.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Never put a Supabase secret/service-role key into this frontend.

## Build

```bash
npm run build
```

Vercel output directory: `dist`.
