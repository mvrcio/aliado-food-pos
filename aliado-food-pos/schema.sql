-- ALIADO FOOD POS · Supabase (SQL Editor > Run)
create type app_role as enum ('ceo','ops','chef','ajud','compras','estafeta','conta');
create table profiles(id uuid primary key references auth.users on delete cascade,name text not null,role app_role not null,active bool default true);
create table products(id bigserial primary key,name text not null,cat text not null,price numeric not null,active bool default true);
create table stock_items(id bigserial primary key,name text not null,unit text not null,qty numeric default 0,min numeric default 0);
create table customers(phone text primary key,name text,points int default 0);
create table orders(id bigserial primary key,created_at timestamptz default now(),type text not null,pay text not null,status text default 'novo',
 items jsonb not null,total numeric not null,disc numeric default 0,customer_phone text,customer_name text,addr text,courier uuid references profiles(id),created_by uuid default auth.uid());
create table expenses(id bigserial primary key,created_at timestamptz default now(),descr text,value numeric not null,created_by uuid default auth.uid());
create table push_subscriptions(id bigserial primary key,user_id uuid default auth.uid() references profiles(id) on delete cascade,sub jsonb not null,unique(user_id,sub));

create function my_role() returns app_role language sql stable security definer set search_path=public as $$select role from profiles where id=auth.uid() and active$$;
alter table profiles enable row level security;alter table products enable row level security;alter table stock_items enable row level security;
alter table customers enable row level security;alter table orders enable row level security;alter table expenses enable row level security;alter table push_subscriptions enable row level security;

create policy p_self on profiles for select using(id=auth.uid() or my_role() in('ceo','ops'));
create policy p_ceo on profiles for all using(my_role()='ceo') with check(my_role()='ceo');
create policy pr_r on products for select using(my_role() is not null);
create policy pr_w on products for all using(my_role()='ceo') with check(my_role()='ceo');
create policy st_r on stock_items for select using(my_role() in('ceo','ops','chef','compras'));
create policy st_w on stock_items for all using(my_role() in('ceo','ops','compras')) with check(my_role() in('ceo','ops','compras'));
create policy cu_all on customers for all using(my_role()='ceo') with check(my_role()='ceo');
create policy or_r on orders for select using(my_role() in('ceo','ops','chef','ajud','estafeta','conta'));
create policy or_i on orders for insert with check(my_role()='ceo');
create policy or_u on orders for update using(my_role() in('ceo','ops','chef','ajud','estafeta'));
create policy ex_r on expenses for select using(my_role() in('ceo','ops','conta'));
create policy ex_i on expenses for insert with check(my_role() in('ceo','ops','compras'));
create policy ps_own on push_subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid());

alter publication supabase_realtime add table orders,stock_items;
-- Depois de criar o utilizador do CEO em Authentication > Users, execute:
-- insert into profiles(id,name,role) values('<UUID_DO_CEO>','Nome do CEO','ceo');
