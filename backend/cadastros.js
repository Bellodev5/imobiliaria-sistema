const express = require('express');
const pool = require('./database');
const { authMiddleware } = require('./middleware');

/* ═══════════════════════════════════════════════════════════
   TIPOS DE IMÓVEIS
   ═══════════════════════════════════════════════════════════ */
const routerTipos = express.Router();
routerTipos.use(authMiddleware);

routerTipos.get('/', async (req, res) => {
  const { search = '' } = req.query;
  try {
    let query = 'SELECT * FROM imovel_tipos WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (sigla ILIKE $${params.length} OR descricao ILIKE $${params.length})`;
    }
    query += ' ORDER BY sigla';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar tipos de imóveis.' });
  }
});

routerTipos.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM imovel_tipos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tipo não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar tipo.' });
  }
});

routerTipos.post('/', async (req, res) => {
  const { sigla, descricao } = req.body;
  if (!sigla || !descricao) return res.status(400).json({ message: 'Sigla e descrição são obrigatórios.' });
  try {
    const result = await pool.query(
      'INSERT INTO imovel_tipos (sigla, descricao) VALUES ($1, $2) RETURNING id',
      [sigla.toUpperCase(), descricao]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Sigla já existe.' });
    return res.status(500).json({ message: 'Erro ao criar tipo.' });
  }
});

routerTipos.put('/:id', async (req, res) => {
  const { sigla, descricao } = req.body;
  try {
    const result = await pool.query(
      'UPDATE imovel_tipos SET sigla=$1, descricao=$2, updated_at=NOW() WHERE id=$3 RETURNING id',
      [sigla.toUpperCase(), descricao, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tipo não encontrado.' });
    return res.json({ message: 'Tipo atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar tipo.' });
  }
});

routerTipos.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM imovel_tipos WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tipo não encontrado.' });
    return res.json({ message: 'Tipo excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir tipo.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   MUNICÍPIOS/UF
   ═══════════════════════════════════════════════════════════ */
const routerMunicipios = express.Router();
routerMunicipios.use(authMiddleware);

routerMunicipios.get('/', async (req, res) => {
  const { search = '' } = req.query;
  try {
    let query = 'SELECT * FROM municipios WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (nome ILIKE $${params.length} OR uf ILIKE $${params.length})`;
    }
    query += ' ORDER BY nome';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar municípios.' });
  }
});

routerMunicipios.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM municipios WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Município não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar município.' });
  }
});

routerMunicipios.post('/', async (req, res) => {
  const { nome, uf } = req.body;
  if (!nome || !uf) return res.status(400).json({ message: 'Nome e UF são obrigatórios.' });
  try {
    const result = await pool.query(
      'INSERT INTO municipios (nome, uf) VALUES ($1, $2) RETURNING id',
      [nome, uf.toUpperCase()]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao criar município.' });
  }
});

routerMunicipios.put('/:id', async (req, res) => {
  const { nome, uf } = req.body;
  try {
    const result = await pool.query(
      'UPDATE municipios SET nome=$1, uf=$2, updated_at=NOW() WHERE id=$3 RETURNING id',
      [nome, uf.toUpperCase(), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Município não encontrado.' });
    return res.json({ message: 'Município atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar município.' });
  }
});

routerMunicipios.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM municipios WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Município não encontrado.' });
    return res.json({ message: 'Município excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir município.' });
  }
});

/* ═══════════════════════════════════════════════════════════
   BANCOS
   ═══════════════════════════════════════════════════════════ */
const routerBancos = express.Router();
routerBancos.use(authMiddleware);

routerBancos.get('/', async (req, res) => {
  const { search = '' } = req.query;
  try {
    let query = 'SELECT * FROM bancos WHERE 1=1';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (numero ILIKE $${params.length} OR nome_curto ILIKE $${params.length} OR razao_social ILIKE $${params.length})`;
    }
    query += ' ORDER BY numero';
    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar bancos.' });
  }
});

routerBancos.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bancos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Banco não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar banco.' });
  }
});

routerBancos.post('/', async (req, res) => {
  const { numero, nome_curto, razao_social } = req.body;
  if (!numero || !nome_curto) return res.status(400).json({ message: 'Número e nome curto são obrigatórios.' });
  try {
    const result = await pool.query(
      'INSERT INTO bancos (numero, nome_curto, razao_social) VALUES ($1, $2, $3) RETURNING id',
      [numero, nome_curto, razao_social || null]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Número do banco já existe.' });
    return res.status(500).json({ message: 'Erro ao criar banco.' });
  }
});

routerBancos.put('/:id', async (req, res) => {
  const { numero, nome_curto, razao_social } = req.body;
  try {
    const result = await pool.query(
      'UPDATE bancos SET numero=$1, nome_curto=$2, razao_social=$3, updated_at=NOW() WHERE id=$4 RETURNING id',
      [numero, nome_curto, razao_social, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Banco não encontrado.' });
    return res.json({ message: 'Banco atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar banco.' });
  }
});

routerBancos.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bancos WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Banco não encontrado.' });
    return res.json({ message: 'Banco excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir banco.' });
  }
});

module.exports = { routerTipos, routerMunicipios, routerBancos };