# ResearchBridge Frontend 🌐⚡
### Modern Next.js 16 Web Application with Turbopack, Tailwind CSS & Glassmorphism

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16_Turbopack-black.svg?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Lucide Icons](https://img.shields.io/badge/Lucide_Icons-0.454+-F05032.svg?style=for-the-badge)](https://lucide.dev)
[![Production Build](https://img.shields.io/badge/Build-18%2F18_Routes_Compiled-success.svg?style=for-the-badge)](src/app)

</div>

---

## 📖 Overview

The **ResearchBridge Frontend** is an ultra-fast, responsive web application engineered with **Next.js 16 (App Router)**, **TypeScript**, and **Tailwind CSS**. Designed specifically for high-engagement academic collaboration, it features:

- 🎨 **Adaptive Glassmorphic Dark & Light Theme**: Custom theme provider with dynamic glassmorphism, crisp typography, and high contrast ratios.
- 📱 **Mobile-First Responsive Engineering**: Dedicated mobile hero layouts, ergonomic bottom drawer notification center, and touch-optimized action cards.
- 🎭 **Instant Multi-Persona Switching**: Pre-seeded demo persona switcher (Admin, Faculty, Students) in the navigation bar for instant testing without manual logouts.
- 🤖 **Contextual Gemini AI Copilot**: Floating interactive research assistant and 15-part structured scientific paper summarizer.
- 🕸️ **Interactive Collaboration Topology Graph**: Visual rendering of cross-departmental research networks, faculty interests, and student skill synergies.

---

## 📂 Route Directory Structure

```
src/
├── app/
│   ├── page.tsx                     # Landing page with mobile-adaptive hero & quick demo cards
│   ├── dashboard/page.tsx           # Role-adaptive executive dashboard (Student/Prof/Admin)
│   ├── professors/
│   │   ├── page.tsx                 # Faculty directory with search, filters & availability
│   │   └── [id]/page.tsx            # Detailed faculty profile & direct inquiry modal
│   ├── projects/page.tsx            # Research openings & application submission modal
│   ├── talent-matcher/page.tsx      # Explainable AI candidate matcher for professors
│   ├── skills/page.tsx              # Evidence-based Skill Passport with faculty endorsement flow
│   ├── teams/page.tsx               # AI-powered interdisciplinary team composer
│   ├── collaboration-graph/page.tsx # Interactive topological network visualization
│   ├── ideas/page.tsx               # Research Idea-to-Prototype incubation canvas
│   ├── contributions/page.tsx       # Verified student contribution ledger & portfolio
│   ├── requests/page.tsx            # Formal collaboration request lifecycle manager
│   ├── messages/page.tsx            # Real-time participant-isolated chat threads
│   ├── documents/page.tsx           # Research paper vault & 15-part Gemini summarizer
│   ├── admin/page.tsx               # Faculty verification, audit log, & Fair Opportunity monitor
│   ├── login/page.tsx               # Auth portal with email login & 1-click demo accounts
│   └── layout.tsx                   # Root layout with ThemeProvider, AuthProvider, & AI Copilot
├── components/
│   ├── ai/
│   │   └── FloatingAiAssistant.tsx  # Floating Gemini research assistant with streaming UI
│   ├── layout/
│   │   ├── Navbar.tsx               # Sticky header with persona switcher, notifications, theme
│   │   ├── AppShell.tsx             # Responsive page container with responsive padding
│   │   └── Footer.tsx               # Platform footer with institutional links
│   ├── notifications/
│   │   └── NotificationCenter.tsx   # Real-time notification center with mobile drawer
│   └── ui/                          # Glassmorphic component library (Card, Badge, Modal, Button)
├── context/
│   ├── AuthContext.tsx              # Authentication state, JWT tokens, & demo persona switcher
│   └── ThemeContext.tsx             # Dark/Light theme provider with local storage persistence
├── lib/
│   ├── api.ts                       # Typed REST client with automatic auth headers & fallbacks
│   └── utils.ts                     # Formatting helpers, time ago, class merger
└── types/
    └── api.ts                       # TypeScript interfaces mirroring FastAPI Pydantic schemas
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` in the `frontend` folder:
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Build & Verification

To validate TypeScript types and generate the production bundle:
```bash
npm run build
```
All 18 routes are verified to compile statically and dynamically with 0 errors.
