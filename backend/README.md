# AcademIQ Reviewer Backend

Production-ready FastAPI backend with Supabase persistence, Groq AI integration, and TTS capabilities.

## 🚀 Features (Fully Implemented)

### Core Features
- ✅ **User Authentication** - Registration & login via Supabase Auth
- ✅ **PDF Document Management** - Upload, store, and list PDFs (max 15 pages)
- ✅ **Smart Flashcards** - AI-generated Q&A flashcards with status tracking (new, mastered, later)
- ✅ **Explanation Generator** - Multi-style explanations (simple, detailed, bullet points)
- ✅ **Quiz System** - Multiple-choice quizzes with scoring and feedback
- ✅ **Podcast Generator** - AI-generated conversational scripts with TTS audio
- ✅ **Document Cleanup** - Automatic cleanup of old documents (7 days)

### AI Integration
- **Provider**: Groq API (via OpenRouter)
- **Model**: `openai/gpt-oss-20b` (configurable)
- **TTS Model**: `playai-tts` with multiple voice options

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── api/                    # API route handlers
│   │   ├── auth.py            # Authentication endpoints
│   │   └── documents.py       # Document & feature endpoints
│   ├── core/                   # Core configuration
│   │   ├── config.py          # Settings management
│   │   └── supabase_client.py # Database client
│   ├── schemas/                # Pydantic models
│   │   ├── auth.py            # Auth request/response models
│   │   └── documents.py       # Document & feature models
│   ├── services/               # Business logic
│   │   ├── ai_client.py       # Groq AI integration
│   │   ├── pdf_extractor.py  # PDF text extraction
│   │   └── tts_client.py      # Text-to-speech service
│   └── utils/
│       └── prompts.py         # AI prompt templates
├── database/                   # SQL migration files
│   ├── create_podcast_scripts_table.sql
│   └── create_podcast_scripts_table_mvp.sql
├── audio_output/              # Generated TTS audio files
├── test_output/               # Test audio samples
├── requirements.txt           # Pip dependencies
├── pyproject.toml            # Poetry configuration
└── README.md                 # This file
```

## 🛠️ Tech Stack

- **FastAPI 0.110.0** - Modern async web framework
- **Supabase 2.4.0** - PostgreSQL database & authentication
- **Groq API** - AI model provider (OpenRouter compatible)
- **PyPDF2 3.0.0** - PDF text extraction
- **Pydantic 2.7.0** - Data validation
- **Uvicorn 0.30.0** - ASGI server

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.10 - 3.12
- Supabase account and project
- Groq API key (from groq.com)

### 1. Install Dependencies

**Using Poetry (Recommended):**
```bash
cd backend
poetry install
```

**Using pip:**
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# AI Configuration
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=openai/gpt-oss-20b

# App Configuration
MAX_PDF_PAGES=15
```

### 3. Database Setup

Run the following SQL commands in your Supabase SQL editor to create the required tables:

#### Core Tables

```sql
-- Documents table (stores uploaded PDFs and extracted text)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token TEXT NOT NULL,
  filename TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  content TEXT NOT NULL,
  pdf_data TEXT,                    -- Base64 encoded PDF (optional)
  file_size INTEGER,                -- File size in bytes
  is_active BOOLEAN DEFAULT true,   -- For soft deletion
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'mastered', 'later')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explanations table (cached by style)
CREATE TABLE explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  answers INTEGER[] NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcast scripts table
CREATE TABLE podcast_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  speaker1 TEXT NOT NULL,
  speaker2 TEXT NOT NULL,
  dialogue JSONB NOT NULL,
  voice_option TEXT NOT NULL CHECK (voice_option IN ('male-male', 'female-female', 'male-female')),
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_documents_user_token ON documents(user_token);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_flashcards_document_id ON flashcards(document_id);
CREATE INDEX idx_quizzes_document_id ON quizzes(document_id);
CREATE INDEX idx_podcast_scripts_document_id ON podcast_scripts(document_id);
```

**Note**: RLS (Row Level Security) is disabled for MVP. Enable in production for better security.

### 4. Run the Development Server

**Using Poetry:**
```bash
poetry run uvicorn app.main:app --reload --port 8000
```

**Using uvicorn directly:**
```bash
uvicorn app.main:app --reload --port 8000
```

**For production:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

## 📡 API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - User login

### Documents
- `POST /documents/upload` - Upload PDF document
- `GET /documents/list` - List user's documents
- `POST /documents/cleanup` - Cleanup old documents (>7 days)

### Flashcards
- `POST /documents/{document_id}/flashcards/generate` - Generate flashcards
- `GET /documents/{document_id}/flashcards` - List flashcards
- `PATCH /flashcards/{flashcard_id}` - Update flashcard status

### Quiz
- `POST /documents/{document_id}/quiz/generate` - Generate quiz
- `POST /quiz/{quiz_id}/submit` - Submit quiz answers

### Explanations
- `POST /documents/{document_id}/explain` - Generate explanation

### Podcast (TTS)
- `POST /documents/{document_id}/generate-podcast` - Generate podcast script
- `POST /podcast/{script_id}/generate-audio` - Generate TTS audio
- `GET /audio/stream/{script_id}/{line_index}` - Stream audio line

### Health
- `GET /health` - Health check endpoint

## 🎨 AI Features Deep Dive

### 1. Flashcard Generation
- Uses Groq AI with custom prompt templates
- Supports 3 difficulty levels: easy, medium, hard
- Generates 12 flashcards by default (configurable)
- Returns JSON-formatted Q&A pairs
- Stores with status tracking (new, mastered, later)

**Example Request:**
```bash
curl -X POST http://localhost:8000/documents/{doc_id}/flashcards/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"count": 12, "difficulty": "medium"}'
```

### 2. Quiz Generation
- Multiple-choice questions with 4 options each
- Difficulty-based question count:
  - Easy: 8 questions
  - Medium: 12 questions
  - Hard: 15 questions
- Includes explanations for correct answers
- Tracks quiz attempts and scores

### 3. Explanation Generator
- Three styles available:
  - **Simple**: Beginner-friendly language
  - **Detailed**: Comprehensive explanations
  - **Bullet Points**: Quick reference format
- Results cached in database per style

### 4. Podcast Generator
- Generates conversational dialogue between two speakers
- Three voice pairing options:
  - `male-male`: Fritz + Mikail
  - `female-female`: Cheyenne + Deedee
  - `male-female`: Fritz + Cheyenne
- Uses Groq's PlayAI TTS service
- Generates 6-10 exchanges (optimized for token efficiency)
- Audio saved as WAV files in `audio_output/`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Your Supabase project URL | - | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | - | Yes |
| `GROQ_API_KEY` | Groq API key for AI features | - | Yes |
| `AI_MODEL` | AI model to use | `openai/gpt-oss-20b` | No |
| `TTS_MODEL` | TTS model to use | `playai-tts` | No |
| `MAX_PDF_PAGES` | Maximum PDF page limit | `15` | No |

### AI Model Configuration

The backend uses Groq API which supports multiple models. To change the model, update `AI_MODEL` in `.env`:

```env
AI_MODEL=openai/gpt-oss-20b          # Current default
# AI_MODEL=anthropic/claude-3-haiku  # Alternative
# AI_MODEL=meta-llama/llama-3-8b     # Alternative
```

## 🧪 Testing

### Test Files
- `test_tts.py` - Test TTS functionality
- `debug_groq_api.py` - Test Groq API connection
- `debug_auth.py` - Test authentication
- `test_existing.py` - Test existing documents

### Run Tests

```bash
# Test TTS service
python test_tts.py

# Test Groq API
python debug_groq_api.py

# Test authentication
python debug_auth.py
```

## 🐛 Common Issues & Solutions

### 1. Groq API Errors
**Problem**: `GROQ_API_KEY not set` or API errors

**Solution**: 
- Verify `.env` file exists and has valid `GROQ_API_KEY`
- Check API key at https://console.groq.com
- Ensure `.env` is in the `backend/` directory

### 2. Supabase Connection Failed
**Problem**: Can't connect to database

**Solution**:
- Verify Supabase credentials in `.env`
- Check if Supabase project is active
- Ensure tables are created (run SQL migrations)

### 3. PDF Upload Fails
**Problem**: "Failed to parse PDF" error

**Solution**:
- Ensure file is valid PDF format
- Check page count (max 15 pages)
- Verify `python-multipart` is installed

### 4. TTS Generation Fails
**Problem**: Audio generation errors

**Solution**:
- Check Groq API quota/rate limits
- Verify text length (max 10K characters per line)
- Ensure voice names are correct (see `AVAILABLE_VOICES` in `tts_client.py`)

### 5. Database Table Not Found
**Problem**: `relation "table_name" does not exist`

**Solution**:
- Run SQL migrations in Supabase SQL editor
- Check if all tables are created properly
- Verify table names match code (case-sensitive)

## 📊 Database Schema Summary

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `documents` | Store uploaded PDFs | id, user_token, filename, content |
| `flashcards` | Store generated flashcards | id, document_id, question, answer, status |
| `explanations` | Cache explanations | id, document_id, style, content |
| `quizzes` | Store quiz questions | id, document_id, difficulty, questions |
| `quiz_attempts` | Track quiz results | id, quiz_id, score, percentage |
| `podcast_scripts` | Store podcast scripts | id, document_id, dialogue, voice_option |

## 🚀 Deployment

### Production Checklist
- [ ] Set environment variables on hosting platform
- [ ] Enable Supabase RLS (Row Level Security)
- [ ] Use production ASGI server (Gunicorn + Uvicorn workers)
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS for production frontend domain
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting
- [ ] Set up backup strategy for Supabase

### Deployment Command
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📝 Development Guidelines

### Adding a New Feature
1. Create Pydantic schemas in `app/schemas/`
2. Add business logic in `app/services/`
3. Create API endpoints in `app/api/`
4. Update database schema if needed
5. Add tests
6. Update this README

### Code Style
- Follow PEP 8 style guide
- Use type hints
- Add docstrings for complex functions
- Keep functions focused and small

## 📄 License

Part of the AcademIQ Reviewer project. For educational purposes.

## 🙏 Acknowledgments

- FastAPI for the amazing framework
- Supabase for backend infrastructure
- Groq for AI and TTS capabilities

