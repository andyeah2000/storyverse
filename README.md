# StoryVerse

> AI-powered screenwriting companion with voice interaction

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8-blue.svg)
![React](https://img.shields.io/badge/react-19-blue.svg)

## Overview

StoryVerse is a modern screenwriting application that combines AI assistance with professional writing tools. Talk to your AI co-author, manage your story bible, structure your plot, and write compelling scripts—all in one place.

## Features

- 🎤 **Voice-First AI Agent** - Natural voice interaction with your AI co-author
- 📚 **Story Bible** - Organize characters, locations, and lore
- ✍️ **Script Editor** - Professional screenplay formatting
- 📊 **Beat Sheet** - Save the Cat! story structure
- 🗺️ **Story Map** - Inverse story mapping for cause-effect chains
- 📝 **Notes & Mood Board** - Capture ideas and visual references
- 🎧 **Table Read** - AI-generated audio of your script
- 🔐 **Authentication** - User accounts with secure login

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS 4
- **Backend**: Supabase (Auth + Database + Realtime)
- **AI**: Google Gemini 2.5 Flash (native audio)
- **Routing**: React Router 7
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Build**: Vite 6
- **Deployment**: Vercel / Docker + Nginx

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Gemini API Key ([Get one free](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/storyverse.git
cd storyverse

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Add your Gemini API key to .env
# GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

### Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Lint and fix code
npm run format     # Format code with Prettier
npm run typecheck  # Run TypeScript type checking
```

### Docker

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t storyverse .
docker run -p 3000:80 storyverse
```

## Deployment

### Vercel (Recommended)

1. **Fork & Connect**
   ```bash
   # Push to GitHub
   git push origin main
   ```
   - Import your repo at [vercel.com/new](https://vercel.com/new)

2. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Go to SQL Editor, run:
   ```sql
   -- Copy contents from supabase/migrations/001_initial_schema.sql
   ```

3. **Set Environment Variables in Vercel**
   | Variable | Value |
   |----------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_GEMINI_API_KEY` | Optional - users can set in Settings |

4. **Deploy**
   - Vercel auto-deploys on push to main

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```sql
   -- See supabase/migrations/001_initial_schema.sql
   ```
3. Enable **Email Auth** in Authentication > Providers
4. Get your keys from Settings > API:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

### Local Development with Supabase

```bash
# Create .env.local with your Supabase credentials
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

# Start development server
npm run dev
```

> **Note**: The app works without Supabase for local development. Data is stored in LocalStorage. Configure Supabase for cloud sync and production deployment.

## Project Structure

```
storyverse/
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── AgentWorkspace  # AI Agent interface
│   │   ├── Layout          # App shell
│   │   └── ...
│   ├── context/           # React contexts
│   │   ├── AuthContext    # Authentication state
│   │   ├── AgentContext   # AI Agent state
│   │   └── StoryContext   # Story/project state
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── services/          # External services (Gemini)
│   ├── types/             # TypeScript types
│   ├── utils/             # Helper utilities
│   ├── App.tsx            # Root component
│   ├── index.tsx          # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── docker-compose.yml     # Docker configuration
├── Dockerfile             # Docker build
├── nginx.conf             # Nginx configuration
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | For cloud sync |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | For cloud sync |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Optional (users set in Settings) |

### Path Aliases

```typescript
@/           → src/
@/components → src/components/
@/context    → src/context/
@/hooks      → src/hooks/
@/lib        → src/lib/
@/services   → src/services/
@/types      → src/types/
@/utils      → src/utils/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Save the Cat!](https://savethecat.com/) for the beat sheet methodology
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
