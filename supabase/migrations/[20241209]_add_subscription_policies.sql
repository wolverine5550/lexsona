-- Add RLS policies for subscriptions table
create policy "Can insert subscriptions." 
  on subscriptions for insert
  with check (true);  -- Allow inserts from webhook

create policy "Can update subscriptions." 
  on subscriptions for update
  using (true);  -- Allow updates from webhook

-- Add RLS policies for customers table
create policy "Can insert customers." 
  on customers for insert
  with check (true);  -- Allow inserts from webhook

create policy "Can update customers." 
  on customers for update
  using (true);  -- Allow updates from webhook 