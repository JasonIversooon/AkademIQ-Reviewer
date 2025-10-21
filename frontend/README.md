# AcademIQ Reviewer - Frontend

React + TypeScript frontend for the AcademIQ Reviewer application, built with Vite.

## 🎯 Overview

The frontend provides an intuitive interface for students to interact with AI-powered study tools. Users can upload PDFs and generate various study materials including flashcards, quizzes, explanations, and podcast-style audio content.

## 🛠️ Tech Stack

- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type safety
- **Vite 5.1.0** - Build tool and dev server
- **React Router DOM 7.9.4** - Client-side routing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AuthPanel.tsx        # Login/Register component
│   │   ├── UploadPanel.tsx      # PDF upload component
│   │   ├── FlashcardsPanel.tsx  # Flashcard display & interaction
│   │   ├── QuizPanel.tsx        # Quiz interface
│   │   ├── ExplainPanel.tsx     # Explanation generator
│   │   ├── PodcastPanel.tsx     # Podcast/audio generator
│   │   └── FloatingTimer.tsx    # Session timer utility
│   │
│   ├── pages/            # Route pages
│   │   ├── LandingPage.tsx      # Auth page (/)
│   │   ├── HomePage.tsx         # Main dashboard (/home)
│   │   ├── QuizPage.tsx         # Quiz feature (/quiz)
│   │   ├── FlashcardsPage.tsx   # Flashcards feature (/flashcards)
│   │   ├── ExplainPage.tsx      # Explanation feature (/explain)
│   │   └── VoicePage.tsx        # Podcast feature (/voice)
│   │
│   ├── styles/           # CSS modules
│   ├── ui/               # App shell
│   │   └── App.tsx             # Main app component with routing
│   ├── config.ts         # API configuration
│   └── main.tsx          # App entry point
│
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API endpoint:

Edit `src/config.ts` or create a `.env` file:
```env
VITE_API_BASE=http://localhost:8000
```

Default API URL: `http://192.168.0.123:8000`

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## 🔐 Authentication Flow

1. **Landing Page** (`/`) - Users see login/register interface
2. **Token Storage** - Upon successful authentication, JWT token is stored in `localStorage` as `akademiq_token`
3. **Protected Routes** - All feature pages require authentication
4. **Auto-redirect** - Logged-in users are redirected to `/home`, unauthenticated users to `/`

### Token Management

```typescript
// Token is automatically loaded on app start
localStorage.getItem('akademiq_token')

// Token is saved after login/register
localStorage.setItem('akademiq_token', token)

// Token is cleared on logout
localStorage.removeItem('akademiq_token')
```

## 🎨 Features & Pages

### 1. Home Page (`/home`)
- Upload panel for PDFs (max 15 pages)
- Quick access to all features
- Document management
- Logout functionality

### 2. Flashcards Page (`/flashcards`)
- Generate flashcards from uploaded documents
- Interactive card flipping
- Difficulty selection (easy, medium, hard)
- Progress tracking (new, learning, mastered)

### 3. Quiz Page (`/quiz`)
- Multiple-choice quizzes
- Difficulty levels
- Instant feedback
- Score tracking

### 4. Explain Page (`/explain`)
- Generate explanations in different styles:
  - Simple (beginner-friendly)
  - Detailed (comprehensive)
  - Bullet Points (quick reference)

### 5. Voice/Podcast Page (`/voice`)
- Text-to-speech podcast generation
- Voice selection (male/female combinations)
- Audio playback
- Download capability

## 🔄 API Integration

All API calls go through the configured `API_BASE` endpoint. The app communicates with the FastAPI backend using:

- **Auth**: `POST /register`, `POST /login`
- **Documents**: `POST /documents/upload`, `GET /documents`
- **Features**: `POST /flashcards`, `POST /quiz`, `POST /explain`, `POST /podcast`

### Example API Call

```typescript
const response = await fetch(`${API_BASE}/documents/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

## 🎨 Styling

- CSS modules in `src/styles/`
- Base styles in `base.css`
- Component-specific styles (e.g., `AuthPanel.css`, `HomePage.css`)
- Gradient themes and modern UI components

## 🐛 Common Issues

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### API Connection Failed
- Check if backend is running on the configured `API_BASE`
- Verify CORS is enabled on the backend
- Check network/firewall settings

### TypeScript Errors
```bash
# Clean build cache
rm -rf node_modules/.vite
npm run dev
```

## 📝 Development Guidelines

### Adding a New Feature Page

1. Create component in `src/components/`
2. Create page in `src/pages/`
3. Add route in `src/ui/App.tsx`
4. Add navigation link in `HomePage.tsx`
5. Create corresponding CSS file

### State Management

Currently using React's built-in `useState` and `useEffect`. Token is the primary shared state, passed via props.

### Making API Calls

Always include the auth token in headers:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 🚢 Deployment

Build the production bundle:
```bash
npm run build
```

The `dist/` folder can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Environment Variables for Production

Set `VITE_API_BASE` to your production API URL:
```env
VITE_API_BASE=https://api.yourdomain.com
```

## 📄 License

Part of the AcademIQ Reviewer project.

## 👥 Contributing

This is a learning/MVP project. Feel free to extend features and improve UI/UX!
