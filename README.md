# 🎓 AcademIQ Reviewer

An AI-powered study companion that transforms PDF documents into interactive learning materials. Upload your study materials and generate flashcards, quizzes, explanations, and podcast-style audio content to enhance your learning experience.

## 🌟 Features

- **📚 PDF Upload** - Upload study materials (max 15 pages)
- **🃏 Smart Flashcards** - AI-generated flashcards with spaced repetition tracking
- **📝 Interactive Quizzes** - Multiple-choice quizzes with instant feedback
- **💡 Explain Like I'm...** - Get explanations in different styles (simple, detailed, bullet points)
- **🎙️ Podcast Generator** - Convert content to podcast-style audio conversations
- **🔐 User Authentication** - Secure login with Supabase Auth
- **☁️ Cloud Storage** - Documents and progress stored in Supabase

## 🏗️ Architecture

This is a full-stack application with a clear separation between frontend and backend:

```
AkademIQ-Reviewer/
├── backend/              # FastAPI + Python
│   ├── app/
│   │   ├── api/         # API routes (auth, documents)
│   │   ├── core/        # Config & Supabase client
│   │   ├── schemas/     # Pydantic models
│   │   ├── services/    # AI, PDF, TTS services
│   │   └── utils/       # Prompts & helpers
│   ├── database/        # SQL migrations
│   └── requirements.txt
│
├── frontend/            # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── styles/      # CSS modules
│   │   └── ui/          # App shell
│   └── package.json
│
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** for backend
- **Node.js 16+** for frontend
- **Supabase account** for database & auth
- **Groq API key** for AI features

### 1. Clone the Repository

```bash
git clone https://github.com/JasonIversooon/AkademIQ-Reveiwer.git
cd AkademIQ-Reveiwer
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies (using pip)
pip install -r requirements.txt

# Or using Poetry
poetry install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_KEY=your_service_key
# GROQ_API_KEY=your_groq_key

# Run database migrations (see backend/database/)
# Apply SQL files to your Supabase project

# Start the server
uvicorn app.main:app --reload --port 8000
```

Backend will run at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint in src/config.ts
# Or create .env:
echo "VITE_API_BASE=http://localhost:8000" > .env

# Start development server
npm run dev
```

Frontend will run at `http://localhost:5173`

### 4. Access the Application

1. Open `http://localhost:5173` in your browser
2. Register a new account
3. Upload a PDF document
4. Explore the study features!

## 🎯 Core Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database & authentication
- **Groq** - AI model provider (via OpenRouter)
- **PyPDF2** - PDF text extraction
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing

## 📚 Key Workflows

### Document Upload Flow
1. User uploads PDF via frontend
2. Backend validates file (max 15 pages)
3. Text extracted using PyPDF2
4. Document stored in Supabase `documents` table
5. Document ID returned to frontend

### Flashcard Generation Flow
1. User selects document and difficulty
2. Frontend sends request to `/flashcards`
3. Backend fetches document content
4. AI generates Q&A pairs using Groq
5. Flashcards stored in `flashcards` table
6. Frontend displays interactive cards

### Quiz Generation Flow
1. User selects document and difficulty
2. Frontend sends request to `/quiz`
3. AI generates multiple-choice questions
4. Questions returned with explanations
5. User answers and receives instant feedback

### Explanation Flow
1. User selects document and explanation style
2. Backend generates explanation via AI
3. Explanation stored in `explanations` table
4. Cached for future requests (same style)

### Podcast Generation Flow
1. User selects document and voice preferences
2. Backend generates conversational script via AI
3. TTS service converts to audio (male/female voices)
4. Audio files stored and returned for playback

## 🗄️ Database Schema

The application uses Supabase with the following tables:

- **`documents`** - Uploaded PDFs with extracted text
- **`flashcards`** - Generated flashcards linked to documents
- **`explanations`** - Cached explanations per style
- **`quiz_results`** - User quiz attempts and scores
- **`podcast_scripts`** - Generated podcast content and audio URLs

See `backend/database/` for SQL migration files.

## 🔐 Environment Variables

### Backend (`.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GROQ_API_KEY=your_groq_api_key
AI_MODEL=openai/gpt-oss-20b
TTS_MODEL=playai-tts
MAX_PDF_PAGES=15
```

### Frontend (`.env`)
```env
VITE_API_BASE=http://localhost:8000
```

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Test TTS
python test_tts.py

# Test Groq API
python debug_groq_api.py

# Test authentication
python debug_auth.py

# Run pytest suite
pytest
```

### Frontend
```bash
cd frontend
npm run build  # Check for TypeScript errors
```

## 📦 Deployment

### Backend Deployment
- Deploy to **Render**, **Railway**, or **Fly.io**
- Set environment variables
- Use production ASGI server (Gunicorn + Uvicorn)

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend Deployment
- Build: `npm run build`
- Deploy `dist/` folder to **Vercel**, **Netlify**, or **AWS S3**
- Set `VITE_API_BASE` to production backend URL

## 🐛 Troubleshooting

### Backend Issues

**Database connection failed**
- Verify Supabase credentials in `.env`
- Check if tables exist (run migrations)

**AI generation not working**
- Verify `GROQ_API_KEY` is set
- Check API quota/rate limits

**PDF upload fails**
- Check file size and page count (max 15 pages)
- Verify `python-multipart` is installed

### Frontend Issues

**Cannot connect to API**
- Check if backend is running
- Verify `VITE_API_BASE` in config.ts
- Check CORS settings on backend

**Authentication not persisting**
- Check browser localStorage
- Token should be saved as `akademiq_token`

**Build errors**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `rm -rf node_modules && npm install`

## 🛣️ Roadmap

- [ ] Add more AI model providers (OpenAI, Anthropic)
- [ ] Implement spaced repetition algorithm
- [ ] Add collaborative study groups
- [ ] Mobile app (React Native)
- [ ] Export flashcards to Anki format
- [ ] Support for more document formats (DOCX, PPT)
- [ ] Real-time quiz multiplayer mode
- [ ] Progress analytics dashboard

## 📄 License

This project is for educational purposes. Feel free to use and modify!

## 👥 Contributors

- **Jason Iversooon** - Initial development

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Groq for AI capabilities
- FastAPI and React communities

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Happy Learning! 🎓✨**
