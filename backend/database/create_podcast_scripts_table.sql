-- Create podcast_scripts table for storing AI-generated podcast scripts
CREATE TABLE IF NOT EXISTS podcast_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    speaker1 TEXT NOT NULL,
    speaker2 TEXT NOT NULL,
    dialogue JSONB NOT NULL,
    voice_option TEXT NOT NULL CHECK (voice_option IN ('male-male', 'female-female', 'male-female')),
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_podcast_scripts_document_id ON podcast_scripts(document_id);
CREATE INDEX IF NOT EXISTS idx_podcast_scripts_created_at ON podcast_scripts(created_at);

-- Enable Row Level Security (RLS) if using Supabase
ALTER TABLE podcast_scripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (adjust according to your auth setup)
-- This assumes you have user authentication in place
CREATE POLICY "Users can view their own podcast scripts" ON podcast_scripts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = podcast_scripts.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own podcast scripts" ON podcast_scripts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = podcast_scripts.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own podcast scripts" ON podcast_scripts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = podcast_scripts.document_id 
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own podcast scripts" ON podcast_scripts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = podcast_scripts.document_id 
            AND documents.user_id = auth.uid()
        )
    );