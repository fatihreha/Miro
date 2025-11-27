-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Add location columns to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;

-- Create index for faster location queries
CREATE INDEX IF NOT EXISTS idx_users_location 
ON users USING GIST (ll_to_earth(latitude, longitude));

-- Function to get nearby users
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_id UUID,
  radius_km INTEGER DEFAULT 10,
  sport_filter TEXT DEFAULT NULL,
  level_filter TEXT DEFAULT NULL,
  min_age INTEGER DEFAULT NULL,
  max_age INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  distance_km NUMERIC,
  sport TEXT,
  level TEXT,
  age INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.name,
    u.avatar_url,
    ROUND(
      (earth_distance(
        ll_to_earth(u.latitude, u.longitude),
        ll_to_earth(current_user.latitude, current_user.longitude)
      ) / 1000)::NUMERIC, 
      2
    ) AS distance_km,
    COALESCE(u.interests[1], 'Unknown') AS sport,
    u.level,
    u.age
  FROM users u
  CROSS JOIN users current_user
  WHERE current_user.id = user_id
    AND u.id != user_id
    AND u.show_location = true
    AND u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    AND (sport_filter IS NULL OR sport_filter = ANY(u.interests))
    AND (level_filter IS NULL OR u.level = level_filter)
    AND (min_age IS NULL OR u.age >= min_age)
    AND (max_age IS NULL OR u.age <= max_age)
  HAVING distance_km <= radius_km
  ORDER BY distance_km ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_nearby_users TO authenticated;

-- RLS policy for location data
CREATE POLICY "Users can update own location"
ON users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can see others' location if show_location is true"
ON users
FOR SELECT
USING (
  show_location = true 
  OR auth.uid() = id
);
