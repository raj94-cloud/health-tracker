-- Enable RLS
create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  image_url text not null,
  detected_items text[] default '{}',
  analysis_text text,
  logged_at timestamptz default now(),
  meal_date date default current_date
);

alter table meals enable row level security;

create policy "Users see own meals" on meals
  for all using (auth.uid() = user_id);

-- Storage bucket (run in Supabase dashboard Storage settings)
-- Create a bucket named "meals" with public read access
