/** 
* USERS
* Note: This table contains user data. Users should only be able to view and update their own data.
*/
create table users (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  -- The customer's billing address, stored in JSON format.
  billing_address jsonb,
  -- Stores your customer's payment instruments.
  payment_method jsonb
);
alter table users enable row level security;
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/ 
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* CUSTOMERS
* Note: this is a private table that contains a mapping of user IDs to Stripe customer IDs.
*/
create table customers (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  -- The user's customer ID in Stripe. User must not be able to update this.
  stripe_customer_id text
);
alter table customers enable row level security;
-- No policies as this is a private table that the user must not have access to.

/** 
* PRODUCTS
* Note: products are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create table products (
  -- Product ID from Stripe, e.g. prod_1234.
  id text primary key,
  -- Whether the product is currently available for purchase.
  active boolean,
  -- The product's name, meant to be displayable to the customer. Whenever this product is sold via a subscription, name will show up on associated invoice line item descriptions.
  name text,
  -- The product's description, meant to be displayable to the customer. Use this field to optionally store a long form explanation of the product being sold for your own rendering purposes.
  description text,
  -- A URL of the product image in Stripe, meant to be displayable to the customer.
  image text,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table products enable row level security;
create policy "Allow public read-only access." on products for select using (true);

/**
* PRICES
* Note: prices are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');
create table prices (
  -- Price ID from Stripe, e.g. price_1234.
  id text primary key,
  -- The ID of the prduct that this price belongs to.
  product_id text references products, 
  -- Whether the price can be used for new purchases.
  active boolean,
  -- A brief description of the price.
  description text,
  -- The unit amount as a positive integer in the smallest currency unit (e.g., 100 cents for US$1.00 or 100 for ¥100, a zero-decimal currency).
  unit_amount bigint,
  -- Three-letter ISO currency code, in lowercase.
  currency text check (char_length(currency) = 3),
  -- One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
  type pricing_type,
  -- The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
  interval pricing_plan_interval,
  -- The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
  interval_count integer,
  -- Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
  trial_period_days integer,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table prices enable row level security;
create policy "Allow public read-only access." on prices for select using (true);

/**
* SUBSCRIPTIONS
* Note: subscriptions are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
create table subscriptions (
  -- Subscription ID from Stripe, e.g. sub_1234.
  id text primary key,
  user_id uuid references auth.users not null,
  -- The status of the subscription object, one of subscription_status type above.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this subscription.
  price_id text references prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  -- If the subscription has ended, the timestamp of the date the subscription ended.
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table subscriptions enable row level security;
create policy "Can only view own subs data." on subscriptions for select using (auth.uid() = user_id);

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table products, prices;

/**
* AUTHOR_PROFILES
* Note: This table contains additional author-specific information
*/
create table author_profiles (
  id uuid references auth.users not null primary key,
  bio text,
  expertise text[],
  target_topics text[],
  social_links jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table author_profiles enable row level security;
create policy "Can view own author profile." on author_profiles for select using (auth.uid() = id);
create policy "Can update own author profile." on author_profiles for update using (auth.uid() = id);

/**
* BOOKS
* Note: Authors can have multiple books
*/
create table books (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references auth.users not null,
  title text not null,
  description text,
  genre text[],
  target_audience text[],
  cover_url text,
  keywords text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table books enable row level security;
create policy "Can view own books." on books for select using (auth.uid() = author_id);
create policy "Can update own books." on books for update using (auth.uid() = author_id);
create policy "Can create own books." on books for insert with check (auth.uid() = author_id);
create policy "Can delete own books." on books for delete using (auth.uid() = author_id);

/**
* PODCASTS
* Note: Caches podcast data from Listen Notes API to reduce API calls
* and improve performance
*/
create table podcasts (
  id text primary key,                    -- Listen Notes podcast ID
  title text not null,                    -- Podcast title
  publisher text not null,                -- Publisher/Network name
  image text,                            -- Cover image URL
  description text,                      -- Podcast description
  website text,                          -- Podcast website URL
  language text,                         -- Language code (e.g., 'en')
  categories jsonb,                      -- Array of category objects {id, name}
  total_episodes integer,                -- Total number of episodes
  listen_score integer,                  -- Listen Notes popularity score
  explicit_content boolean,              -- Whether podcast has explicit content
  latest_episode_id text,                -- ID of most recent episode
  latest_pub_date_ms bigint,            -- Publication timestamp of latest episode
  cached_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

/**
* PODCAST_MATCHES
* Note: Stores matches between authors' books and podcasts
* Includes match scoring and outreach status tracking
*/
create table podcast_matches (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references auth.users(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  podcast_id text references podcasts(id) on delete cascade,
  score decimal not null,                -- Match relevance score (0-1)
  match_reasons text[] not null,         -- Array of reasons for the match
  status text not null check (
    status in (
      'pending',                         -- Initial match state
      'contacted',                       -- Outreach email sent
      'responded',                       -- Host has responded
      'scheduled',                       -- Interview scheduled
      'completed',                       -- Interview completed
      'rejected',                        -- Host declined/no response
      'archived'                         -- Match archived by author
    )
  ) default 'pending',
  notes text,                           -- Author's notes about the match
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for query optimization
create index if not exists podcasts_latest_pub_date_idx on podcasts(latest_pub_date_ms);
create index if not exists podcast_matches_author_book_idx on podcast_matches(author_id, book_id);
create index if not exists podcast_matches_status_idx on podcast_matches(status);

-- Add RLS policies
alter table podcasts enable row level security;
alter table podcast_matches enable row level security;

-- Podcasts table policies
create policy "Podcasts are viewable by everyone"
  on podcasts for select using (true);

-- Podcast matches policies
create policy "Users can view own matches"
  on podcast_matches for select using (auth.uid() = author_id);

create policy "Users can create own matches"
  on podcast_matches for insert with check (auth.uid() = author_id);

create policy "Users can update own matches"
  on podcast_matches for update using (auth.uid() = author_id);

create policy "Users can delete own matches"
  on podcast_matches for delete using (auth.uid() = author_id);