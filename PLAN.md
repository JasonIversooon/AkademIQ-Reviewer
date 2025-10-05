# 📘 AcademIQ Reviewer – Project Plan (MVP)

## 1. Core Concept
AcademIQ Reviewer is an AI-powered study platform where users can upload PDFs (each limited to 10 pages) and transform them into personalized, interactive review materials.  
It combines productivity tools (Pomodoro), AI-enhanced learning aids (flashcards, quizzes, explanations, visualization), and content transformation (podcast narration).  
Heavy processing is offloaded to APIs to reduce local resource usage, making it suitable for free hosting environments.

---

## 2. Key Features

### A. PDF Upload & Processing
- Users can upload **multiple PDFs**.  
- Each PDF is limited to **10 pages maximum**.  
- Text is parsed and passed **directly to LLM APIs** (no local heavy lifting).  
- Content is temporarily stored for session usage.  

### B. Pomodoro Mode (Optional)
- Timer (displayed on the top-right corner).  
- Customizable by the user (set duration and repetitions).  
- Session tracking and productivity analytics.  

### C. Learning Tools
1. **Flashcards**  
   - AI generates Q&A cards from uploaded material via API.  
   - Users can mark cards as “mastered” or “review later.”  

2. **Quiz Mode**  
   - Auto-generated quizzes (multiple-choice, true/false, short answer).  
   - Custom difficulty levels.  
   - Score tracking per session.  

3. **Explain Mode**  
   - AI explains content in **different tones/styles**:  
     - Layman’s terms  
     - College professor  
     - Industry professional  
   - Optional **Visualize toggle**:  
     - Uses Gemini API for image generation.  
     - Extracts **core concepts only** to generate diagrams/illustrations.  
     - Users can prompt to embed generated images into their reviewer section.   

4. **Podcast Mode**  
   - AI converts PDF text into a spoken “review script.”  
   - Narration via **AI-generated voices**.  
   - **Voice Selection**: Users can choose from different AI voices.   
   - Option for conversational or lecture-style delivery.  

---

## 3. Technology Stack

### A. Backend
- **FastAPI / Flask** → Lightweight API backend (just routing & calls to external APIs).  
- No heavy local processing to keep hosting requirements low.  

### B. AI & APIs
- **Text Generation**: OpenAI / Gemini API  
- **Image Generation**: Gemini API (core concept visualizations)  
- **Voice Generation**: ElevenLabs / Microsoft TTS / Dia TTS (with voice selection) via API 
- **Quiz & Flashcards**: LLM-powered via API  

### C. Frontend
- **React / Next.js** → User interface  
- Flashcards UI, quiz interface, Pomodoro timer, reviewer section with embedded images.  
- Audio player with **voice selection dropdown** for podcast playback.  

### D. Database
- **Lightweight (SQLite / MongoDB Atlas free tier)** → Store user sessions, PDF metadata, and progress.  


---

## 4. User Flow

1. **Upload PDF** (unlimited count, but each capped at 10 pages).  
2. System extracts text → sends to APIs.  
3. **Choose Mode**:  
   - Review with flashcards  
   - Take quizzes  
   - Request explanations (with optional visualization)  
   - Listen via podcast narration (with voice selection)  
4. Optional **Pomodoro Timer** → track study session.  
5. Save limited progress (flashcards, quizzes, explanations).  
 