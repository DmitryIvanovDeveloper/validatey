-- Add user role for EcoTrack Pro project owner
-- This user owns the "EcoTrack Pro - Corporate Sustainability Intelligence" project
-- but was missing from the user_roles table

INSERT INTO user_roles (user_id, role)
VALUES ('4cc56fc4-3814-4c0b-9ac9-6168fc2795c4', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the user was added
SELECT user_id, role FROM user_roles WHERE user_id = '4cc56fc4-3814-4c0b-9ac9-6168fc2795c4';