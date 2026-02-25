require('dotenv').config();
const pool   = require('./database');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('[SEED] Inserindo dados iniciais...');
    await client.query('BEGIN');

    // Admin
    const senhaHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, perfil)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Administrador', 'contato@morada.com.br', senhaHash, 'admin']);

    // ─── CADASTROS AUXILIARES ────────────────────────────────────────
    // Tipos de Imóveis
    const tipos = [
      {sigla:'AH', desc:'APART HOTEL'},
      {sigla:'AP', desc:'APARTAMENTO'},
      {sigla:'CA', desc:'CASA ALVENARIA'},
      {sigla:'CH', desc:'CHACARA'},
      {sigla:'CM', desc:'CASA MADEIRA'},
      {sigla:'CO', desc:'COBERTURA'},
      {sigla:'CX', desc:'CASA MISTA'},
      {sigla:'FA', desc:'FAZENDA'},
      {sigla:'GA', desc:'GALPAO'},
      {sigla:'GM', desc:'GARAGEM'},
    ];
    for (const t of tipos) {
      await client.query(
        `INSERT INTO imovel_tipos (sigla, descricao) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [t.sigla, t.desc]
      );
    }

    // Municípios
    const municipios = [
      {nome:'Balneário Camboriú', uf:'SC'},
      {nome:'Itapema', uf:'SC'},
      {nome:'Porto Belo', uf:'SC'},
      {nome:'Bombinhas', uf:'SC'},
      {nome:'Navegantes', uf:'SC'},
      {nome:'Florianópolis', uf:'SC'},
    ];
    for (const m of municipios) {
      await client.query(
        `INSERT INTO municipios (nome, uf) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [m.nome, m.uf]
      );
    }

    // Bancos (top 10 bancos brasileiros)
    const bancos = [
      {numero:'001', curto:'BBrasil',  razao:'Banco do Brasil'},
      {numero:'002', curto:'BACEN',    razao:'Banco Central do Brasil'},
      {numero:'003', curto:'BASA',     razao:'Banco da Amazônia'},
      {numero:'004', curto:'BNB',      razao:'Banco do Nordeste do Brasil'},
      {numero:'007', curto:'BNDES',    razao:'Banco Nacional Desenv.Economico Social'},
      {numero:'020', curto:'Produban', razao:'Banco do Estado de Alagoas'},
      {numero:'021', curto:'Banestes', razao:'Banco do Estado do Espírito Santo'},
      {numero:'022', curto:'BEMGE',    razao:'Banco de Crédito Real de Minas Gerais'},
      {numero:'023', curto:'BDMG',     razao:'Banco de Desenvolvimento de Minas Gerais'},
      {numero:'024', curto:'Bandepe',  razao:'Banco do Estado de Pernambuco'},
    ];
    for (const b of bancos) {
      await client.query(
        `INSERT INTO bancos (numero, nome_curto, razao_social) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [b.numero, b.curto, b.razao]
      );
    }

  
    // Pessoas
    const pessoas = [
      { nome:'Marcelo Fernando Kamchen',              tipo:'locatario', email:'representacao.mk@gmail.com' },
      { nome:'Marlowe Boeira de Melo Vieira da Silva', tipo:'locatario' },
      { nome:'Paulo Antonio Terleski',                tipo:'locatario' },
      { nome:'Sônia Balielo Bellini',                 tipo:'locatario' },
      { nome:'Joares Pedro Taufer',                   tipo:'locatario' },
      { nome:'Suzana Malvessi',                       tipo:'locatario' },
      { nome:'Lauro Neris De Oliveira',               tipo:'locatario' },
      { nome:'Claudinei Gamzava',                     tipo:'locatario' },
      { nome:'Michele Ibarros',                       tipo:'corretor'  },
    ];
    for (const p of pessoas) {
      await client.query(
        `INSERT INTO pessoas (nome, tipo, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [p.nome, p.tipo, p.email || null]
      );
    }

    await client.query('COMMIT');
    console.log('[SEED] ✅ Dados inseridos com sucesso!');
    console.log('');
    console.log('  👤 Login: contato@morada.com.br');
    console.log('  🔑 Senha: admin123');
    console.log('');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] ❌ Erro:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();