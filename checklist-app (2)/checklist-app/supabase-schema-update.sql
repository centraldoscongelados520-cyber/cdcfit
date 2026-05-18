-- Execute isso no SQL Editor do Supabase

-- 1. Adiciona coluna de estoque nos itens
alter table public.items add column if not exists stock_quantity integer default 0;

-- 2. Cria tabela de retiradas
create table if not exists public.withdrawals (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade,
  item_name text not null,
  category text not null,
  quantity integer not null,
  person text not null check (person in ('Thais', 'Tawana')),
  created_at timestamp with time zone default now() not null
);

alter table public.withdrawals enable row level security;

create policy "Acesso público withdrawals" on public.withdrawals
  for all using (true) with check (true);

alter publication supabase_realtime add table public.withdrawals;

-- 3. Adiciona categoria limpeza no check constraint
alter table public.items drop constraint if exists items_category_check;
alter table public.items add constraint items_category_check
  check (category in ('doces','frutas','graos','hortifruti','industrializados','laticinios','proteinas','temperos','limpeza'));

-- 4. Insere itens de limpeza
insert into public.items (name, category, checked, stock_quantity) values
  ('Detergente', 'limpeza', false, 0),
  ('Água sanitária', 'limpeza', false, 0),
  ('Esponja multiuso', 'limpeza', false, 0),
  ('Desinfetante', 'limpeza', false, 0),
  ('Papel higiênico', 'limpeza', false, 0),
  ('Bucha de aço', 'limpeza', false, 0),
  ('Perflex', 'limpeza', false, 0);
