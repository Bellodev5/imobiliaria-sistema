const express = require('express');
const pool    = require('./database');
const { authMiddleware } = require('./middleware');

const router = express.Router();
router.use(authMiddleware);

/* GET /api/pessoas?tipo=locatario|corretor|fiador */
router.get('/', async (req, res) => {
  const { search = '', tipo = '' } = req.query;
  try {
    const params = [];
    const wheres = []; // REMOVIDO O FILTRO AUTOMÁTICO DE ATIVOS
    
    if (tipo)   { params.push(tipo);          wheres.push(`tipo = $${params.length}`); }
    if (search) { params.push(`%${search}%`); wheres.push(`(nome ILIKE $${params.length} OR cpf_cnpj ILIKE $${params.length} OR email ILIKE $${params.length})`); }
    
    const whereClause = wheres.length > 0 ? `WHERE ${wheres.join(' AND ')}` : '';
    const r = await pool.query(`SELECT * FROM pessoas ${whereClause} ORDER BY nome`, params);
    return res.json(r.rows);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar pessoas.' });
  }
});

/* GET /api/pessoas/:id */
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pessoas WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Pessoa não encontrada.' });
    return res.json(r.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro.' });
  }
});

/* POST /api/pessoas */
/* POST /api/pessoas */
router.post('/', async (req, res) => {
  const {
    nome, cpf_cnpj, email, telefone, celular,
    endereco, numero, complemento, bairro, cidade, estado,
    tipo, ativo, obs,
    estado_civil, rg_ie, dni, profissao, tel_residencial,
    inscricao, contato, tel_contato,
    proprietario, locatario, corretor, prestador, fiador,
    banco_id, agencia, conta, nome_conta, chave_pix,
    aniversario, restricao, obs_restricoes
  } = req.body;

  try {
    // Defina a lista de colunas na ordem em que serão passadas
    const colunas = [
      'nome', 'cpf_cnpj', 'email', 'telefone', 'celular',
      'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
      'tipo', 'ativo', 'obs',
      'estado_civil', 'rg_ie', 'dni', 'profissao', 'tel_residencial',
      'inscricao', 'contato', 'tel_contato',
      'proprietario', 'locatario', 'corretor', 'prestador', 'fiador',
      'banco_id', 'agencia', 'conta', 'nome_conta', 'chave_pix',
      'aniversario', 'restricao', 'obs_restricoes'
    ];

    // Cria os placeholders ($1, $2, ...)
    const placeholders = colunas.map((_, i) => `$${i + 1}`).join(',');

    // Monta a query
    const query = `INSERT INTO pessoas (${colunas.join(',')}) VALUES (${placeholders}) RETURNING id`;

    // Valores na mesma ordem das colunas
    const values = [
      nome,
      cpf_cnpj || null,
      email || null,
      telefone || null,
      celular || null,
      endereco || null,
      numero || null,
      complemento || null,
      bairro || null,
      cidade || null,
      estado || null,
      tipo || 'locatario',
      ativo !== false,           // boolean
      obs || null,
      estado_civil || null,
      rg_ie || null,
      dni || null,
      profissao || null,
      tel_residencial || null,
      inscricao || null,
      contato || null,
      tel_contato || null,
      proprietario === true || proprietario === 'SIM',
      locatario === true || locatario === 'SIM',
      corretor === true || corretor === 'SIM',
      prestador === true || prestador === 'SIM',
      fiador === true || fiador === 'SIM',
      banco_id || null,
      agencia || null,
      conta || null,
      nome_conta || null,
      chave_pix || null,
      aniversario || null,
      restricao === true || restricao === 'SIM',
      obs_restricoes || null
    ];

    const r = await pool.query(query, values);
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('[PESSOAS] POST error:', err);
    return res.status(500).json({ message: 'Erro ao criar pessoa.' });
  }
});

/* PUT /api/pessoas/:id */
router.put('/:id', async (req, res) => {
  const {
    nome, cpf_cnpj, email, telefone, celular,
    endereco, numero, complemento, bairro, cidade, estado,
    tipo, ativo, obs,
    estado_civil, rg_ie, dni, profissao, tel_residencial,
    inscricao, contato, tel_contato,
    proprietario, locatario, corretor, prestador, fiador,
    banco_id, agencia, conta, nome_conta, chave_pix,
    aniversario, restricao, obs_restricoes
  } = req.body;

  try {
    // A mesma lista de colunas (sem as automáticas)
    const colunas = [
      'nome', 'cpf_cnpj', 'email', 'telefone', 'celular',
      'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
      'tipo', 'ativo', 'obs',
      'estado_civil', 'rg_ie', 'dni', 'profissao', 'tel_residencial',
      'inscricao', 'contato', 'tel_contato',
      'proprietario', 'locatario', 'corretor', 'prestador', 'fiador',
      'banco_id', 'agencia', 'conta', 'nome_conta', 'chave_pix',
      'aniversario', 'restricao', 'obs_restricoes'
    ];

    // Cria a parte SET da query: "coluna1 = $1, coluna2 = $2, ..."
    const setClause = colunas.map((col, i) => `${col} = $${i + 1}`).join(', ');

    // Adiciona o updated_at manualmente
    const query = `UPDATE pessoas SET ${setClause}, updated_at = NOW() WHERE id = $${colunas.length + 1}`;

    const values = [
      nome,
      cpf_cnpj || null,
      email || null,
      telefone || null,
      celular || null,
      endereco || null,
      numero || null,
      complemento || null,
      bairro || null,
      cidade || null,
      estado || null,
      tipo,
      ativo !== false,
      obs || null,
      estado_civil || null,
      rg_ie || null,
      dni || null,
      profissao || null,
      tel_residencial || null,
      inscricao || null,
      contato || null,
      tel_contato || null,
      proprietario === true || proprietario === 'SIM',
      locatario === true || locatario === 'SIM',
      corretor === true || corretor === 'SIM',
      prestador === true || prestador === 'SIM',
      fiador === true || fiador === 'SIM',
      banco_id || null,
      agencia || null,
      conta || null,
      nome_conta || null,
      chave_pix || null,
      aniversario || null,
      restricao === true || restricao === 'SIM',
      obs_restricoes || null,
      req.params.id   // último placeholder para o WHERE
    ];

    await pool.query(query, values);
    return res.json({ message: 'Pessoa atualizada.' });
  } catch (err) {
    console.error('[PESSOAS] PUT error:', err);
    return res.status(500).json({ message: 'Erro ao atualizar.' });
  }
});
/* DELETE /api/pessoas/:id */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE pessoas SET ativo=false WHERE id=$1', [req.params.id]);
    return res.json({ message: 'Pessoa desativada.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro.' });
  }
});

module.exports = router;