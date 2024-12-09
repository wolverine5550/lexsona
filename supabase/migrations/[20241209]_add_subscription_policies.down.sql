-- Remove RLS policies for subscriptions table
drop policy if exists "Can insert subscriptions" on subscriptions;
drop policy if exists "Can update subscriptions" on subscriptions;

-- Remove RLS policies for customers table
drop policy if exists "Can insert customers" on customers;
drop policy if exists "Can update customers" on customers; 