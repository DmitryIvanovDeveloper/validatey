-- Миграция для добавления JSON полей feedback и timeline_feedback
-- Скопируйте и выполните этот SQL в Supabase SQL Editor

ALTER TABLE audio_analysis_sessions 
ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS timeline_feedback JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_feedback ON audio_analysis_sessions USING GIN (feedback);
CREATE INDEX IF NOT EXISTS idx_audio_analysis_sessions_timeline_feedback ON audio_analysis_sessions USING GIN (timeline_feedback);

COMMENT ON COLUMN audio_analysis_sessions.feedback IS 'Массив строк с feedback в формате JSON: ["text1", "text2", ...]';
COMMENT ON COLUMN audio_analysis_sessions.timeline_feedback IS 'Массив объектов timeline feedback в формате JSON: [{"seconds": 1.0, "comment": "...", "type": "...", ...}, ...]';


