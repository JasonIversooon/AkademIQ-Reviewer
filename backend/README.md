# AcademIQ Reviewer Backend

FastAPI backend with Supabase persistence and AI feature stubs.

## Features (Current)
- User registration & login via Supabase Auth
- PDF upload (page limit enforced) -> stored in Supabase table `documents`
- Flashcard generation (stubbed) -> stored in `flashcards`
- Explanation generation (stubbed) -> stored in `explanations`

## Setup
1. Copy `.env.example` to `.env` and fill values.
2. Ensure Supabase project has tables:

```sql
create table documents (
  id uuid primary key,
  user_token text,
  filename text,
  page_count int,
  content text,
  created_at timestamp default now()
);

create table flashcards (
  id text primary key,
  document_id uuid references documents(id) on delete cascade,
  question text,
  answer text,
  status text,
  created_at timestamp default now()
);

create table explanations (
  id uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  style text,
  content text,
  created_at timestamp default now()
);
```

3. (Optional) Add RLS later; for MVP you may disable RLS or keep open.

4. Install dependencies (using Poetry):

```bash
poetry install
poetry run uvicorn app.main:app --reload
```

## Roadmap Next
- Replace AI stubs with real OpenAI / Gemini calls
- Add status update for flashcards
- Add caching for explanations per style
- Add quiz generation endpoint
- Add audio/podcast generation job queue

