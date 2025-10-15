# AI Podcast Feature Setup

## Overview
The AI Podcast feature generates conversational podcast scripts from document content with two AI speakers. Users can choose from three voice combinations:
- Male-Male
- Female-Female  
- Male-Female

## Database Setup

### 1. Create the podcast_scripts table
Run the SQL script in your Supabase database:

```bash
cd backend/database
# Execute the SQL file in your Supabase SQL editor or run:
psql -h your-supabase-host -d your-database -f create_podcast_scripts_table.sql
```

### 2. Table Schema
The `podcast_scripts` table includes:
- `id`: Unique identifier for each script
- `document_id`: Reference to the source document
- `speaker1`: Name of the first speaker
- `speaker2`: Name of the second speaker  
- `dialogue`: JSONB array of dialogue lines with speaker and text
- `voice_option`: Selected voice combination
- `audio_url`: Future TTS audio file URL (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## API Endpoints

### Generate Podcast Script
```
POST /api/documents/{document_id}/generate-podcast
Authorization: Bearer {token}
Content-Type: application/json

{
  "voice_option": "male-female"
}
```

**Response:**
```json
{
  "id": "uuid",
  "speaker1": "Marcus",
  "speaker2": "Lisa", 
  "dialogue": [
    {
      "speaker": 1,
      "text": "Welcome to our discussion about..."
    },
    {
      "speaker": 2, 
      "text": "That's a great point, Marcus..."
    }
  ],
  "audio_url": null
}
```

## Frontend Components

### PodcastPanel.tsx
Main component featuring:
- Voice option selection (Male-Male, Female-Female, Male-Female)
- Script generation with loading states
- Regenerate script functionality
- Script display with speaker differentiation
- Future audio player integration

### PodcastPanel.css
Unified styling matching other feature panels:
- Clean header with back navigation
- Voice selection cards
- Script dialogue formatting
- Responsive design
- Audio player styling (ready for TTS integration)

## Voice Options

| Option | Speaker 1 | Speaker 2 |
|--------|-----------|-----------|
| male-male | Alex | David |
| female-female | Sarah | Emma |
| male-female | Marcus | Lisa |

## Future Enhancements

1. **Text-to-Speech Integration**: Generate actual audio files using TTS services
2. **Custom Speaker Names**: Allow users to customize speaker names
3. **Script Editing**: Enable inline editing of generated scripts
4. **Export Options**: PDF/text export of scripts
5. **Audio Controls**: Play/pause, speed adjustment, chapter navigation

## Technical Notes

- Scripts are limited to 15 dialogue exchanges for optimal length
- Content is truncated to 4000 characters for AI processing
- All scripts are stored in the database for future retrieval
- Row Level Security (RLS) ensures users only access their own scripts