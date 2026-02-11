-- SQL Schema for User Resources Feature
-- This creates the user_resources table for storing personalized feedback and learning materials

-- Create user_resources table
CREATE TABLE IF NOT EXISTS user_resources (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) DEFAULT 'feedback',  -- feedback, video, article, tip, exercise
    content TEXT,                                   -- Main content or URL
    priority VARCHAR(20) DEFAULT 'normal',          -- high, normal, low
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_resources_user_id ON user_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_resources_is_read ON user_resources(is_read);
CREATE INDEX IF NOT EXISTS idx_user_resources_created_at ON user_resources(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own resources
CREATE POLICY "Users can view own resources" ON user_resources
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own resources (mark as read)
CREATE POLICY "Users can update own resources" ON user_resources
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can insert resources for any user
-- (You may need to adjust this based on your admin authentication method)
CREATE POLICY "Admins can insert resources" ON user_resources
    FOR INSERT WITH CHECK (true);

-- Policy: Admins can delete resources
CREATE POLICY "Admins can delete resources" ON user_resources
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE user_resources IS 'Stores personalized learning resources sent by admins to individual users';
COMMENT ON COLUMN user_resources.resource_type IS 'Type of resource: feedback, video, article, tip, exercise';
COMMENT ON COLUMN user_resources.priority IS 'Priority level: high, normal, low';
