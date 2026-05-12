-- Execute isso no SQL Editor do Supabase
-- Passo 1: Criar tabela

create table public.items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null check (category in (
    'doces', 'frutas', 'graos', 'hortifruti',
    'industrializados', 'laticinios', 'proteinas', 'temperos'
  )),
  checked boolean default false not null,
  created_at timestamp with time zone default now() not null
);

-- Passo 2: Habilitar RLS com acesso público (sem login)
alter table public.items enable row level security;

create policy "Acesso público" on public.items
  for all using (true) with check (true);

-- Passo 3: Habilitar real-time
alter publication supabase_realtime add table public.items;

-- Passo 4: Popular com todos os itens da planilha

insert into public.items (name, category) values
  -- Doces e Apoio
  ('Bolacha maisena tradicional', 'doces'),
  ('Bolacha maisena diet', 'doces'),
  ('Chocolate diet', 'doces'),
  ('Chocolate meio amargo', 'doces'),

  -- Frutas
  ('Laranja pera', 'frutas'),
  ('Limão siciliano', 'frutas'),

  -- Grãos e Bases
  ('Arroz parbolizado tipo 1', 'graos'),
  ('Feijão carioca Pantera', 'graos'),
  ('Feijão preto Pantera', 'graos'),
  ('Macarrão fusili grão duro', 'graos'),
  ('Macarrão pene grão duro', 'graos'),
  ('Macarrão fusili ovo', 'graos'),
  ('Macarrão de yakissoba', 'graos'),
  ('Farinha de aveia', 'graos'),
  ('Farelo de aveia', 'graos'),
  ('Maisena', 'graos'),

  -- Hortifruti e Congelados
  ('Brócolis congelado', 'hortifruti'),
  ('Couve-flor congelada', 'hortifruti'),
  ('Vagem congelada', 'hortifruti'),
  ('Alho', 'hortifruti'),
  ('Cebola', 'hortifruti'),
  ('Tomate', 'hortifruti'),
  ('Salsinha', 'hortifruti'),
  ('Batata', 'hortifruti'),
  ('Alho-poró', 'hortifruti'),
  ('Pimentão', 'hortifruti'),
  ('Cabotiá', 'hortifruti'),
  ('Manjericão', 'hortifruti'),
  ('Couve', 'hortifruti'),

  -- Industrializados e Complementos
  ('Milho Bag', 'industrializados'),
  ('Palmito pupunha picado', 'industrializados'),
  ('Molho de tomate Bag Fugi', 'industrializados'),

  -- Laticínios e Derivados
  ('Leite desnatado', 'laticinios'),
  ('Creme de leite desnatado', 'laticinios'),
  ('Leite condensado', 'laticinios'),
  ('Mussarela Apolo', 'laticinios'),
  ('Queijo ralado Quatá ou Vigor', 'laticinios'),
  ('Cream cheese bisnaga 1kg', 'laticinios'),
  ('Margarina', 'laticinios'),

  -- Proteínas
  ('Ovo', 'proteinas'),
  ('Calabresa', 'proteinas'),
  ('Linguiça toscana', 'proteinas'),
  ('Sobrecoxa', 'proteinas'),
  ('Salmão', 'proteinas'),
  ('Tilápia', 'proteinas'),
  ('Patinho', 'proteinas'),
  ('Carne moída Boi Forte', 'proteinas'),
  ('Pernil sem osso e sem pele', 'proteinas'),
  ('Almôndega', 'proteinas'),

  -- Temperos e Condimentos
  ('Café', 'temperos'),
  ('Açúcar', 'temperos'),
  ('Óleo de soja', 'temperos'),
  ('Sal', 'temperos'),
  ('Páprica defumada', 'temperos'),
  ('Tempero seco (alho, cebola, salsa)', 'temperos'),
  ('Shoyu', 'temperos'),
  ('Molho de ostra', 'temperos'),
  ('Óleo de gergelim', 'temperos');
