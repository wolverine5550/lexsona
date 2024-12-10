-- Update the product
UPDATE products 
SET name = 'Lexsona Premium',
    description = 'Unlimited matches and advanced features',
    metadata = jsonb_build_object('tier', 'premium')
WHERE metadata->>'tier' = 'pro';

-- Update the price
UPDATE prices
SET description = 'Premium Tier - Monthly',
    unit_amount = 3500,
    metadata = jsonb_build_object('tier', 'premium')
WHERE metadata->>'tier' = 'pro';

-- Remove any basic/free tier entries as they're not needed
DELETE FROM prices WHERE metadata->>'tier' = 'basic';
DELETE FROM products WHERE metadata->>'tier' = 'basic'; 