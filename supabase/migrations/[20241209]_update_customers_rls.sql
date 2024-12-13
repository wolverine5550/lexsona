-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own customer data" ON customers;
DROP POLICY IF EXISTS "Enable insert for service role only" ON customers;
DROP POLICY IF EXISTS "Enable update for service role only" ON customers;

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own customer data
CREATE POLICY "Users can view their own customer data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for service role to insert customer data
CREATE POLICY "Enable insert for service role only"
ON customers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy for service role to update customer data
CREATE POLICY "Enable update for service role only"
ON customers
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true); 