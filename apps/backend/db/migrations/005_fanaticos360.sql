-- =====================================================================
-- Fanáticos 360 · apuestas deportivas
--
-- Todo vive con el prefijo f360_ y no toca ninguna tabla de Vokter: las
-- cuentas son independientes a propósito (un usuario de la tienda no es un
-- apostador, y los datos que se piden para apostar son otros).
--
-- Dinero en pesos colombianos enteros (BIGINT). El peso no usa centavos en la
-- práctica y así no hay redondeos que expliquen.
-- =====================================================================

CREATE TYPE f360_doc_type     AS ENUM ('CC', 'CE', 'PA', 'PPT');
CREATE TYPE f360_match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
CREATE TYPE f360_market_status AS ENUM ('open', 'suspended', 'settled', 'void');
CREATE TYPE f360_result       AS ENUM ('won', 'lost', 'void');
CREATE TYPE f360_bet_status   AS ENUM ('open', 'won', 'lost', 'void');
CREATE TYPE f360_tx_type      AS ENUM ('deposit', 'withdrawal', 'stake', 'payout', 'refund', 'adjustment');
CREATE TYPE f360_tx_status    AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- ---------------------------------------------------------------------
-- Cuentas
-- ---------------------------------------------------------------------
CREATE TABLE f360_users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT         NOT NULL CHECK (length(trim(name)) >= 2),
    email               CITEXT       NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    document_type       f360_doc_type NOT NULL,
    document_number     TEXT         NOT NULL,
    birth_date          DATE         NOT NULL,
    phone               TEXT,
    terms_accepted_at   TIMESTAMPTZ  NOT NULL,
    -- pending: aún no se ha comprobado la identidad. Retirar exige 'verified'.
    kyc_status          TEXT         NOT NULL DEFAULT 'pending'
                        CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    -- Autoexclusión: mientras esté en el futuro no se puede depositar ni apostar.
    self_excluded_until TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (document_type, document_number),
    CONSTRAINT f360_users_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    -- La app lo valida antes con un mensaje claro; esto es la red de seguridad.
    CONSTRAINT f360_users_mayor_de_edad CHECK (birth_date <= (created_at::date - INTERVAL '18 years'))
);

CREATE TABLE f360_refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES f360_users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    replaced_by UUID REFERENCES f360_refresh_tokens(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_f360_refresh_user ON f360_refresh_tokens(user_id) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------
-- Deportes
-- ---------------------------------------------------------------------
CREATE TABLE f360_leagues (
    id            SERIAL PRIMARY KEY,
    provider      TEXT    NOT NULL,
    provider_id   TEXT    NOT NULL,
    name          TEXT    NOT NULL,
    short_name    TEXT,
    country       TEXT,
    logo_url      TEXT,
    season        INT,
    kind          TEXT    NOT NULL DEFAULT 'league' CHECK (kind IN ('league', 'cup')),
    -- Sede neutral (un Mundial): el modelo de cuotas no le da ventaja al local.
    neutral_venue BOOLEAN NOT NULL DEFAULT false,
    featured      BOOLEAN NOT NULL DEFAULT true,
    sort_order    INT     NOT NULL DEFAULT 100,
    UNIQUE (provider, provider_id)
);

CREATE TABLE f360_teams (
    id          SERIAL PRIMARY KEY,
    provider    TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    name        TEXT NOT NULL,
    short_name  TEXT,
    logo_url    TEXT,
    UNIQUE (provider, provider_id)
);

CREATE TABLE f360_matches (
    id            SERIAL PRIMARY KEY,
    provider      TEXT              NOT NULL,
    provider_id   TEXT              NOT NULL,
    league_id     INT               NOT NULL REFERENCES f360_leagues(id) ON DELETE CASCADE,
    home_team_id  INT               NOT NULL REFERENCES f360_teams(id),
    away_team_id  INT               NOT NULL REFERENCES f360_teams(id),
    kickoff_at    TIMESTAMPTZ       NOT NULL,
    status        f360_match_status NOT NULL DEFAULT 'scheduled',
    status_detail TEXT,
    minute        INT,
    round         TEXT,
    venue         TEXT,
    -- Marcador en vivo / final, prórroga incluida si la hubo.
    home_goals    INT,
    away_goals    INT,
    -- Marcador al final de los 90 minutos: con este se liquidan los mercados.
    home_goals_ft INT,
    away_goals_ft INT,
    -- Quién ganó o avanzó contando prórroga y penales (para "Clasifica").
    winner        TEXT CHECK (winner IN ('home', 'away', 'draw')),
    is_knockout   BOOLEAN NOT NULL DEFAULT false,
    -- 'proveedor' si las cuotas vienen del servicio externo, 'modelo' si las
    -- calculó nuestro modelo porque el servicio no las da para ese partido.
    odds_source   TEXT,
    priced_at     TIMESTAMPTZ,
    settled_at    TIMESTAMPTZ,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_id),
    CHECK (home_team_id <> away_team_id)
);
CREATE INDEX idx_f360_matches_kickoff ON f360_matches(kickoff_at);
CREATE INDEX idx_f360_matches_league  ON f360_matches(league_id, kickoff_at);
CREATE INDEX idx_f360_matches_pending ON f360_matches(status) WHERE settled_at IS NULL;

CREATE TABLE f360_markets (
    id       SERIAL PRIMARY KEY,
    match_id INT NOT NULL REFERENCES f360_matches(id) ON DELETE CASCADE,
    type     TEXT NOT NULL CHECK (type IN ('1x2', 'dc', 'ou', 'btts', 'cs', 'qualify')),
    -- Solo tiene sentido en Más/Menos (2.5 goles…). 0 en el resto, para que
    -- la clave única funcione igual en todas las versiones de PostgreSQL.
    line     NUMERIC(4, 1) NOT NULL DEFAULT 0,
    status   f360_market_status NOT NULL DEFAULT 'open',
    -- 'proveedor' o 'modelo'. El modelo nunca pisa una cuota del proveedor.
    source   TEXT NOT NULL DEFAULT 'modelo' CHECK (source IN ('modelo', 'proveedor')),
    UNIQUE (match_id, type, line)
);

CREATE TABLE f360_selections (
    id         SERIAL PRIMARY KEY,
    market_id  INT NOT NULL REFERENCES f360_markets(id) ON DELETE CASCADE,
    code       TEXT NOT NULL,
    label      TEXT NOT NULL,
    odds       NUMERIC(7, 2) NOT NULL CHECK (odds >= 1.01),
    result     f360_result,
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (market_id, code)
);

-- Tabla de posiciones: de aquí sale la fuerza de cada equipo para el modelo.
CREATE TABLE f360_standings (
    league_id     INT NOT NULL REFERENCES f360_leagues(id) ON DELETE CASCADE,
    team_id       INT NOT NULL REFERENCES f360_teams(id) ON DELETE CASCADE,
    played        INT NOT NULL DEFAULT 0,
    goals_for     INT NOT NULL DEFAULT 0,
    goals_against INT NOT NULL DEFAULT 0,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (league_id, team_id)
);

-- ---------------------------------------------------------------------
-- Billetera y apuestas
-- ---------------------------------------------------------------------
CREATE TABLE f360_wallets (
    user_id     UUID PRIMARY KEY REFERENCES f360_users(id) ON DELETE CASCADE,
    balance_cop BIGINT NOT NULL DEFAULT 0 CHECK (balance_cop >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE f360_bets (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID   NOT NULL REFERENCES f360_users(id) ON DELETE CASCADE,
    stake_cop            BIGINT NOT NULL CHECK (stake_cop > 0),
    total_odds           NUMERIC(10, 2) NOT NULL CHECK (total_odds >= 1.01),
    potential_payout_cop BIGINT NOT NULL,
    payout_cop           BIGINT,
    status               f360_bet_status NOT NULL DEFAULT 'open',
    placed_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at           TIMESTAMPTZ
);
CREATE INDEX idx_f360_bets_user ON f360_bets(user_id, placed_at DESC);

CREATE TABLE f360_bet_legs (
    id           SERIAL PRIMARY KEY,
    bet_id       UUID NOT NULL REFERENCES f360_bets(id) ON DELETE CASCADE,
    selection_id INT  NOT NULL REFERENCES f360_selections(id),
    match_id     INT  NOT NULL REFERENCES f360_matches(id),
    odds         NUMERIC(7, 2) NOT NULL,
    result       f360_result,
    -- En un combinado no se pueden mezclar dos selecciones del mismo partido:
    -- están correlacionadas y la cuota multiplicada mentiría.
    UNIQUE (bet_id, match_id)
);
CREATE INDEX idx_f360_legs_selection ON f360_bet_legs(selection_id);

-- Libro contable: cada movimiento de saldo queda aquí con el saldo resultante.
-- amount_cop siempre es positivo; el tipo dice si entra o sale.
CREATE TABLE f360_transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID   NOT NULL REFERENCES f360_users(id) ON DELETE CASCADE,
    type              f360_tx_type   NOT NULL,
    status            f360_tx_status NOT NULL DEFAULT 'completed',
    amount_cop        BIGINT NOT NULL CHECK (amount_cop > 0),
    balance_after_cop BIGINT,
    bet_id            UUID REFERENCES f360_bets(id),
    method            TEXT,
    provider          TEXT,
    provider_ref      TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    UNIQUE (provider, provider_ref)
);
CREATE INDEX idx_f360_tx_user ON f360_transactions(user_id, created_at DESC);

-- Límites de depósito que el propio usuario se pone (juego responsable).
-- Bajar un límite aplica ya; subirlo o quitarlo espera 24 h, para que no se
-- pueda levantar en caliente.
CREATE TABLE f360_limits (
    user_id              UUID   NOT NULL REFERENCES f360_users(id) ON DELETE CASCADE,
    period               TEXT   NOT NULL CHECK (period IN ('day', 'week', 'month')),
    amount_cop           BIGINT NOT NULL CHECK (amount_cop > 0),
    -- Cambio en espera. pending_amount_cop NULL con fecha = quitar el límite.
    pending_amount_cop   BIGINT CHECK (pending_amount_cop > 0),
    pending_effective_at TIMESTAMPTZ,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, period)
);

-- ---------------------------------------------------------------------
-- Sincronización con el proveedor de datos
-- ---------------------------------------------------------------------
CREATE TABLE f360_sync_state (
    key       TEXT PRIMARY KEY,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ok        BOOLEAN     NOT NULL DEFAULT true,
    detail    TEXT
);

-- Consultas al servicio externo por día: el plan gratuito tiene un tope y
-- pasarse deja la app sin datos hasta el día siguiente.
CREATE TABLE f360_api_usage (
    day      DATE PRIMARY KEY,
    requests INT NOT NULL DEFAULT 0
);
