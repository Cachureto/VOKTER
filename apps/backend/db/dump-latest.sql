--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_replaced_by_fkey;
ALTER TABLE IF EXISTS ONLY public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_units DROP CONSTRAINT IF EXISTS product_units_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY public.product_units DROP CONSTRAINT IF EXISTS product_units_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_unit_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.drop_waitlist DROP CONSTRAINT IF EXISTS drop_waitlist_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.drop_waitlist DROP CONSTRAINT IF EXISTS drop_waitlist_drop_id_fkey;
ALTER TABLE IF EXISTS ONLY public.drop_products DROP CONSTRAINT IF EXISTS drop_products_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.drop_products DROP CONSTRAINT IF EXISTS drop_products_drop_id_fkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authenticity_checks DROP CONSTRAINT IF EXISTS authenticity_checks_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authenticity_checks DROP CONSTRAINT IF EXISTS authenticity_checks_unit_id_fkey;
ALTER TABLE IF EXISTS ONLY public.authenticity_checks DROP CONSTRAINT IF EXISTS authenticity_checks_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ai_tool_calls DROP CONSTRAINT IF EXISTS ai_tool_calls_user_id_fkey;
DROP TRIGGER IF EXISTS trg_users_updated ON public.users;
DROP TRIGGER IF EXISTS trg_reviews_updated ON public.reviews;
DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
DROP TRIGGER IF EXISTS trg_drops_updated ON public.drops;
DROP INDEX IF EXISTS public.idx_waitlist_queue;
DROP INDEX IF EXISTS public.idx_reviews_user;
DROP INDEX IF EXISTS public.idx_reviews_product;
DROP INDEX IF EXISTS public.idx_refresh_tokens_user;
DROP INDEX IF EXISTS public.idx_push_tokens_user;
DROP INDEX IF EXISTS public.idx_products_search;
DROP INDEX IF EXISTS public.idx_products_price;
DROP INDEX IF EXISTS public.idx_products_name_trgm;
DROP INDEX IF EXISTS public.idx_products_catalog;
DROP INDEX IF EXISTS public.idx_products_attrs;
DROP INDEX IF EXISTS public.idx_product_units_product;
DROP INDEX IF EXISTS public.idx_orders_user;
DROP INDEX IF EXISTS public.idx_order_items_product;
DROP INDEX IF EXISTS public.idx_drops_calendar;
DROP INDEX IF EXISTS public.idx_drop_products_product;
DROP INDEX IF EXISTS public.idx_auth_checks_code;
DROP INDEX IF EXISTS public.idx_ai_tool_calls_conv;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_hash_key;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.push_tokens DROP CONSTRAINT IF EXISTS push_tokens_expo_token_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_slug_key;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_authenticity_code_key;
ALTER TABLE IF EXISTS ONLY public.product_units DROP CONSTRAINT IF EXISTS product_units_unit_code_key;
ALTER TABLE IF EXISTS ONLY public.product_units DROP CONSTRAINT IF EXISTS product_units_pkey;
ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_position_key;
ALTER TABLE IF EXISTS ONLY public.product_images DROP CONSTRAINT IF EXISTS product_images_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_product_id_unit_id_key;
ALTER TABLE IF EXISTS ONLY public.drops DROP CONSTRAINT IF EXISTS drops_slug_key;
ALTER TABLE IF EXISTS ONLY public.drops DROP CONSTRAINT IF EXISTS drops_pkey;
ALTER TABLE IF EXISTS ONLY public.drop_waitlist DROP CONSTRAINT IF EXISTS drop_waitlist_pkey;
ALTER TABLE IF EXISTS ONLY public.drop_products DROP CONSTRAINT IF EXISTS drop_products_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.authenticity_checks DROP CONSTRAINT IF EXISTS authenticity_checks_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_tool_calls DROP CONSTRAINT IF EXISTS ai_tool_calls_pkey;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.authenticity_checks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_tool_calls ALTER COLUMN id DROP DEFAULT;
DROP VIEW IF EXISTS public.v_catalog;
DROP VIEW IF EXISTS public.v_authenticity_lookup;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.schema_migrations;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.push_tokens;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_units;
DROP TABLE IF EXISTS public.product_images;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.drops;
DROP TABLE IF EXISTS public.drop_waitlist;
DROP TABLE IF EXISTS public.drop_products;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.authenticity_checks_id_seq;
DROP TABLE IF EXISTS public.authenticity_checks;
DROP SEQUENCE IF EXISTS public.ai_tool_calls_id_seq;
DROP TABLE IF EXISTS public.ai_tool_calls;
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.immutable_unaccent(text);
DROP TYPE IF EXISTS public.waitlist_status;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.unit_status;
DROP TYPE IF EXISTS public.push_platform;
DROP TYPE IF EXISTS public.order_status;
DROP TYPE IF EXISTS public.drop_status;
DROP TYPE IF EXISTS public.authenticity_status;
DROP EXTENSION IF EXISTS unaccent;
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS citext;
--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: authenticity_status; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.authenticity_status AS ENUM (
    'active',
    'revoked',
    'expired'
);


ALTER TYPE public.authenticity_status OWNER TO nova;

--
-- Name: drop_status; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.drop_status AS ENUM (
    'scheduled',
    'live',
    'sold_out',
    'ended',
    'cancelled'
);


ALTER TYPE public.drop_status OWNER TO nova;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


ALTER TYPE public.order_status OWNER TO nova;

--
-- Name: push_platform; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.push_platform AS ENUM (
    'ios',
    'android',
    'web'
);


ALTER TYPE public.push_platform OWNER TO nova;

--
-- Name: unit_status; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.unit_status AS ENUM (
    'in_stock',
    'reserved',
    'sold',
    'returned',
    'revoked'
);


ALTER TYPE public.unit_status OWNER TO nova;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.user_role AS ENUM (
    'customer',
    'admin',
    'authenticator'
);


ALTER TYPE public.user_role OWNER TO nova;

--
-- Name: waitlist_status; Type: TYPE; Schema: public; Owner: nova
--

CREATE TYPE public.waitlist_status AS ENUM (
    'waiting',
    'notified',
    'converted',
    'left'
);


ALTER TYPE public.waitlist_status OWNER TO nova;

--
-- Name: immutable_unaccent(text); Type: FUNCTION; Schema: public; Owner: nova
--

CREATE FUNCTION public.immutable_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $_$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $_$;


ALTER FUNCTION public.immutable_unaccent(text) OWNER TO nova;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: nova
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;


ALTER FUNCTION public.set_updated_at() OWNER TO nova;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_tool_calls; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.ai_tool_calls (
    id bigint NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid,
    tool_name character varying(60) NOT NULL,
    arguments jsonb NOT NULL,
    result_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    latency_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_tool_calls OWNER TO nova;

--
-- Name: ai_tool_calls_id_seq; Type: SEQUENCE; Schema: public; Owner: nova
--

CREATE SEQUENCE public.ai_tool_calls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_tool_calls_id_seq OWNER TO nova;

--
-- Name: ai_tool_calls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nova
--

ALTER SEQUENCE public.ai_tool_calls_id_seq OWNED BY public.ai_tool_calls.id;


--
-- Name: authenticity_checks; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.authenticity_checks (
    id bigint NOT NULL,
    code_scanned character varying(64) NOT NULL,
    product_id uuid,
    unit_id uuid,
    user_id uuid,
    result character varying(20) NOT NULL,
    source character varying(10) NOT NULL,
    ip_hash text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT authenticity_checks_result_check CHECK (((result)::text = ANY ((ARRAY['valid'::character varying, 'revoked'::character varying, 'not_found'::character varying, 'suspicious'::character varying])::text[]))),
    CONSTRAINT authenticity_checks_source_check CHECK (((source)::text = ANY ((ARRAY['web'::character varying, 'mobile'::character varying])::text[])))
);


ALTER TABLE public.authenticity_checks OWNER TO nova;

--
-- Name: authenticity_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: nova
--

CREATE SEQUENCE public.authenticity_checks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authenticity_checks_id_seq OWNER TO nova;

--
-- Name: authenticity_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nova
--

ALTER SEQUENCE public.authenticity_checks_id_seq OWNED BY public.authenticity_checks.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.categories (
    id smallint NOT NULL,
    slug character varying(60) NOT NULL,
    name character varying(80) NOT NULL,
    parent_id smallint
);


ALTER TABLE public.categories OWNER TO nova;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: nova
--

CREATE SEQUENCE public.categories_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO nova;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nova
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: drop_products; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.drop_products (
    drop_id uuid NOT NULL,
    product_id uuid NOT NULL,
    allocation integer,
    max_per_user smallint DEFAULT 1 NOT NULL,
    CONSTRAINT drop_products_allocation_check CHECK (((allocation IS NULL) OR (allocation > 0))),
    CONSTRAINT drop_products_max_per_user_check CHECK ((max_per_user > 0))
);


ALTER TABLE public.drop_products OWNER TO nova;

--
-- Name: drop_waitlist; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.drop_waitlist (
    drop_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public.waitlist_status DEFAULT 'waiting'::public.waitlist_status NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    notified_at timestamp with time zone
);


ALTER TABLE public.drop_waitlist OWNER TO nova;

--
-- Name: drops; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.drops (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(160) NOT NULL,
    slug character varying(180) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    cover_url text,
    launch_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    status public.drop_status DEFAULT 'scheduled'::public.drop_status NOT NULL,
    announced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT drops_dates CHECK (((ends_at IS NULL) OR (ends_at > launch_at)))
);


ALTER TABLE public.drops OWNER TO nova;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    unit_id uuid,
    quantity integer NOT NULL,
    unit_price_cents bigint NOT NULL,
    product_name character varying(160) NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT order_items_unit_price_cents_check CHECK ((unit_price_cents >= 0))
);


ALTER TABLE public.order_items OWNER TO nova;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    subtotal_cents bigint NOT NULL,
    shipping_cents bigint DEFAULT 0 NOT NULL,
    total_cents bigint GENERATED ALWAYS AS ((subtotal_cents + shipping_cents)) STORED,
    currency character(3) DEFAULT 'COP'::bpchar NOT NULL,
    shipping_address jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_shipping_cents_check CHECK ((shipping_cents >= 0)),
    CONSTRAINT orders_subtotal_cents_check CHECK ((subtotal_cents >= 0))
);


ALTER TABLE public.orders OWNER TO nova;

--
-- Name: product_images; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    url text NOT NULL,
    alt_text character varying(200),
    "position" smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.product_images OWNER TO nova;

--
-- Name: product_units; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.product_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    unit_code character varying(64) NOT NULL,
    status public.unit_status DEFAULT 'in_stock'::public.unit_status NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_units_code_format CHECK (((unit_code)::text ~ '^VKU-[A-Z0-9-]{8,60}$'::text))
);


ALTER TABLE public.product_units OWNER TO nova;

--
-- Name: products; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(160) NOT NULL,
    slug character varying(180) NOT NULL,
    category_id smallint NOT NULL,
    brand character varying(80),
    description text DEFAULT ''::text NOT NULL,
    price_cents bigint NOT NULL,
    currency character(3) DEFAULT 'COP'::bpchar NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    authenticity_code character varying(64) NOT NULL,
    authenticity_status public.authenticity_status DEFAULT 'active'::public.authenticity_status NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_published boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (((setweight(to_tsvector('spanish'::regconfig, public.immutable_unaccent((COALESCE(name, ''::character varying))::text)), 'A'::"char") || setweight(to_tsvector('spanish'::regconfig, public.immutable_unaccent((COALESCE(brand, ''::character varying))::text)), 'B'::"char")) || setweight(to_tsvector('spanish'::regconfig, public.immutable_unaccent(COALESCE(description, ''::text))), 'C'::"char"))) STORED,
    CONSTRAINT products_auth_code_format CHECK (((authenticity_code)::text ~ '^VKT-[A-Z0-9-]{8,60}$'::text)),
    CONSTRAINT products_price_cents_check CHECK ((price_cents >= 0)),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.products OWNER TO nova;

--
-- Name: push_tokens; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.push_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expo_token text NOT NULL,
    platform public.push_platform NOT NULL,
    notify_drops boolean DEFAULT true NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.push_tokens OWNER TO nova;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    client character varying(20) DEFAULT 'web'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO nova;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    photo_url text,
    verified_purchase boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_comment_check CHECK ((char_length(comment) <= 2000)),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO nova;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.schema_migrations (
    filename text NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO nova;

--
-- Name: users; Type: TABLE; Schema: public; Owner: nova
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(120) NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_format CHECK ((email OPERATOR(public.~*) '^[^@\s]+@[^@\s]+\.[^@\s]+$'::public.citext))
);


ALTER TABLE public.users OWNER TO nova;

--
-- Name: v_authenticity_lookup; Type: VIEW; Schema: public; Owner: nova
--

CREATE VIEW public.v_authenticity_lookup AS
 SELECT p.authenticity_code AS code,
    'product'::text AS code_type,
    p.id AS product_id,
    NULL::uuid AS unit_id,
    p.name AS product_name,
    (p.authenticity_status = 'active'::public.authenticity_status) AS is_active,
    (p.authenticity_status)::text AS status
   FROM public.products p
UNION ALL
 SELECT u.unit_code AS code,
    'unit'::text AS code_type,
    u.product_id,
    u.id AS unit_id,
    p.name AS product_name,
    ((u.status <> 'revoked'::public.unit_status) AND (p.authenticity_status = 'active'::public.authenticity_status)) AS is_active,
    (u.status)::text AS status
   FROM (public.product_units u
     JOIN public.products p ON ((p.id = u.product_id)));


ALTER VIEW public.v_authenticity_lookup OWNER TO nova;

--
-- Name: v_catalog; Type: VIEW; Schema: public; Owner: nova
--

CREATE VIEW public.v_catalog AS
 SELECT p.id,
    p.slug,
    p.name,
    p.brand,
    c.slug AS category_slug,
    c.name AS category_name,
    p.description,
    p.price_cents,
    p.currency,
    p.stock,
    p.attributes,
    p.authenticity_code,
    p.authenticity_status,
    ( SELECT i.url
           FROM public.product_images i
          WHERE (i.product_id = p.id)
          ORDER BY i."position"
         LIMIT 1) AS cover_url,
    (COALESCE(r.avg_rating, (0)::numeric))::numeric(3,2) AS avg_rating,
    COALESCE(r.review_count, (0)::bigint) AS review_count,
    p.search_vector
   FROM ((public.products p
     JOIN public.categories c ON ((c.id = p.category_id)))
     LEFT JOIN ( SELECT reviews.product_id,
            avg(reviews.rating) AS avg_rating,
            count(*) AS review_count
           FROM public.reviews
          GROUP BY reviews.product_id) r ON ((r.product_id = p.id)))
  WHERE p.is_published;


ALTER VIEW public.v_catalog OWNER TO nova;

--
-- Name: ai_tool_calls id; Type: DEFAULT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.ai_tool_calls ALTER COLUMN id SET DEFAULT nextval('public.ai_tool_calls_id_seq'::regclass);


--
-- Name: authenticity_checks id; Type: DEFAULT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.authenticity_checks ALTER COLUMN id SET DEFAULT nextval('public.authenticity_checks_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.categories (id, slug, name, parent_id) FROM stdin;
1	sneakers	Sneakers	\N
2	apparel	Ropa Urbana	\N
3	audio	Audio	\N
4	wearables	Wearables	\N
5	accessories	Accesorios	\N
6	hogar	Hogar	\N
\.


--
-- Data for Name: drop_products; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.drop_products (drop_id, product_id, allocation, max_per_user) FROM stdin;
ef043ba2-99c1-401f-903b-e8b8433858ef	cd910b9c-718e-4f9a-934c-0efde4854dd8	\N	1
1927db58-289c-4bed-8eac-5c4c596796a7	422969ec-15d3-4ba9-934e-3fe4bcce2865	\N	1
\.


--
-- Data for Name: drops; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.drops (id, name, slug, description, cover_url, launch_at, ends_at, status, announced_at, created_at, updated_at) FROM stdin;
1927db58-289c-4bed-8eac-5c4c596796a7	Vokter Winter Drop	nova-winter-drop	Lanzamiento exclusivo de edición limitada	/products/nova-runner-x.jpg	2026-12-01 18:00:00+00	\N	scheduled	\N	2026-09-16 21:00:38.49046+00	2026-10-16 19:59:45.079113+00
ef043ba2-99c1-401f-903b-e8b8433858ef	Vokter Tech Drop	nova-tech-drop	Lanzamiento de accesorios tecnológicos GOLD.	/products/gold-cargador-25w-tipo-c.jpg	2026-12-15 23:00:00+00	\N	scheduled	\N	2026-09-16 22:28:22.345209+00	2026-10-16 20:00:27.515335+00
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.product_images (id, product_id, url, alt_text, "position") FROM stdin;
e3f7bbab-9cd2-4b1d-9cb7-d2b208385cfd	adc3e609-238c-4b6f-9b51-cd79c8d3e16d	/products/cabeza-iphone-25w.jpg	Cabeza iPhone 25W	0
140a62a3-88bc-4091-8073-677bec2f3a8e	0932e634-f013-451d-8906-606a16c2ba08	/products/cargador-25w-tipo-c-iphone.jpg	Cargador 25W Tipo C iPhone	0
fb1f37f5-8bd4-4a1d-90e9-1353aad2408c	c7eb63b7-5bcc-4776-8cd1-81d563bffbff	/products/holder-carro-chupa-iman.jpg	Holder para Carro Chupa Iman	0
f070e455-ca51-45c9-a41f-63e9db72bb74	cd910b9c-718e-4f9a-934c-0efde4854dd8	/products/gold-cargador-25w-tipo-c.jpg	Cargador 25W Tipo C	0
590742e5-1769-4b9b-ab25-223d4bdb3f6a	cf160a89-c31e-43a2-83eb-93702551c939	/products/cargador-67w-tipo-c.jpg	Cargador 67W Tipo C	0
79f68cb1-7765-40f4-879d-c3798dd2c61a	18bfc1cf-8b34-42df-a348-8295a8a094fb	/products/cargador-4a-20w-tipo-c.jpg	Cargador 4A y 20W Tipo C	0
56e7ceeb-cbb3-4798-be96-6e4ce70ba777	164af33f-935d-4d67-a711-3d452f210283	/products/holder-para-carro.jpg	Holder para Carro	0
7d59ae72-b27d-41ab-a902-ab4dc73679b7	e75e8dab-955c-40ac-91a2-20f4251848ac	/products/soporte-moto-espejo.jpg	Soporte para Moto Espejo	0
c46539cc-f14e-4142-a582-fc16437326a4	be3478cf-c44f-4488-84ff-ff135a5a7da0	/products/soporte-moto-manubrio-360.jpg	Soporte para Moto Manubrio 360	0
c4fc749a-aaa3-4cbe-a0de-a32f54343370	495467ae-8a9d-4b4f-a434-0e805adae2b2	/products/microfono-inalambrico-k9.jpg	Microfono Inalambrico K9	0
705ded9c-5b2b-421f-b6e5-8a04af0fab27	ff3cd5cb-8115-422f-8d41-d901cd6ac87e	/products/power-bank-2300mah-llavero.jpg	Power Bank 2300mAh Llavero	0
87a5dcab-0f49-42fd-bb94-a9c22040f80c	0f524fa4-401d-4671-ba3d-96e2eb546977	/products/power-bank-10000mah.jpg	Power Bank 10.000 mAh	0
38821f8a-d61e-4803-bac3-d4176ca01e4c	3b9c72f6-3f01-4653-8d4a-0bd93cd5ce85	/products/power-bank-20000mah.jpg	Power Bank 20.000 mAh	0
bc826791-9338-4c2c-8976-41307cd732d4	00603ec7-bd38-426a-8577-cb5552021081	/products/mouse-inalambrico-optico.jpg	Mouse Inalambrico Optico	0
6345f6b4-1dfb-4623-9de1-49988b7cb1d8	b61a1e74-928d-40d4-b674-cb8e6419e440	/products/mouse-alambrico-optico.jpg	Mouse Alambrico Optico	0
976c3391-d547-4774-aece-f1456087ae98	275f8c28-6019-49f9-b1de-e37d62520a03	/products/combo-gamer-t25.jpg	Combo Gamer T25	0
6b79f021-2a6f-443c-87b8-565932ff163a	3176d513-c4d0-4983-a83f-ed19f88dff36	/products/teclado-cable-fc-530.jpg	Teclado Cable FC-530	0
a752a454-417c-4036-8406-0d37fbefc1e9	1105e651-2d2d-4917-b932-87c42222bcf0	/products/teclado-mouse-inalambrico.jpg	Teclado y Mouse Inalambrico	0
596726cf-2296-4c6e-9398-4f07f0872b3a	664a3e95-bb3a-4d21-b0c6-ac36735e7087	/products/tv-stick-android-tv.jpg	TV Stick Android TV	0
72498f99-3641-4ba9-8ab3-d913b567ec9c	0695b5ab-280e-47a4-99fb-12e5b0d21378	/products/funda-space-collection.jpg	Funda Space Collection Transparente	0
7f3f480c-964a-4fd6-b2cc-864b38cbda4c	98f77d35-c55e-44fe-9df4-ccbb56f77669	/products/hub-usb-multipuerto.jpg	Hub USB Multipuerto	0
92b804c9-4dcc-492b-8d1f-babc4b1757db	c233be46-f141-4a75-937b-437426f45f90	/products/antena-tdt-5m.jpg	Antena TDT 5M	0
8f84c736-3767-4f28-a44f-c2106ff92388	ff3ea6b8-4b4e-4418-ad5a-3ef3864337a8	/products/sabana-estampada-floral.jpg	Sabana Estampada Floral	0
41452f41-c3b1-4220-8f55-fd890ced827c	1d28c6ac-2335-492f-9b76-ff99db7cb904	/products/sabana-estampada-geometrica.jpg	Sabana Estampada Geometrica	0
7cfac1a5-ac1a-420c-bc7c-0419e62d8c9a	d2919b50-8bc8-4922-b1a8-170f61360c19	/products/sabana-estampada-triangulos.jpg	Sabana Estampada Triangulos	0
1bf5536e-42ab-4156-973f-fe0a86b1076a	427919b0-b024-439e-a6bb-0198de973dd7	/products/soporte-moto-manubrio-xlz.jpg	Soporte para Moto Manubrio Impermeable XL+Z	0
f6889aad-33d4-4259-b7c0-d0d70f6bbff0	9d5a0925-bb30-4556-ada1-69508dbe04e9	/products/power-bank-5000mah-magsafe.jpg	Power Bank 5000mAh MagSafe	0
44e08a14-6cb7-4225-b7b2-d8248a7276d3	4c06213e-8f10-427a-8686-19a6f90dce94	/products/consola-retro-blanca-verde.jpg	Consola de Videojuegos Retro	0
59f7fa4e-0bf6-459f-85c4-b31f630908c4	e88819ca-c04a-41c1-bb07-9b96604d2c46	/products/proyector-con-juegos.jpg	Proyector Portatil con Juegos	0
bce3911e-b92d-4541-a1d4-1e884e54b60f	de76e120-3474-4e44-b4ac-cf5c8b7cc890	/products/onn-watch-streaming-stick.jpg	Onn. Watch HD Streaming Device	0
2f51eaed-7793-4a45-b93c-7ae01a0f15e3	e3cd164e-e281-4043-a7fe-0d9ff310f999	/products/sabana-estampada-patchwork.jpg	Sábana Estampada Patchwork	0
26f8f41b-7fe8-4a63-b7e2-e1ed28b5d4af	e1b59f83-5325-4594-81f0-f6c0ef1526cd	/products/sabana-estampada-animal-print.jpg	Sábana Estampada Animal Print	0
c9ed592e-cb14-4eb8-85f6-3b466db1fc28	f41e9129-0660-4882-a953-a72f78b594ec	/products/sabana-estampada-abstracta.jpg	Sábana Estampada Abstracta	0
3e3e2aa4-064d-4fb3-87c5-58d7f37a4e0e	6f086fa6-e70c-4b7d-b8c3-65f31597d93f	/products/sabana-estampada-acuarela-gris.jpg	Sábana Estampada Acuarela Gris	0
5c4464dc-945a-42b0-ba17-e8e27f41c8ef	80d1958b-221d-431e-b2b4-feb84e3bd2b7	/products/sabana-estampada-memphis.jpg	Sábana Estampada Memphis	0
b4508f30-1a89-4589-81df-28a0fa951d30	104b66f4-4e5e-46ca-a164-b87c9543f61f	/products/sabana-estampada-cintas.jpg	Sábana Estampada Cintas	0
ce544f7e-b5b9-49b1-b300-9621bed3719c	0e75e170-7cfa-442f-9e79-53e9e72ace04	/products/sabana-estampada-hojas.jpg	Sábana Estampada Hojas	0
0c7c8d7f-8b36-40d1-8bb0-6a0bf80c7ddb	1d325955-5ecd-44ce-adff-51c9621bdb5b	/products/sabana-estampada-bloques-pastel.jpg	Sábana Estampada Bloques Pastel	0
ff89343e-ea3d-4c0a-a03b-1bc839750204	dbd9136c-b3b9-4302-bd0e-c19d506236d9	/products/sabana-estampada-circulos.jpg	Sábana Estampada Círculos	0
e6338e3d-24ef-4250-974a-c61e5b7a531b	9abe7cb9-40d3-4c5b-9774-cc1e119c0da7	/products/sabana-estampada-estrellas.jpg	Sábana Estampada Estrellas	0
39aacb6a-7094-4e8c-b3a1-36d476252b22	4f7a8721-0c13-4a7a-8b4f-f94fc6165236	/products/hoodie-oversize-blanco.jpg	Hoodie Oversize Blanco	0
62a053ba-a09f-4c4b-8340-4b1a28740ec6	59216550-6669-48aa-a279-e6c59295275d	/products/hoodie-oversize-verde-menta.jpg	Hoodie Oversize Verde Menta	0
4a9ff071-12cb-45b3-b4d6-8744cf8a3184	5eb2b02a-675d-4ef7-a52d-07dadf9e3db7	/products/hoodie-terracota.jpg	Hoodie Terracota	0
e0c10fdf-605d-4a91-b31d-42a9a7bd092a	2002d3f0-105c-4111-afd3-4ca81344b8c2	/products/chaqueta-bomber-negra.jpg	Chaqueta Bomber Negra	0
2d1bccb7-4ed7-4c6a-ab26-b375e53e5347	29528a11-34e1-49ce-8bee-1cd0e7c53b5e	/products/pantalon-cargo-blanco.jpg	Pantalón Cargo Blanco Oversize	0
e1e65eed-9c1b-4a86-8e12-8ff5cadefe5a	a8c829a7-342f-4448-9a97-37665e6fe8f9	/products/camiseta-oversize-blanca.jpg	Camiseta Oversize Blanca	0
03934e14-62a9-430d-96b6-95f9832b764c	2018cfcc-c490-4430-b2a0-9da8e756294a	/products/camiseta-basica-beige.jpg	Camiseta Básica Beige	0
c7f73df1-5e82-4193-8df0-94fe19914d52	6d678565-ee45-4e94-8ae7-2d46d9c5c843	/products/gorra-trucker-blanca.jpg	Gorra Trucker Blanca	0
f40801ba-c8b1-4b0b-9f23-fe3c860fd244	c143ae40-946c-4db7-928c-00fd2aa0a3bf	/products/audifono-bluetooth-balaca-pro-air.jpg	Audífono Bluetooth Balaca Pro Air	0
e9a135d4-64a6-40e9-b46f-c89ec10ea4df	4213dbd4-da8a-4db4-ac6f-0a012a989cd4	/products/audifono-bluetooth-balaca-air-max.jpg	Audífono Bluetooth Balaca Air Max	0
7c906846-1345-47d6-a58b-8cbae3803599	338920f9-119b-4332-9d60-c02923cf5c9a	/products/diadema-gamer-balaca.jpg	Diadema Gamer Balaca	0
146ca1f8-a441-4d28-938b-929eedc55e19	86a8a7ab-d20f-410f-997f-6f97f749e514	/products/diadema-sony-mdr-xb450.jpg	Diadema Sony MDR XB450	0
93537d62-6e42-47d1-9cd7-409d0fbd5dd2	668de464-1fdf-4394-b078-25d4b866c36c	/products/diadema-inalambrica-n65bt.jpg	Diadema Inalámbrica N65BT	0
826491cd-8b5b-431e-a2c7-6e854fb8157e	4f588af1-2ea1-4879-a7c4-d51d403095a8	/products/diadema-sony-bluetooth-450bt.jpg	Diadema Sony Bluetooth 450BT	0
fb81c59f-feeb-4b2f-b14b-ad800f36a8f5	fe8eb8c8-1416-4f07-9d29-0076d7117696	/products/diadema-p9-tipo-apple.jpg	Diadema P9 Tipo Apple	0
eb4a884a-b785-4817-bdcb-51fa27bcf68c	dd4079d9-8033-42c1-8f8a-d26d5911c517	/products/diadema-airpods-max-simil.jpg	Diadema Airpods Max (símil)	0
ffb52837-7b65-49a3-ae37-8d81d3e3727f	6e5533c4-cb73-4433-8b15-c76652adeaf9	/products/parlante-portatil-s410.jpg	Parlante Portátil S410	0
af9e33be-0371-4272-97b5-42d0efb426e7	422969ec-15d3-4ba9-934e-3fe4bcce2865	/products/nova-runner-x.jpg	NOVA Runner X	0
faee2928-c4f7-470c-87b8-c379479e628c	f5d25a81-6e5a-4ae6-88c0-854c92662ebb	/products/parlante-bluetooth-s430.jpg	Parlante Bluetooth S430	0
d834cb3e-cf30-441e-b33d-547ff646d54f	7f3cdc65-ee98-4036-b9e8-af88a700f9d7	/products/parlante-fl828-fly-sound.jpg	Parlante FL828 Fly Sound	0
09c17ddf-50dc-4ade-be4c-dfd2a82302fd	98cb17c2-f204-4b80-86ce-393913182dcb	/products/parlante-fly-sound-s520.jpg	Parlante Fly Sound S520 12"	0
31ee00fd-2e75-4ece-9ad9-b834f50c812a	7584be1b-1bcd-4b88-b4f6-7084d0457972	/products/cuellera-bluetooth-zon-35.jpg	Cuellera Bluetooth ZON-35	0
a39117c5-bf9d-4f8c-9d0d-6c30923c0d30	8dcbeeaa-bdd6-4327-9257-05207ea99119	/products/audifono-conduccion-osea-f20.jpg	Audífono Conducción Ósea F-20	0
380522d9-e574-40dc-9839-4ab8de38b8c9	af0ae525-0161-4062-945f-6216cd9f5db4	/products/audifono-conduccion-osea-f805.jpg	Audífono Conducción Ósea F805	0
7b7fe2a8-0aa6-4bb1-8c28-c483149af6b6	d2420ae8-6784-4975-8b95-cb876def56d2	/products/chaqueta-denim-urbana.jpg	Chaqueta Denim Urbana	0
57325ee7-0617-408b-97fd-06b34bb55c74	b115c45a-72b9-478b-8d07-b771dd85030f	/products/chaqueta-puffer-negra.jpg	Chaqueta Puffer Negra	0
f311e442-7672-4a95-9a2c-874f7022b40b	46262463-c762-444d-9dfc-a36916e28e82	/products/gorro-beanie-negro.jpg	Gorro Beanie Negro	0
266e3f99-45ca-473b-8d00-fe17809367a9	2576ddcf-b2bb-41f0-b9ec-ce1d4ad77e13	/products/jogger-gris-oversize.jpg	Jogger Gris Oversize	0
8f871700-e3fe-468c-93d9-8e75061999ae	739adc7d-dfca-4038-9a89-7c5278704045	/products/camiseta-tank-top-blanca.jpg	Camiseta Tank Top Blanca	0
2e143b87-6a15-49a4-a420-443c6091d9d6	bd2b1ba6-e35b-4d07-945a-abfb327908bb	/products/camisa-manga-larga-verde.jpg	Camisa Manga Larga Verde	0
58158f45-429e-42fa-b3f5-d5268ffd8e87	4d4fc50d-19c6-4f23-a3c2-b404f56b4905	/products/chaleco-utilitario-negro.jpg	Chaleco Utilitario Negro	0
95a0840c-7d34-4f37-861a-f91476fac3cb	71805197-6a6e-4857-9851-9113c32cf180	/products/tenis-skate-urbanos-unisex.jpg	Tenis Skate Urbanos Unisex	0
0f261991-c34d-43d5-942f-4115df270eca	33cd48a0-0acf-4651-986c-620d3d22e6db	/products/tenis-trainer-urbanos.jpg	Tenis Trainer Urbanos	0
9e20a16f-9df8-4fea-9e42-dfd94d7e10d5	7e2dfc55-bc17-4aa0-b093-e1d02ae08512	/products/tenis-trainer-dama.jpg	Tenis Trainer Dama	0
96d51d82-022c-4338-a1b0-13c76e2295d5	bdcebc52-5458-4949-b0a0-35c6db9b7a9b	/products/tenis-running-unisex.jpg	Tenis Running Unisex	0
113b15c5-e0ea-4558-aff0-50e2273801f7	9fe40864-84e4-4a6f-9f83-b196e34561ae	/products/tenis-running-amortiguados.jpg	Tenis Running Amortiguados	0
e3c43d06-1d19-412b-b932-6309ac15e9a6	c02b7d96-f2ca-4ea4-9c5d-b9f125a802ec	/products/tenis-deportivos-livianos.jpg	Tenis Deportivos Livianos	0
37afb61e-88a5-4524-921e-048b56ceb4ea	02478031-f632-49f5-b0b1-e2c4a4048143	/products/tenis-deportivos-estabilidad.jpg	Tenis Deportivos Estabilidad	0
789d6ea0-9ae7-4a3f-8758-fd87933f8b1b	6a0b4452-74f2-438a-9d05-87e59debb97b	/products/mocasin-casual-hombre.jpg	Mocasín Casual Hombre	0
deb27a1b-1cf5-4b79-959d-06e9d437be59	68386975-add9-4ce6-a8c1-2bd5a3c95074	/products/tenis-casual-blanco-negro.jpg	Tenis Casual Blanco Negro	0
d617cf12-2ff9-416a-b4cb-1ef5730131ec	336e4480-c2e7-495e-ab67-4d2bc2c76bad	/products/tenis-casual-abiertos.jpg	Tenis Casual Abiertos	0
4805518c-67bb-4019-853b-d84098fafaa7	748b3b1e-361c-4342-82ea-1e0865a47a09	/products/tenis-urbanos-con-banda.jpg	Tenis Urbanos con Banda	0
112430b9-c604-47dc-a784-3755fe3f2e10	8c727754-7d81-4291-8e3f-c32822141977	/products/botas-tacticas-urbanas.jpg	Botas Tácticas Urbanas	0
531d6a84-5d14-4e08-8b2e-1ca38e5be773	6290b041-f438-4bf9-b0fe-bc0aaa7d9154	/products/audifonos-music-colores.jpg	\N	0
5693cf09-fbf4-49fc-be50-8c926b1b03b5	a65361da-2d91-4ce9-b87d-65a190eeee66	/products/audifonos-samsung-akg.jpg	\N	0
5f3993f4-7add-415b-b216-066260f99dda	b53364cf-b721-4d3a-ba9f-f288e066643e	/products/parlante-portatil-s640.jpg	\N	0
87e8b6b0-d88b-4cf8-9d32-9d3d34ec0b1c	c5da8f09-ff74-411b-a91d-04be5ec5863a	/products/audifonos-w01.jpg	\N	0
6b642f5a-dc97-4752-96a7-288956df6d38	f437d7e4-ff55-4cf1-b4fc-c78b63aa1dbd	/products/audifonos-z1-bass.jpg	\N	0
52595fce-ec8f-497c-b5ef-f0826913e833	109bd2db-2dfb-43ee-80b3-040bf09bedde	/products/under-armour-valsetz.jpg	\N	0
26f71561-f2c9-4908-874b-bdbb656367d2	5e8ea8c8-0d78-491a-979c-0c30a2eef8a5	/products/hoka-clifton-10.jpg	\N	0
ce2103c1-d21d-4dac-9b82-3f9a8f93f2b3	551d642c-f850-457c-a8c2-2e5dcea59068	/products/skechers-mocasin.jpg	\N	0
06a0f74a-6fdf-41d9-87a8-31bba6561c1d	4456a81a-50f8-4e56-9e00-85a0c55a3343	/products/hoka-skyflow.jpg	\N	0
1e2f8947-3afe-425d-beb4-0b3d244e906e	0abcd794-108a-489f-896b-da7c610e8859	/products/hoka-gaviota.jpg	\N	0
f437decd-cac9-4fa2-b8c1-46a2a0126053	27f93f64-a93c-4205-b23e-804bd29b4f24	/products/hoka-bondi-9.jpg	\N	0
dc8c9e6f-b859-4df3-ac8f-6c87b5c3b376	6ca1ec68-b68f-4c30-9ca9-aa5674f749f5	/products/lv-skate-sneakers.png	\N	0
b50919dc-e773-4b58-a191-f267378b4766	421910b4-9127-4238-a06b-59f6dd585caa	/products/lv-trainer.png	\N	0
13ca221b-9f76-451b-8549-610872ec4b45	466ef47d-5938-4a9a-80ae-6e3ad60c5bd9	/products/valentino-v17n-bond.png	\N	0
f0f91e46-a15e-4b1b-bb10-74a88c8e5ad5	599d4dc6-0d7f-4d86-9e7e-6271f90233a6	/products/lv-archlight-trainer.png	\N	0
a5586fc6-f4d0-4e33-90a0-79fc7eb5a38a	2c40c6b9-93aa-4805-bff6-b360063a3759	/products/valentino-garavani-diamante.png	\N	0
5d0fa188-d0a4-410a-9a95-52ae3e1539df	99136778-2b83-4e0f-a8d0-3901759011d2	/products/valentino-open-sneaker.png	\N	0
3bb5b1dc-cb25-4708-8355-ba80e41fb0c8	34ae980e-ada8-4082-a087-c6ff9ce93e6f	/products/nike-conjunto-verde-negro.jpg	\N	0
8355d943-86ac-408f-958c-dcf492b0cf1b	ec514607-8a58-4bad-8597-58c126562394	/products/nike-6976-conjunto.jpg	\N	0
cff82a0b-3cc7-40cd-880d-0260159429c2	4fd1cc0c-9e3c-4ea7-b7fd-acd98a63e412	/products/adidas-h685-conjunto-dama.jpg	\N	0
3708dc85-9598-47b2-931a-2382e4865f43	03bfc3c9-b6ea-43f8-ab2c-f77eff53be53	/products/nike-n8805-conjunto.jpg	\N	0
0b47e902-eb7f-4b5e-8c0d-14a00e8dabe1	03ea46be-6558-4f6f-8237-3e54d61ad3e7	/products/nike-conjunto-rosa-negro.jpg	\N	0
4189c249-6aef-4cc4-8068-053bb83bdc0c	a7d60352-d1c3-4320-a79d-00c79fa7c829	/products/nike-h89-conjunto-dama.jpg	\N	0
8c8aed58-8dcd-44a2-9e35-f8af47958ae4	8d593b0b-5dd9-474b-8679-60833dd373b3	/products/puma-3503-conjunto.jpg	\N	0
f2efa541-f612-432b-9778-f42bf4cb2c36	1d1556cf-c563-4eff-a076-c83618811786	/products/nike-h88-conjunto-dama.jpg	\N	0
2bb962f9-b7d9-4595-bd41-acce59fafe25	ff1eac27-6445-4bec-9f19-77af21b1efc2	/products/on-running-6976-conjunto.jpg	\N	0
e9c9642f-611d-4473-b312-90b7b783cf32	4a70bfa1-920c-4e9a-af62-edbd2169502b	/products/jordan-2333-conjunto.jpg	\N	0
363a1e85-d57f-442e-9a74-68b66fa06aa2	c723d874-7e3d-43cd-8de9-895fb936c33b	/products/adidas-3-franjas-teal.jpg	\N	0
2705b78f-c359-4289-8e87-fa033df62d0d	f150a5ca-f751-4156-ac3d-9b0f603aa9e2	/products/nike-conjunto-aqua-negro.jpg	\N	0
49a655cc-c037-4606-af1f-11f212445104	9b1fe65d-16ec-4214-ab2e-188ce3d795a9	/products/puma-3508-conjunto.jpg	\N	0
e457dcac-5601-4f2d-8fbd-e5c82a2e3330	10bdbbab-d302-43ed-b0e7-b8f559251de0	/products/adidas-3-franjas-lila.jpg	\N	0
901fb887-ea09-4591-990d-608d746222ac	a6354a85-c98d-4aa9-84d8-b2e15b459cd7	/products/under-armour-6976-conjunto.jpg	\N	0
f383837a-d3f4-4043-9287-f3fdfb0f9049	c71e8800-2b35-4e77-869e-ad3d900f601a	/products/adidas-3-franjas-verde.jpg	\N	0
f0ad9619-ff64-4738-9cd6-6fa9db9bf6f5	5161b758-5094-4594-8fa7-823527c935e1	/products/camisa-seleccion-colombia.jpg	\N	0
2452a651-f977-4439-893b-3393fcf98a4f	0014a4bd-7718-45ae-a56d-efdcf848a1ae	/products/lacoste-2335-conjunto.jpg	\N	0
\.


--
-- Data for Name: product_units; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.product_units (id, product_id, unit_code, status, verified_by, verified_at, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.products (id, name, slug, category_id, brand, description, price_cents, currency, stock, authenticity_code, authenticity_status, attributes, is_published, created_at, updated_at) FROM stdin;
71805197-6a6e-4857-9851-9113c32cf180	Tenis Skate Urbanos Unisex	tenis-skate-urbanos-unisex	1	\N	Tenis estilo skate unisex. Tallas 35-43. Colores disponibles: blanco, negro, rojo, azul, plateado.	270000	COP	8	VKT-VOKTER-SKATE01-01	active	{}	t	2026-09-16 22:34:45.260008+00	2026-09-17 21:11:48.294089+00
33cd48a0-0acf-4651-986c-620d3d22e6db	Tenis Trainer Urbanos	tenis-trainer-urbanos	1	\N	Tenis estilo trainer urbano. Tallas 35-44. Colores disponibles: blanco, negro, azul, verde, rojo.	180000	COP	10	VKT-VOKTER-TRAIN01-01	active	{}	t	2026-09-16 22:34:45.275278+00	2026-09-17 21:11:48.294089+00
7e2dfc55-bc17-4aa0-b093-e1d02ae08512	Tenis Trainer Dama	tenis-trainer-dama	1	\N	Tenis trainer para dama. Tallas 36-40. Colores disponibles: blanco, negro.	270000	COP	6	VKT-VOKTER-TRAIN02-01	active	{}	t	2026-09-16 22:34:45.285362+00	2026-09-17 21:11:48.294089+00
bdcebc52-5458-4949-b0a0-35c6db9b7a9b	Tenis Running Unisex	tenis-running-unisex	1	\N	Tenis para running unisex, suela amortiguada. Tallas 36-44. Colores disponibles: azul, negro, blanco, verde.	240000	COP	10	VKT-VOKTER-RUN01-01	active	{}	t	2026-09-16 22:34:45.296232+00	2026-09-17 21:11:48.294089+00
9fe40864-84e4-4a6f-9f83-b196e34561ae	Tenis Running Amortiguados	tenis-running-amortiguados	1	\N	Tenis running de amortiguación alta. Tallas 36-44. Colores disponibles: blanco, negro, azul.	270000	COP	8	VKT-VOKTER-RUN02-01	active	{}	t	2026-09-16 22:34:45.305375+00	2026-09-17 21:11:48.294089+00
c02b7d96-f2ca-4ea4-9c5d-b9f125a802ec	Tenis Deportivos Livianos	tenis-deportivos-livianos	1	\N	Tenis deportivos livianos de uso diario. Tallas 37-44. Colores disponibles: blanco, negro, azul.	270000	COP	8	VKT-VOKTER-DEP01-01	active	{}	t	2026-09-16 22:34:45.313636+00	2026-09-17 21:11:48.294089+00
02478031-f632-49f5-b0b1-e2c4a4048143	Tenis Deportivos Estabilidad	tenis-deportivos-estabilidad	1	\N	Tenis deportivos con soporte de estabilidad. Tallas 36-44. Colores disponibles: blanco, negro, azul.	260000	COP	8	VKT-VOKTER-DEP02-01	active	{}	t	2026-09-16 22:34:45.321799+00	2026-09-17 21:11:48.294089+00
6a0b4452-74f2-438a-9d05-87e59debb97b	Mocasín Casual Hombre	mocasin-casual-hombre	1	\N	Mocasín casual para hombre. Tallas 37-44. Colores disponibles: café, gris, negro, moca.	210000	COP	10	VKT-VOKTER-MOC01-01	active	{}	t	2026-09-16 22:34:45.330433+00	2026-09-17 21:11:48.294089+00
68386975-add9-4ce6-a8c1-2bd5a3c95074	Tenis Casual Blanco Negro	tenis-casual-blanco-negro	1	\N	Tenis casual de diario. Tallas 36-43. Colores disponibles: blanco, negro.	170000	COP	12	VKT-VOKTER-CAS01-01	active	{}	t	2026-09-16 22:34:45.338366+00	2026-09-17 21:11:48.294089+00
336e4480-c2e7-495e-ab67-4d2bc2c76bad	Tenis Casual Abiertos	tenis-casual-abiertos	1	\N	Tenis casual estilo slip-on. Tallas 36-40. Color: blanco.	190000	COP	9	VKT-VOKTER-CAS02-01	active	{}	t	2026-09-16 22:34:45.347108+00	2026-09-17 21:11:48.294089+00
748b3b1e-361c-4342-82ea-1e0865a47a09	Tenis Urbanos con Banda	tenis-urbanos-con-banda	1	\N	Tenis urbanos con banda lateral. Tallas 37-43. Colores disponibles: blanco, negro.	210000	COP	9	VKT-VOKTER-BAND01-01	active	{}	t	2026-09-16 22:34:45.354058+00	2026-09-17 21:11:48.294089+00
8c727754-7d81-4291-8e3f-c32822141977	Botas Tácticas Urbanas	botas-tacticas-urbanas	1	\N	Botas de estilo táctico para uso urbano. Tallas 36-44. Colores disponibles: negro, café, verde, gris.	230000	COP	7	VKT-VOKTER-BOOT01-01	active	{}	t	2026-09-16 22:34:45.362381+00	2026-09-17 21:11:48.294089+00
46262463-c762-444d-9dfc-a36916e28e82	Gorro Beanie Negro	gorro-beanie-negro	2	Vokter	Gorro beanie Vokter en punto grueso, ajuste unisex.	35000	COP	30	VKT-VOKTER-BEANIE-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
e75e8dab-955c-40ac-91a2-20f4251848ac	Soporte para Moto Espejo	soporte-moto-espejo	5	XL+M3	Soporte GPS/celular para espejo de moto, instalación segura y estable.	13000	COP	15	VKT-GOLD-MOTOESP-01	active	{}	t	2026-09-16 22:30:38.699644+00	2026-09-17 21:09:42.491096+00
6290b041-f438-4bf9-b0fe-bc0aaa7d9154	Audífonos Manos Libres Music Colores	audifonos-music-colores	4	Technomaster	Audífonos manos libres con cable, conector 3.5mm, diseño a color, micrófono integrado.	8000	COP	40	VKT-TECHNO-MUSICOL-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-18 02:41:07.483936+00
109bd2db-2dfb-43ee-80b3-040bf09bedde	Under Armour Valsetz	under-armour-valsetz	1	Under Armour	Bota táctica Under Armour Valsetz, resistente para uso urbano y outdoor. Tallas 38-44.	210000	COP	11	VKT-VOKTER-UAVALSETZ-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:39:54.423155+00
5e8ea8c8-0d78-491a-979c-0c30a2eef8a5	Hoka Clifton 10	hoka-clifton-10	1	Hoka	Tenis running Hoka Clifton 10, amortiguación suave para uso diario. Tallas 38-44.	240000	COP	12	VKT-VOKTER-HOKACLIF10-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:40:24.966112+00
551d642c-f850-457c-a8c2-2e5dcea59068	Skechers Mocasín	skechers-mocasin	1	Skechers	Mocasín casual Skechers, cómodo para uso diario. Tallas 38-44.	210000	COP	20	VKT-VOKTER-SKECMOC01-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:40:47.106466+00
4456a81a-50f8-4e56-9e00-85a0c55a3343	Hoka Skyflow	hoka-skyflow	1	Hoka	Tenis running Hoka Skyflow, ligero y responsivo para entrenamiento. Tallas 38-44.	270000	COP	9	VKT-VOKTER-HOKASKYFLOW-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:43:14.878334+00
0abcd794-108a-489f-896b-da7c610e8859	Hoka Gaviota	hoka-gaviota	1	Hoka	Tenis running Hoka Gaviota, soporte y estabilidad para pisada pronada. Tallas 38-44.	260000	COP	14	VKT-VOKTER-HOKAGAVIOTA-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:43:36.93519+00
27f93f64-a93c-4205-b23e-804bd29b4f24	Hoka Bondi 9	hoka-bondi-9	1	Hoka	Tenis running Hoka Bondi 9, máxima amortiguación para largas distancias. Tallas 38-44.	270000	COP	10	VKT-VOKTER-HOKABONDI9-01	active	{}	t	2026-09-18 18:10:40.103151+00	2026-09-18 18:44:20.191627+00
6ca1ec68-b68f-4c30-9ca9-aa5674f749f5	LV Skate Sneakers	lv-skate-sneakers	1		Tenis LV Skate Sneakers Tallas 35-43.	210000	COP	11	VKT-VOKTER-URBAN01-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
421910b4-9127-4238-a06b-59f6dd585caa	LV Trainer	lv-trainer	1	Louis Vuitton	Tenis LV Trainer Tallas 35-43.	190000	COP	12	VKT-VOKTER-VELCRO01-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
466ef47d-5938-4a9a-80ae-6e3ad60c5bd9	Valentino V17n Bond	valentino-v17n-bond	1	Valentino	Tenis Valentino V17n Bond. Tallas 35-43.	170000	COP	15	VKT-VOKTER-CASUAL01-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
599d4dc6-0d7f-4d86-9e7e-6271f90233a6	LV Archlight Trainer	lv-archlight-trainer	1	Louis Vuitton	Tenis LV Archlight Trainer. Tallas 35-43.	270000	COP	9	VKT-VOKTER-CHUNK01-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
2c40c6b9-93aa-4805-bff6-b360063a3759	Valentino Garavani Diamante	valentino-garavani-diamante	1	Valentino	Tenis Valentino Garavani Diamante. Tallas 35-43.	270000	COP	10	VKT-VOKTER-SKATE02-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
99136778-2b83-4e0f-a8d0-3901759011d2	Valentino Open Sneaker	valentino-open-sneaker	1	Valentino	Tenis Valentino Open Sneaker. Tallas 35-43.	180000	COP	13	VKT-VOKTER-TRAIN03-01	active	{}	t	2026-09-18 18:13:50.609914+00	2026-10-16 19:41:07.033695+00
34ae980e-ada8-4082-a087-c6ff9ce93e6f	Nike Conjunto Verde/Negro	nike-conjunto-verde-negro	2	Nike	Conjunto deportivo Nike acolchado, verde y negro. Tallas S-XL.	145000	COP	14	VKT-VOKTER-NIKEVERDE-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:14:17.3942+00
ec514607-8a58-4bad-8597-58c126562394	Nike 6976 Conjunto	nike-6976-conjunto	2	Nike	Conjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4XL.	165000	COP	12	VKT-VOKTER-NIKE6976-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:12:33.531851+00
4fd1cc0c-9e3c-4ea7-b7fd-acd98a63e412	Adidas H-685 Conjunto Dama	adidas-h685-conjunto-dama	2	Adidas	Conjunto deportivo Adidas para dama, buso y leggins. Tallas S-XL.	150000	COP	15	VKT-VOKTER-ADIH685-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:15:05.806584+00
03bfc3c9-b6ea-43f8-ab2c-f77eff53be53	Nike N8805 Conjunto	nike-n8805-conjunto	2	Nike	Conjunto deportivo Nike, chaqueta y pantalón. Tallas XL-4XL.	165000	COP	12	VKT-VOKTER-NIKEN8805-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:16:08.598355+00
03ea46be-6558-4f6f-8237-3e54d61ad3e7	Nike Conjunto Rosa/Negro	nike-conjunto-rosa-negro	2	Nike	Conjunto deportivo Nike acolchado, rosa y negro. Tallas S-XL.	145000	COP	14	VKT-VOKTER-NIKEROSA-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:16:35.17416+00
a7d60352-d1c3-4320-a79d-00c79fa7c829	Nike H-89 Conjunto Dama	nike-h89-conjunto-dama	2	Nike	Conjunto deportivo Nike para dama, buso y leggins. Tallas S-XL.	150000	COP	15	VKT-VOKTER-NIKEH89-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:17:35.305696+00
8d593b0b-5dd9-474b-8679-60833dd373b3	Puma 3503 Conjunto	puma-3503-conjunto	2	Puma	Conjunto deportivo Puma, chaqueta y pantalón. Tallas XL-4XL.	150000	COP	12	VKT-VOKTER-PUMA3503-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:18:49.979288+00
1d1556cf-c563-4eff-a076-c83618811786	Nike H-88 Conjunto Dama	nike-h88-conjunto-dama	2	Nike	Conjunto deportivo Nike para dama, buso y leggins. Tallas S-XL.	150000	COP	15	VKT-VOKTER-NIKEH88-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:19:33.287154+00
ff1eac27-6445-4bec-9f19-77af21b1efc2	On Running 6976 Conjunto	on-running-6976-conjunto	2	On Running	Conjunto deportivo On Running, chaqueta y pantalón. Tallas XL-4XL.	180000	COP	8	VKT-VOKTER-ONRUN6976-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:20:13.751952+00
4a70bfa1-920c-4e9a-af62-edbd2169502b	Jordan 2333 Conjunto	jordan-2333-conjunto	2	Jordan	Conjunto deportivo Jordan, chaqueta y pantalón. Tallas XL-4XL.	195000	COP	7	VKT-VOKTER-JORDAN2333-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:21:09.977493+00
c723d874-7e3d-43cd-8de9-895fb936c33b	Adidas 3 Franjas Teal	adidas-3-franjas-teal	2	Adidas	Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.	140000	COP	16	VKT-VOKTER-ADI3FTEAL-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:21:46.553107+00
f150a5ca-f751-4156-ac3d-9b0f603aa9e2	Nike Conjunto Aqua/Negro	nike-conjunto-aqua-negro	2	Nike	Conjunto deportivo Nike acolchado, aqua y negro. Tallas S-XL.	145000	COP	14	VKT-VOKTER-NIKEAQUA-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:22:19.18636+00
9b1fe65d-16ec-4214-ab2e-188ce3d795a9	Puma 3508 Conjunto	puma-3508-conjunto	2	Puma	Conjunto deportivo Puma, chaqueta y pantalón. Tallas XL-4XL.	150000	COP	12	VKT-VOKTER-PUMA3508-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:23:06.552282+00
10bdbbab-d302-43ed-b0e7-b8f559251de0	Adidas 3 Franjas Lila	adidas-3-franjas-lila	2	Adidas	Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.	140000	COP	16	VKT-VOKTER-ADI3FLILA-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:23:30.96385+00
a6354a85-c98d-4aa9-84d8-b2e15b459cd7	Under Armour 6976 Conjunto	under-armour-6976-conjunto	2	Under Armour	Conjunto deportivo Under Armour, chaqueta y pantalón. Tallas XL-4XL.	170000	COP	10	VKT-VOKTER-UA6976-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:24:24.021935+00
c71e8800-2b35-4e77-869e-ad3d900f601a	Adidas 3 Franjas Verde	adidas-3-franjas-verde	2	Adidas	Conjunto deportivo Adidas 3 franjas para dama. Tallas S-XL.	140000	COP	16	VKT-VOKTER-ADI3FVERDE-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:24:46.085386+00
5161b758-5094-4594-8fa7-823527c935e1	Camisa Selección Colombia	camisa-seleccion-colombia	2		Camiseta de fútbol Selección Colombia. Tallas S-XL.	120000	COP	20	VKT-VOKTER-COLJER01-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:26:15.819384+00
0014a4bd-7718-45ae-a56d-efdcf848a1ae	Lacoste 2335 Conjunto	lacoste-2335-conjunto	2	Lacoste	Conjunto deportivo Lacoste, chaqueta y pantalón. Tallas XL-4XL.	185000	COP	6	VKT-VOKTER-LACOSTE2335-01	active	{}	t	2026-09-18 19:03:02.59791+00	2026-09-18 19:27:01.31278+00
495467ae-8a9d-4b4f-a434-0e805adae2b2	Micrófono Inalámbrico K9	microfono-inalambrico-k9	3	K9	Micrófono inalámbrico compacto para celular, compatible con USB-C y Lightning.	25000	COP	20	VKT-GOLD-MICK9-01	active	{}	t	2026-09-16 22:30:38.707544+00	2026-09-17 21:09:42.491096+00
ff3cd5cb-8115-422f-8d41-d901cd6ac87e	Power Bank 2300mAh Llavero	power-bank-2300mah-llavero	5	Fly	Power bank tipo llavero de 2300mAh, ideal como carga de emergencia para iPhone.	13000	COP	25	VKT-GOLD-PB2300-01	active	{}	t	2026-09-16 22:30:38.715126+00	2026-09-17 21:09:42.491096+00
0f524fa4-401d-4671-ba3d-96e2eb546977	Power Bank 10.000 mAh	power-bank-10000mah	5	Powertech	Power bank 10.000mAh con pantalla digital de batería y cable incluido.	45000	COP	18	VKT-GOLD-PB10000-01	active	{}	t	2026-09-16 22:30:38.721981+00	2026-09-17 21:09:42.491096+00
3b9c72f6-3f01-4653-8d4a-0bd93cd5ce85	Power Bank 20.000 mAh	power-bank-20000mah	5	WIWU	Power bank de alta capacidad 20.000mAh, carga múltiples dispositivos.	55000	COP	12	VKT-GOLD-PB20000-01	active	{}	t	2026-09-16 22:30:38.728459+00	2026-09-17 21:09:42.491096+00
00603ec7-bd38-426a-8577-cb5552021081	Mouse Inalámbrico Óptico	mouse-inalambrico-optico	5	GOLD	Mouse óptico inalámbrico 1600 DPI, conexión 2.4GHz.	12000	COP	30	VKT-GOLD-MOUSEW-01	active	{}	t	2026-09-16 22:30:38.735232+00	2026-09-17 21:09:42.491096+00
cf160a89-c31e-43a2-83eb-93702551c939	Cargador 67W Tipo C	cargador-67w-tipo-c	5	Xiaomi	Cargador rápido 67W USB-C con cable incluido, carga completa de smartphones y tablets compatibles.	22000	COP	30	VKT-GOLD-CHG67W-01	active	{}	t	2026-09-16 22:30:38.637215+00	2026-09-17 21:09:42.491096+00
18bfc1cf-8b34-42df-a348-8295a8a094fb	Cargador 4A y 20W Tipo C	cargador-4a-20w-tipo-c	5	Technomaster	Cargador de pared 20W con cable USB tipo C incluido, carga rápida 4A.	7000	COP	40	VKT-GOLD-CHG20W-01	active	{}	t	2026-09-16 22:30:38.649969+00	2026-09-17 21:09:42.491096+00
adc3e609-238c-4b6f-9b51-cd79c8d3e16d	Cabeza iPhone 25W	cabeza-iphone-25w	5	Apple-compatible	Adaptador de corriente USB-C 25W, compatible con carga rápida de iPhone.	9000	COP	35	VKT-GOLD-HEAD25W-01	active	{}	t	2026-09-16 22:30:38.658565+00	2026-09-17 21:09:42.491096+00
0932e634-f013-451d-8906-606a16c2ba08	Cargador 25W Tipo C iPhone	cargador-25w-tipo-c-iphone	5	Apple-compatible	Cargador 25W USB-C con cable USB-C a Lightning incluido para iPhone.	15000	COP	28	VKT-GOLD-CHGIPH25-01	active	{}	t	2026-09-16 22:30:38.667165+00	2026-09-17 21:09:42.491096+00
c7eb63b7-5bcc-4776-8cd1-81d563bffbff	Holder para Carro Chupa Imán	holder-carro-chupa-iman	5	Technomaster	Soporte magnético para carro con base de ventosa, tecnología Quick-Snap.	10000	COP	22	VKT-GOLD-HOLDCAR1-01	active	{}	t	2026-09-16 22:30:38.675442+00	2026-09-17 21:09:42.491096+00
164af33f-935d-4d67-a711-3d452f210283	Holder para Carro	holder-para-carro	5	Power and Power	Soporte para carro de un toque, rotación 360°, fácil instalación.	9500	COP	18	VKT-GOLD-HOLDCAR2-01	active	{}	t	2026-09-16 22:30:38.683881+00	2026-09-17 21:09:42.491096+00
be3478cf-c44f-4488-84ff-ff135a5a7da0	Soporte para Moto Manubrio 360	soporte-moto-manubrio-360	5	Technomaster	Soporte todo incluido para manubrio de moto, resistente al agua 360°.	15000	COP	15	VKT-GOLD-MOTOMAN-01	active	{}	t	2026-09-16 22:30:38.692003+00	2026-09-17 21:09:42.491096+00
b61a1e74-928d-40d4-b674-cb8e6419e440	Mouse Alámbrico Óptico	mouse-alambrico-optico	5	SJ-100	Mouse óptico con cable USB plug and play.	5500	COP	40	VKT-GOLD-MOUSEC-01	active	{}	t	2026-09-16 22:30:38.741788+00	2026-09-17 21:09:42.491096+00
275f8c28-6019-49f9-b1de-e37d62520a03	Combo Gamer T25	combo-gamer-t25	5	T25	Combo teclado y mouse gamer con luces LED de colores.	45000	COP	10	VKT-GOLD-COMBOG25-01	active	{}	t	2026-09-16 22:30:38.748454+00	2026-09-17 21:09:42.491096+00
3176d513-c4d0-4983-a83f-ed19f88dff36	Teclado Cable FC-530	teclado-cable-fc-530	5	Weibo	Teclado alámbrico de oficina, conexión USB.	13000	COP	20	VKT-GOLD-TECCAB-01	active	{}	t	2026-09-16 22:30:38.755072+00	2026-09-17 21:09:42.491096+00
1105e651-2d2d-4917-b932-87c42222bcf0	Teclado y Mouse Inalámbrico	teclado-mouse-inalambrico	5	MK220	Combo teclado y mouse inalámbrico 2.4GHz, ideal para oficina.	55000	COP	14	VKT-GOLD-TECMOUSEW-01	active	{}	t	2026-09-16 22:30:38.762601+00	2026-09-17 21:09:42.491096+00
664a3e95-bb3a-4d21-b0c6-ac36735e7087	TV Stick Android TV	tv-stick-android-tv	5	Android TV	Convierte cualquier TV en Smart TV 4K, incluye control remoto.	55000	COP	16	VKT-GOLD-TVSTICK-01	active	{}	t	2026-09-16 22:30:38.771529+00	2026-09-17 21:09:42.491096+00
c233be46-f141-4a75-937b-437426f45f90	Antena TDT 5M	antena-tdt-5m	5	TDT	Antena de interior para televisión digital terrestre, base magnética.	15000	COP	20	VKT-GOLD-ANTTDT-01	active	{}	t	2026-09-16 22:30:38.781067+00	2026-09-17 21:09:42.491096+00
98f77d35-c55e-44fe-9df4-ccbb56f77669	Hub USB Multipuerto	hub-usb-multipuerto	5	GOLD	Hub USB 3.0 de 4 puertos, alta velocidad de transferencia.	19500	COP	22	VKT-GOLD-HUBUSB-01	active	{}	t	2026-09-16 22:30:38.788866+00	2026-09-17 21:09:42.491096+00
0695b5ab-280e-47a4-99fb-12e5b0d21378	Funda Space Collection Transparente	funda-space-collection	5	Space Collection	Funda transparente resistente a caídas, estándar militar de protección.	3000	COP	50	VKT-GOLD-FUNDASP-01	active	{}	t	2026-09-16 22:30:38.795551+00	2026-09-17 21:09:42.491096+00
d2919b50-8bc8-4922-b1a8-170f61360c19	Sábana Estampada Triángulos	sabana-estampada-triangulos	6	Star Home	Juego de sábanas 100% algodón, 320 hilos. Incluye sobresábana, sábana ajustable y fundas de almohada.	149000	COP	10	VKT-GOLD-SABTRI-01	active	{}	t	2026-09-16 22:30:38.801704+00	2026-09-17 21:09:42.491096+00
1d28c6ac-2335-492f-9b76-ff99db7cb904	Sábana Estampada Geométrica	sabana-estampada-geometrica	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, diseño geométrico gris y beige.	149000	COP	10	VKT-GOLD-SABGEO-01	active	{}	t	2026-09-16 22:30:38.808267+00	2026-09-17 21:09:42.491096+00
ff3ea6b8-4b4e-4418-ad5a-3ef3864337a8	Sábana Estampada Floral	sabana-estampada-floral	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, estampado floral acuarela.	149000	COP	10	VKT-GOLD-SABFLOR-01	active	{}	t	2026-09-16 22:30:38.814627+00	2026-09-17 21:09:42.491096+00
cd910b9c-718e-4f9a-934c-0efde4854dd8	Cargador 25W Tipo C	gold-cargador-25w-tipo-c	5	Xiaomi	Cargador rápido 25W USB-C, compatible con la mayoría de smartphones.	16000	COP	25	VKT-GOLDCHG25W-01	active	{}	t	2026-09-16 22:28:19.36527+00	2026-09-17 21:09:42.491096+00
427919b0-b024-439e-a6bb-0198de973dd7	Soporte para Moto Manubrio Impermeable XL+Z	soporte-moto-manubrio-xlz	5	XL+Z	Funda impermeable 360° para celular con soporte para manubrio de moto o bicicleta, resistente a caidas y golpes.	13000	COP	15	VKT-GOLD-MOTOXLZ-01	active	{}	t	2026-09-16 23:07:51.142643+00	2026-09-17 21:09:42.491096+00
9d5a0925-bb30-4556-ada1-69508dbe04e9	Power Bank 5000mAh MagSafe	power-bank-5000mah-magsafe	5	Apple-compatible	Bateria portatil con carga inalambrica magnetica tipo MagSafe para iPhone, 5000 mAh.	45000	COP	12	VKT-GOLD-PB5000-01	active	{}	t	2026-09-16 23:07:51.142643+00	2026-09-17 21:09:42.491096+00
4c06213e-8f10-427a-8686-19a6f90dce94	Consola de Videojuegos Retro	consola-retro-blanca-verde	5		Consola de videojuegos retro con miles de juegos integrados, incluye 2 controles inalambricos y salida HDMI.	75000	COP	8	VKT-GOLD-CONSRETRO-01	active	{}	t	2026-09-16 23:07:51.142643+00	2026-09-17 21:09:42.491096+00
e88819ca-c04a-41c1-bb07-9b96604d2c46	Proyector Portatil con Juegos	proyector-con-juegos	5		Mini proyector portatil con Android TV integrado, incluye control remoto y 2 controles de juego inalambricos.	185000	COP	5	VKT-GOLD-PROYECTOR-01	active	{}	t	2026-09-16 23:07:51.142643+00	2026-09-17 21:09:42.491096+00
de76e120-3474-4e44-b4ac-cf5c8b7cc890	Onn. Watch HD Streaming Device	onn-watch-streaming-stick	5	onn.	Reproductor de streaming HD con Google TV integrado, incluye control remoto.	80000	COP	10	VKT-GOLD-ONNWATCH-01	active	{}	t	2026-09-16 23:07:51.142643+00	2026-09-17 21:09:42.491096+00
e3cd164e-e281-4043-a7fe-0d9ff310f999	Sábana Estampada Patchwork	sabana-estampada-patchwork	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, diseño patchwork geométrico en azul, beige y rosa.	149000	COP	10	VKT-GOLD-SABPATCH-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
e1b59f83-5325-4594-81f0-f6c0ef1526cd	Sábana Estampada Animal Print	sabana-estampada-animal-print	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, estampado animal print dorado y negro.	149000	COP	10	VKT-GOLD-SABANIMAL-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
f41e9129-0660-4882-a953-a72f78b594ec	Sábana Estampada Abstracta	sabana-estampada-abstracta	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, diseño abstracto gris azulado con lunares.	149000	COP	10	VKT-GOLD-SABABS-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
6f086fa6-e70c-4b7d-b8c3-65f31597d93f	Sábana Estampada Acuarela Gris	sabana-estampada-acuarela-gris	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, manchas acuarela gris azulado con lunares.	149000	COP	10	VKT-GOLD-SABACUA-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
80d1958b-221d-431e-b2b4-feb84e3bd2b7	Sábana Estampada Memphis	sabana-estampada-memphis	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, patrón geométrico colorido estilo Memphis.	149000	COP	10	VKT-GOLD-SABMEMP-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
104b66f4-4e5e-46ca-a164-b87c9543f61f	Sábana Estampada Cintas	sabana-estampada-cintas	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, cintas onduladas cafés, blancas y azul marino.	149000	COP	10	VKT-GOLD-SABCINT-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
0e75e170-7cfa-442f-9e79-53e9e72ace04	Sábana Estampada Hojas	sabana-estampada-hojas	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, estampado de hojas verdes sobre fondo blanco.	149000	COP	10	VKT-GOLD-SABHOJA-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
1d325955-5ecd-44ce-adff-51c9621bdb5b	Sábana Estampada Bloques Pastel	sabana-estampada-bloques-pastel	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, bloques geométricos en tonos pastel.	149000	COP	10	VKT-GOLD-SABPAST-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
dbd9136c-b3b9-4302-bd0e-c19d506236d9	Sábana Estampada Círculos	sabana-estampada-circulos	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, círculos y ondas en gris y blanco.	149000	COP	10	VKT-GOLD-SABCIRC-01	active	{}	t	2026-09-16 23:18:32.783031+00	2026-09-17 21:09:42.491096+00
9abe7cb9-40d3-4c5b-9774-cc1e119c0da7	Sábana Estampada Estrellas	sabana-estampada-estrellas	6	Star Home	Juego de sábanas 100% algodón, 320 hilos, estampado de estrellas y soles en blanco y negro.	149000	COP	10	VKT-GOLD-SABEST-01	active	{}	t	2026-09-17 03:52:02.622642+00	2026-09-17 21:09:42.491096+00
5eb2b02a-675d-4ef7-a52d-07dadf9e3db7	Hoodie Terracota	hoodie-terracota	2	Vokter	Hoodie Vokter corte relajado en tono terracota, algodón perchado suave.	135000	COP	15	VKT-VOKTER-HOODT-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
c143ae40-946c-4db7-928c-00fd2aa0a3bf	Audífono Bluetooth Balaca Pro Air	audifono-bluetooth-balaca-pro-air	3	\N	Audífono bluetooth deportivo de oreja abierta por conducción de aire, hasta 8 horas de reproducción.	35000	COP	15	VKT-GOLD-BALPRO-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
4213dbd4-da8a-4db4-ac6f-0a012a989cd4	Audífono Bluetooth Balaca Air Max	audifono-bluetooth-balaca-air-max	3	\N	Audífono bluetooth tipo diadema, estilo premium, estuche y accesorios incluidos.	90000	COP	8	VKT-GOLD-BALAIRMAX-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
338920f9-119b-4332-9d60-c02923cf5c9a	Diadema Gamer Balaca	diadema-gamer-balaca	3	\N	Diadema gamer con iluminación LED, micrófono abatible, conexión con cable.	63000	COP	10	VKT-GOLD-BALGAMER-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
86a8a7ab-d20f-410f-997f-6f97f749e514	Diadema Sony MDR XB450	diadema-sony-mdr-xb450	3	Sony	Diadema Sony MDR XB450 con cable, graves reforzados, control en línea con micrófono.	14500	COP	18	VKT-SONY-XB450-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
668de464-1fdf-4394-b078-25d4b866c36c	Diadema Inalámbrica N65BT	diadema-inalambrica-n65bt	3	Technomaster	Diadema inalámbrica Technomaster N65BT, radio FM y ranura microSD, varios colores.	32000	COP	12	VKT-TECHNO-N65BT-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
4f588af1-2ea1-4879-a7c4-d51d403095a8	Diadema Sony Bluetooth 450BT	diadema-sony-bluetooth-450bt	3	Sony	Diadema inalámbrica Sony 450BT h.ear, Hi-Res Audio, bluetooth.	25000	COP	14	VKT-SONY-450BT-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
fe8eb8c8-1416-4f07-9d29-0076d7117696	Diadema P9 Tipo Apple	diadema-p9-tipo-apple	3	\N	Diadema inalámbrica estilo P9, diseño premium tipo Apple, bluetooth.	52000	COP	10	VKT-GOLD-P9-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
dd4079d9-8033-42c1-8f8a-d26d5911c517	Diadema Airpods Max (símil)	diadema-airpods-max-simil	3	\N	Diadema inalámbrica bluetooth, diseño símil Airpods Max, acabado metálico.	52000	COP	10	VKT-GOLD-APMAXSIM-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
6e5533c4-cb73-4433-8b15-c76652adeaf9	Parlante Portátil S410	parlante-portatil-s410	3	\N	Parlante bluetooth portátil 4 pulgadas con luces LED.	38000	COP	12	VKT-GOLD-S410-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
f5d25a81-6e5a-4ae6-88c0-854c92662ebb	Parlante Bluetooth S430	parlante-bluetooth-s430	3	Fly	Parlante bluetooth Fly S430 tipo boombox, luces LED, asa de transporte.	75000	COP	8	VKT-FLY-S430-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
7f3cdc65-ee98-4036-b9e8-af88a700f9d7	Parlante FL828 Fly Sound	parlante-fl828-fly-sound	3	Fly Sound	Parlante Fly Sound FL828 con control remoto, entrada para micrófono.	85000	COP	6	VKT-FLYSOUND-FL828-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
98cb17c2-f204-4b80-86ce-393913182dcb	Parlante Fly Sound S520 12"	parlante-fly-sound-s520	3	Fly Sound	Parlante Fly Sound S520 de 12 pulgadas, 2000W, luces RGB, con ruedas y antena.	85000	COP	5	VKT-FLYSOUND-S520-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
7584be1b-1bcd-4b88-b4f6-7084d0457972	Cuellera Bluetooth ZON-35	cuellera-bluetooth-zon-35	4	WW Wireless	Cuellera bluetooth deportiva ZON-35, diseño para uso activo, manos libres.	18000	COP	16	VKT-WW-ZON35-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
8dcbeeaa-bdd6-4327-9257-05207ea99119	Audífono Conducción Ósea F-20	audifono-conduccion-osea-f20	4	Gly	Audífono deportivo de conducción ósea Gly F-20, bluetooth 5.2, resistente al sudor.	38000	COP	10	VKT-GLY-F20-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
af0ae525-0161-4062-945f-6216cd9f5db4	Audífono Conducción Ósea F805	audifono-conduccion-osea-f805	4	Power and Power	Audífono deportivo open ear de conducción ósea Power and Power F805, bluetooth V5.4.	40000	COP	10	VKT-PYP-F805-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-17 21:09:42.491096+00
b53364cf-b721-4d3a-ba9f-f288e066643e	Parlante Portátil S640	parlante-portatil-s640	3	\N	Parlante portátil resistente con asa, ideal para exteriores.	130000	COP	20	VKT-GOLD-S640-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-18 02:41:44.418486+00
c5da8f09-ff74-411b-a91d-04be5ec5863a	Audífonos Manos Libres W-01	audifonos-w01	4	Technomaster	Audífonos estéreo manos libres, conector 3.5mm, con micrófono y controles en línea.	6500	COP	40	VKT-TECHNO-W01-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-18 02:41:56.30737+00
f437d7e4-ff55-4cf1-b4fc-c78b63aa1dbd	Audífonos Manos Libres Z1 Bass	audifonos-z1-bass	3	Technomaster	Audífonos universales con bass reforzado, conector 3.5mm, micrófono manos libres.	8500	COP	40	VKT-TECHNO-Z1-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-18 02:42:12.821919+00
59216550-6669-48aa-a279-e6c59295275d	Hoodie Oversize Verde Menta	hoodie-oversize-verde-menta	2	Vokter	Hoodie oversize Vokter en algodón grueso, tono verde menta, capucha con cordón ajustable.	129000	COP	18	VKT-VOKTER-HOODG-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
4f7a8721-0c13-4a7a-8b4f-f94fc6165236	Hoodie Oversize Blanco	hoodie-oversize-blanco	2	Vokter	Hoodie oversize Vokter en algodón grueso, capucha con cordón ajustable, corte urbano unisex.	129000	COP	20	VKT-VOKTER-HOODW-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
2002d3f0-105c-4111-afd3-4ca81344b8c2	Chaqueta Bomber Negra	chaqueta-bomber-negra	2	Vokter	Chaqueta bomber urbana Vokter en negro, cierre frontal y ajuste regular.	165000	COP	12	VKT-VOKTER-BOMBER-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
29528a11-34e1-49ce-8bee-1cd0e7c53b5e	Pantalón Cargo Blanco Oversize	pantalon-cargo-blanco	2	Vokter	Pantalón cargo Vokter oversize en blanco, bolsillos laterales, jogger ajustable.	139000	COP	16	VKT-VOKTER-CARGOW-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
a8c829a7-342f-4448-9a97-37665e6fe8f9	Camiseta Oversize Blanca	camiseta-oversize-blanca	2	Vokter	Camiseta Vokter oversize 100% algodón, corte amplio, básica blanca.	59000	COP	30	VKT-VOKTER-TEEW-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
2018cfcc-c490-4430-b2a0-9da8e756294a	Camiseta Básica Beige	camiseta-basica-beige	2	Vokter	Camiseta Vokter básica en beige, algodón suave, corte unisex.	55000	COP	25	VKT-VOKTER-TEEB-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
6d678565-ee45-4e94-8ae7-2d46d9c5c843	Gorra Trucker Blanca	gorra-trucker-blanca	2	Vokter	Gorra trucker Vokter blanca y negra, malla trasera ajustable.	45000	COP	22	VKT-VOKTER-CAPW-01	active	{}	t	2026-09-17 19:21:56.174174+00	2026-09-17 21:12:06.604244+00
d2420ae8-6784-4975-8b95-cb876def56d2	Chaqueta Denim Urbana	chaqueta-denim-urbana	2	Vokter	Chaqueta Vokter de mezclilla, corte urbano regular, bolsillos frontales.	149000	COP	14	VKT-VOKTER-DENIM-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
b115c45a-72b9-478b-8d07-b771dd85030f	Chaqueta Puffer Negra	chaqueta-puffer-negra	2	Vokter	Chaqueta acolchada Vokter con capucha, ideal para clima frío, cierre frontal.	175000	COP	10	VKT-VOKTER-PUFFER-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
a65361da-2d91-4ce9-b87d-65a190eeee66	Audífonos Samsung AKG	audifonos-samsung-akg	4	AKG	Audífonos in-ear afinados por AKG, conector 3.5mm, compatibles Galaxy S8/S9.	15000	COP	35	VKT-AKG-GALAXY-01	active	{}	t	2026-09-17 19:29:56.044193+00	2026-09-18 02:41:19.578344+00
422969ec-15d3-4ba9-934e-3fe4bcce2865	Vokter Runner X	nova-runner-x	1	Vokter	Zapatilla urbana de alto rendimiento	450000	COP	11	VKT-RUNNERX-001	active	{"talla_disponible": [38, 39, 40, 41]}	t	2026-09-16 21:00:08.022336+00	2026-09-17 21:09:42.491096+00
207646f5-23ca-4524-8ca5-c3fc09503680	Vokter Audífonos Urban Pro	nova-audifonos-urban-pro	3	Vokter	Audífonos inalámbricos con cancelación de ruido, diseño único y edición limitada.	65000	COP	25	VKT-AUDIFONOS-001	active	{}	t	2026-09-16 21:01:29.587985+00	2026-09-17 21:09:42.491096+00
2576ddcf-b2bb-41f0-b9ec-ce1d4ad77e13	Jogger Gris Oversize	jogger-gris-oversize	2	Vokter	Jogger Vokter oversize en gris jaspeado, cintura elástica con cordón, bolsillos laterales.	119000	COP	18	VKT-VOKTER-JOGGERG-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
739adc7d-dfca-4038-9a89-7c5278704045	Camiseta Tank Top Blanca	camiseta-tank-top-blanca	2	Vokter	Camiseta tipo tank top Vokter en algodón, corte unisex, básica blanca.	45000	COP	28	VKT-VOKTER-TANKW-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
bd2b1ba6-e35b-4d07-945a-abfb327908bb	Camisa Manga Larga Verde	camisa-manga-larga-verde	2	Vokter	Camisa Vokter de manga larga en verde oliva, corte regular, bolsillo frontal.	89000	COP	16	VKT-VOKTER-SHIRTG-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
4d4fc50d-19c6-4f23-a3c2-b404f56b4905	Chaleco Utilitario Negro	chaleco-utilitario-negro	2	Vokter	Chaleco utilitario Vokter multibolsillos en negro, ideal para looks urbanos por capas.	99000	COP	12	VKT-VOKTER-VESTB-01	active	{}	t	2026-09-17 20:05:52.345134+00	2026-09-17 21:12:06.604244+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: nova
--

COPY public.schema_migrations (filename, applied_at) FROM stdin;
001_initial_schema.sql	2026-09-18 17:34:05.273097+00
002_seed_categories.sql	2026-09-18 17:34:05.275119+00
003_rename_codes_to_vkt.sql	2026-09-18 17:34:05.278883+00
004_conjuntos_y_sneakers.sql	2026-10-16 19:41:07.144459+00
\.


--
-- Name: ai_tool_calls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nova
--

SELECT pg_catalog.setval('public.ai_tool_calls_id_seq', 17, true);


--
-- Name: authenticity_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nova
--

SELECT pg_catalog.setval('public.authenticity_checks_id_seq', 8, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nova
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: ai_tool_calls ai_tool_calls_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.ai_tool_calls
    ADD CONSTRAINT ai_tool_calls_pkey PRIMARY KEY (id);


--
-- Name: authenticity_checks authenticity_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.authenticity_checks
    ADD CONSTRAINT authenticity_checks_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: drop_products drop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_products
    ADD CONSTRAINT drop_products_pkey PRIMARY KEY (drop_id, product_id);


--
-- Name: drop_waitlist drop_waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_waitlist
    ADD CONSTRAINT drop_waitlist_pkey PRIMARY KEY (drop_id, user_id);


--
-- Name: drops drops_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drops
    ADD CONSTRAINT drops_pkey PRIMARY KEY (id);


--
-- Name: drops drops_slug_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drops
    ADD CONSTRAINT drops_slug_key UNIQUE (slug);


--
-- Name: order_items order_items_order_id_product_id_unit_id_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_product_id_unit_id_key UNIQUE (order_id, product_id, unit_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_product_id_position_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_position_key UNIQUE (product_id, "position");


--
-- Name: product_units product_units_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_pkey PRIMARY KEY (id);


--
-- Name: product_units product_units_unit_code_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_unit_code_key UNIQUE (unit_code);


--
-- Name: products products_authenticity_code_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_authenticity_code_key UNIQUE (authenticity_code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: push_tokens push_tokens_expo_token_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_expo_token_key UNIQUE (expo_token);


--
-- Name: push_tokens push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_product_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_user_id_key UNIQUE (product_id, user_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (filename);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_tool_calls_conv; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_ai_tool_calls_conv ON public.ai_tool_calls USING btree (conversation_id, created_at);


--
-- Name: idx_auth_checks_code; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_auth_checks_code ON public.authenticity_checks USING btree (code_scanned, created_at DESC);


--
-- Name: idx_drop_products_product; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_drop_products_product ON public.drop_products USING btree (product_id);


--
-- Name: idx_drops_calendar; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_drops_calendar ON public.drops USING btree (launch_at) WHERE (status = ANY (ARRAY['scheduled'::public.drop_status, 'live'::public.drop_status]));


--
-- Name: idx_order_items_product; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id, created_at DESC);


--
-- Name: idx_product_units_product; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_product_units_product ON public.product_units USING btree (product_id);


--
-- Name: idx_products_attrs; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_products_attrs ON public.products USING gin (attributes jsonb_path_ops);


--
-- Name: idx_products_catalog; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_products_catalog ON public.products USING btree (category_id, price_cents) WHERE is_published;


--
-- Name: idx_products_name_trgm; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_products_name_trgm ON public.products USING gin (public.immutable_unaccent((name)::text) public.gin_trgm_ops);


--
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_products_price ON public.products USING btree (price_cents) WHERE is_published;


--
-- Name: idx_products_search; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_products_search ON public.products USING gin (search_vector);


--
-- Name: idx_push_tokens_user; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_push_tokens_user ON public.push_tokens USING btree (user_id);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: idx_reviews_product; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_reviews_product ON public.reviews USING btree (product_id, created_at DESC);


--
-- Name: idx_reviews_user; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_reviews_user ON public.reviews USING btree (user_id);


--
-- Name: idx_waitlist_queue; Type: INDEX; Schema: public; Owner: nova
--

CREATE INDEX idx_waitlist_queue ON public.drop_waitlist USING btree (drop_id, joined_at) WHERE (status = 'waiting'::public.waitlist_status);


--
-- Name: drops trg_drops_updated; Type: TRIGGER; Schema: public; Owner: nova
--

CREATE TRIGGER trg_drops_updated BEFORE UPDATE ON public.drops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: orders trg_orders_updated; Type: TRIGGER; Schema: public; Owner: nova
--

CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: products trg_products_updated; Type: TRIGGER; Schema: public; Owner: nova
--

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: reviews trg_reviews_updated; Type: TRIGGER; Schema: public; Owner: nova
--

CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users trg_users_updated; Type: TRIGGER; Schema: public; Owner: nova
--

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ai_tool_calls ai_tool_calls_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.ai_tool_calls
    ADD CONSTRAINT ai_tool_calls_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: authenticity_checks authenticity_checks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.authenticity_checks
    ADD CONSTRAINT authenticity_checks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: authenticity_checks authenticity_checks_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.authenticity_checks
    ADD CONSTRAINT authenticity_checks_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.product_units(id) ON DELETE SET NULL;


--
-- Name: authenticity_checks authenticity_checks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.authenticity_checks
    ADD CONSTRAINT authenticity_checks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: drop_products drop_products_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_products
    ADD CONSTRAINT drop_products_drop_id_fkey FOREIGN KEY (drop_id) REFERENCES public.drops(id) ON DELETE CASCADE;


--
-- Name: drop_products drop_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_products
    ADD CONSTRAINT drop_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: drop_waitlist drop_waitlist_drop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_waitlist
    ADD CONSTRAINT drop_waitlist_drop_id_fkey FOREIGN KEY (drop_id) REFERENCES public.drops(id) ON DELETE CASCADE;


--
-- Name: drop_waitlist drop_waitlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.drop_waitlist
    ADD CONSTRAINT drop_waitlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: order_items order_items_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.product_units(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_units product_units_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: product_units product_units_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.product_units
    ADD CONSTRAINT product_units_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: push_tokens push_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.push_tokens
    ADD CONSTRAINT push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_replaced_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_replaced_by_fkey FOREIGN KEY (replaced_by) REFERENCES public.refresh_tokens(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nova
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


