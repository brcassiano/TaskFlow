-- SQL schema for Supabase

create table public.profiles (
	id uuid not null default extensions.uuid_generate_v4 (),
	email text null,
	name text null,
	created_at timestamp with time zone null default now(),
	phone text null,
	is_guest boolean null default true,
	link_code text null,
	created_via text null default 'web'::text,
	constraint profiles_pkey primary key (id),
	constraint profiles_email_key unique (email),
	constraint profiles_link_code_key unique (link_code),
	constraint profiles_phone_key unique (phone)
) TABLESPACE pg_default;

create index IF not exists idx_profiles_phone on public.profiles using btree (phone) TABLESPACE pg_default
where
	(phone is not null);

create index IF not exists idx_profiles_link_code on public.profiles using btree (link_code) TABLESPACE pg_default
where
	(link_code is not null);

create index IF not exists idx_profiles_is_guest on public.profiles using btree (is_guest) TABLESPACE pg_default;

create table public.tasks (
	id uuid not null default extensions.uuid_generate_v4 (),
	user_id text not null,
	title text not null,
	description text null,
	is_completed boolean null default false,
	created_at timestamp with time zone null default now(),
	updated_at timestamp with time zone null default now(),
	constraint tasks_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_tasks_completed on public.tasks using btree (is_completed) TABLESPACE pg_default;

create index IF not exists idx_tasks_created_at on public.tasks using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_tasks_user_id on public.tasks using btree (user_id) TABLESPACE pg_default;

create trigger tasks_updated_at BEFORE
update on tasks for EACH row
execute FUNCTION update_updated_at ();

create table public.chat_sessions (
	id uuid not null default gen_random_uuid (),
	user_phone text not null,
	is_active boolean null default true,
	created_at timestamp with time zone null default now(),
	last_interaction timestamp with time zone null default now(),
	context jsonb null default '{}'::jsonb,
	constraint chat_sessions_pkey primary key (id),
	constraint chat_sessions_user_phone_key unique (user_phone)
) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_phone on public.chat_sessions using btree (user_phone) TABLESPACE pg_default;

create index IF not exists idx_chat_sessions_active on public.chat_sessions using btree (is_active) TABLESPACE pg_default;
