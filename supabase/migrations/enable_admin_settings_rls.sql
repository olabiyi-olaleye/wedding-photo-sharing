-- Enable RLS on admin_settings table
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to prevent unauthorized access
-- Only allow access if user is authenticated as admin (through JWT validation in app)
CREATE POLICY "Prevent public access to admin_settings" ON admin_settings
  AS RESTRICTIVE
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create policy to allow admin operations (authenticated via JWT token in app)
CREATE POLICY "Allow authenticated admin access" ON admin_settings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON POLICY "Prevent public access to admin_settings" ON admin_settings 
  IS 'Default deny policy - all access is restricted';

COMMENT ON POLICY "Allow authenticated admin access" ON admin_settings 
  IS 'Allow access only to authenticated users (JWT validation happens in app)';
