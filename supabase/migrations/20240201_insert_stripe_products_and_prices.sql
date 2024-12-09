-- First, insert the products
INSERT INTO products (id, active, name, description, metadata)
VALUES 
  ('prod_basic', true, 'Basic Tier', 'Up to 10 matches per month and basic email templates', jsonb_build_object('tier', 'basic')),
  ('prod_pro', true, 'Pro Tier', 'Unlimited matches and advanced features', jsonb_build_object('tier', 'pro'))
ON CONFLICT (id) DO UPDATE SET
  active = EXCLUDED.active,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata;

-- Then, insert the prices
INSERT INTO prices (
  id,
  product_id,
  active,
  description,
  unit_amount,
  currency,
  type,
  interval,
  interval_count,
  metadata
)
VALUES 
  (
    'price_1QKiQOGpIvNFS5niElyz0iaX',
    'prod_basic',
    true,
    'Basic Tier - Monthly',
    500,
    'usd',
    'recurring',
    'month',
    1,
    jsonb_build_object('tier', 'basic')
  ),
  (
    'price_1QKiQxGpIvNFS5niDOMe2IV0',
    'prod_pro',
    true,
    'Pro Tier - Monthly',
    1000,
    'usd',
    'recurring',
    'month',
    1,
    jsonb_build_object('tier', 'pro')
  )
ON CONFLICT (id) DO UPDATE SET
  active = EXCLUDED.active,
  description = EXCLUDED.description,
  unit_amount = EXCLUDED.unit_amount,
  currency = EXCLUDED.currency,
  type = EXCLUDED.type,
  interval = EXCLUDED.interval,
  interval_count = EXCLUDED.interval_count,
  metadata = EXCLUDED.metadata; 