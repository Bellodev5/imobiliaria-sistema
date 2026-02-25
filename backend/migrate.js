require('dotenv').config();
const pool = require('./database');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('[MIGRATE] Criando tabelas...');
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id         SERIAL PRIMARY KEY,
        nome       VARCHAR(150) NOT NULL,
        email      VARCHAR(150) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        perfil     VARCHAR(30)  NOT NULL DEFAULT 'corretor',
        ativo      BOOLEAN      NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // ─── TABELAS DE CADASTROS AUXILIARES ────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS imovel_tipos (
        id         SERIAL PRIMARY KEY,
        sigla      VARCHAR(10) UNIQUE NOT NULL,
        descricao  VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS municipios (
        id         SERIAL PRIMARY KEY,
        nome       VARCHAR(150) NOT NULL,
        uf         CHAR(2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bancos (
        id           SERIAL PRIMARY KEY,
        numero       VARCHAR(10) UNIQUE NOT NULL,
        nome_curto   VARCHAR(100) NOT NULL,
        razao_social VARCHAR(255),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS imoveis (
        id                          SERIAL PRIMARY KEY,
        codigo                      VARCHAR(20) NOT NULL UNIQUE,
        tipo                        VARCHAR(30) ,
        endereco                    VARCHAR(255) NOT NULL,
        numero                      VARCHAR(20),
        complemento                 VARCHAR(100),
        bairro                      VARCHAR(100),
        cidade                      VARCHAR(100),
        estado                      VARCHAR(100),
        proprietario                VARCHAR(150),
        cep                         VARCHAR(10),
        disponivel_venda            BOOLEAN NOT NULL DEFAULT false,
        vlr_venda                   NUMERIC(10,2) NOT NULL DEFAULT 0,
        disponivel_locacao          BOOLEAN NOT NULL DEFAULT false,
        vlr_locacao                 NUMERIC(10,2) NOT NULL DEFAULT 0,
        locado                      BOOLEAN NOT NULL DEFAULT false,
        reservado                   BOOLEAN NOT NULL DEFAULT false,
        vendido                     BOOLEAN NOT NULL DEFAULT false,
        perc_comissao_proprietario  NUMERIC(5,2) NOT NULL DEFAULT 0,
        perc_comissao_corretor      NUMERIC(5,2) NOT NULL DEFAULT 0,
        perc_comissao_imobiliaria   NUMERIC(5,2) NOT NULL DEFAULT 0,
        perc_comissao_terceiros     NUMERIC(5,2) NOT NULL DEFAULT 0,
        telefone                    BOOLEAN NOT NULL DEFAULT false,
        tipo_limpeza                VARCHAR(30) NOT NULL DEFAULT 'IMOBILIARIA',
        taxa_limpeza                NUMERIC(10,2) NOT NULL DEFAULT 0,
        inventario                  BOOLEAN NOT NULL DEFAULT false,
        ativo                       BOOLEAN NOT NULL DEFAULT true,
        obs                         TEXT,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    `);

    await client.query(`
  CREATE TABLE IF NOT EXISTS pessoas (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    cpf_cnpj        VARCHAR(20),
    email           VARCHAR(150),
    telefone        VARCHAR(30),          -- comercial
    celular         VARCHAR(30),
    endereco        VARCHAR(255),
    numero          VARCHAR(20),           -- número do endereço
    complemento     VARCHAR(100),
    bairro          VARCHAR(100),
    cidade          VARCHAR(100),
    estado          VARCHAR(100),
    tipo            VARCHAR(20) NOT NULL DEFAULT 'locatario',
    ativo           BOOLEAN NOT NULL DEFAULT true,
    -- novos campos:
    estado_civil    VARCHAR(30),            -- SOLTEIRO, CASADO, etc.
    rg_ie           VARCHAR(30),
    dni             VARCHAR(30),            -- documento estrangeiro
    profissao       VARCHAR(100),
    tel_residencial VARCHAR(30),
    inscricao       VARCHAR(50),            -- inscrição municipal/estadual
    contato         VARCHAR(150),           -- nome para contato
    tel_contato     VARCHAR(30),
    proprietario    BOOLEAN NOT NULL DEFAULT false,
    locatario       BOOLEAN NOT NULL DEFAULT false,
    corretor        BOOLEAN NOT NULL DEFAULT false,
    prestador       BOOLEAN NOT NULL DEFAULT false,
    fiador          BOOLEAN NOT NULL DEFAULT false,
    banco_id        INTEGER REFERENCES bancos(id),
    agencia         VARCHAR(20),
    conta           VARCHAR(30),
    nome_conta      VARCHAR(150),
    chave_pix       VARCHAR(255),
    aniversario     DATE,
    restricao       BOOLEAN NOT NULL DEFAULT false,
    obs_restricoes  TEXT,
    obs             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id                      SERIAL PRIMARY KEY,
        numero_contrato         INTEGER      NOT NULL DEFAULT 0,
        imovel_id               INTEGER      NOT NULL REFERENCES imoveis(id),
        locatario_id            INTEGER      NOT NULL REFERENCES pessoas(id),
        corretor_id             INTEGER      REFERENCES pessoas(id),
        fiador_id               INTEGER      REFERENCES pessoas(id),
        data_entrada            DATE         NOT NULL,
        data_saida              DATE         NOT NULL,
        data_limite             DATE,
        num_diarias             INTEGER      NOT NULL DEFAULT 1,
        valor_diaria            NUMERIC(10,2) NOT NULL DEFAULT 0,
        valor_total             NUMERIC(10,2) NOT NULL DEFAULT 0,
        adiantamento            NUMERIC(10,2) NOT NULL DEFAULT 0,
        perc_adiantamento       NUMERIC(5,2)  NOT NULL DEFAULT 0,
        caucao                  NUMERIC(10,2) NOT NULL DEFAULT 0,
        status                  VARCHAR(20)   NOT NULL DEFAULT 'EM ABERTO',
        tipo_locacao            VARCHAR(20)   NOT NULL DEFAULT 'DIARIA',
        eh_proprietario         BOOLEAN       NOT NULL DEFAULT false,
        tipo_limpeza            VARCHAR(30)   NOT NULL DEFAULT 'IMOBILIARIA',
        taxa_limpeza            NUMERIC(10,2) NOT NULL DEFAULT 0,
        prestador_id            INTEGER       REFERENCES pessoas(id),
        vlr_prestador           NUMERIC(10,2) NOT NULL DEFAULT 0,
        perc_comissao_prop      NUMERIC(5,2)  NOT NULL DEFAULT 0,
        perc_comissao_corretor  NUMERIC(5,2)  NOT NULL DEFAULT 0,
        perc_comissao_imob      NUMERIC(5,2)  NOT NULL DEFAULT 0,
        perc_comissao_terceiros NUMERIC(5,2)  NOT NULL DEFAULT 0,
        vlr_comissao_prop       NUMERIC(10,2) NOT NULL DEFAULT 0,
        vlr_comissao_corretor   NUMERIC(10,2) NOT NULL DEFAULT 0,
        vlr_comissao_imob       NUMERIC(10,2) NOT NULL DEFAULT 0,
        vlr_comissao_terceiros  NUMERIC(10,2) NOT NULL DEFAULT 0,
        obs                     TEXT,
        created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reserva_despesas (
        id         SERIAL PRIMARY KEY,
        reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
        descricao  VARCHAR(200) NOT NULL,
        valor      NUMERIC(10,2) NOT NULL DEFAULT 0,
        data       DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS limpeza (
        id           SERIAL PRIMARY KEY,
        reserva_id   INTEGER REFERENCES reservas(id) ON DELETE SET NULL,
        imovel_id    INTEGER NOT NULL REFERENCES imoveis(id),
        prestador_id INTEGER REFERENCES pessoas(id),
        data         DATE NOT NULL,
        valor        NUMERIC(10,2) NOT NULL DEFAULT 0,
        status       VARCHAR(20) NOT NULL DEFAULT 'Aberto',
        obs          TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_log (
        id           SERIAL PRIMARY KEY,
        reserva_id   INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
        destinatario VARCHAR(150) NOT NULL,
        assunto      VARCHAR(255) NOT NULL,
        enviado_por  INTEGER NOT NULL REFERENCES usuarios(id),
        enviado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_reservas_imovel    ON reservas(imovel_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reservas_locatario ON reservas(locatario_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reservas_status    ON reservas(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_pessoas_tipo       ON pessoas(tipo);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_limpeza_imovel     ON limpeza(imovel_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_limpeza_reserva    ON limpeza(reserva_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_email_log_reserva  ON email_log(reserva_id);`);

    await client.query('COMMIT');
    console.log('[MIGRATE] ✅ Tabelas criadas com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[MIGRATE] ❌ Erro:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();