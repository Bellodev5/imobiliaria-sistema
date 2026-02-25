const express = require('express');
const pool    = require('./database');
const { authMiddleware } = require('./middleware');

const router = express.Router();
router.use(authMiddleware);

/* GET /api/imoveis */
router.get('/', async (req, res) => {
  const { search = '', ativo = 'true' } = req.query;
  try {
    const params = [ativo === 'true'];
    let where = 'WHERE ativo = $1';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (codigo ILIKE $${params.length} OR endereco ILIKE $${params.length} OR proprietario ILIKE $${params.length})`;
    }
    const result = await pool.query(`SELECT * FROM imoveis ${where} ORDER BY codigo`, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('[IMOVEIS] GET error:', err);
    return res.status(500).json({ message: 'Erro ao buscar imóveis.' });
  }
});

/* GET /api/imoveis/:id */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM imoveis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Imóvel não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('[IMOVEIS] GET by id error:', err);
    return res.status(500).json({ message: 'Erro.' });
  }
});

/* POST /api/imoveis */
router.post('/', async (req, res) => {
  const {
    codigo,
    tipo,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    proprietario,
    cep,
    disponivel_venda,
    vlr_venda,
    disponivel_locacao,
    vlr_locacao,
    locado,
    reservado,
    vendido,
    perc_comissao_proprietario,
    perc_comissao_corretor,
    perc_comissao_imobiliaria,
    perc_comissao_terceiros,
    telefone,
    tipo_limpeza,
    taxa_limpeza,
    inventario,
    ativo,
    obs
  } = req.body;

  try {
    const r = await pool.query(
      `INSERT INTO imoveis (
        codigo, tipo, endereco, numero, complemento, bairro, cidade, estado, proprietario,
        cep, disponivel_venda, vlr_venda, disponivel_locacao, vlr_locacao,
        locado, reservado, vendido,
        perc_comissao_proprietario, perc_comissao_corretor, perc_comissao_imobiliaria, perc_comissao_terceiros,
        telefone, tipo_limpeza, taxa_limpeza, inventario,
        ativo, obs
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
      RETURNING id`,
      [
        codigo,
        tipo || 'AP',
        endereco,
        numero || null,
        complemento || null,
        bairro || null,
        cidade || null,
        estado || 'SC',
        proprietario || null,
        cep || null,
        disponivel_venda !== undefined ? disponivel_venda : false,
        vlr_venda || 0,
        disponivel_locacao !== undefined ? disponivel_locacao : false,
        vlr_locacao || 0,
        locado !== undefined ? locado : false,
        reservado !== undefined ? reservado : false,
        vendido !== undefined ? vendido : false,
        perc_comissao_proprietario || 0,
        perc_comissao_corretor || 0,
        perc_comissao_imobiliaria || 0,
        perc_comissao_terceiros || 0,
        telefone !== undefined ? telefone : false,
        tipo_limpeza || 'IMOBILIARIA',
        taxa_limpeza || 0,
        inventario || null,
        ativo !== false, // default true se não vier false
        obs || null
      ]
    );
    return res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Código do imóvel já existe.' });
    console.error('[IMOVEIS] POST error:', err);
    return res.status(500).json({ message: 'Erro ao criar imóvel.' });
  }
});

/* PUT /api/imoveis/:id */
router.put('/:id', async (req, res) => {
  const {
    codigo,
    tipo,
    endereco,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    proprietario,
    cep,
    disponivel_venda,
    vlr_venda,
    disponivel_locacao,
    vlr_locacao,
    locado,
    reservado,
    vendido,
    perc_comissao_proprietario,
    perc_comissao_corretor,
    perc_comissao_imobiliaria,
    perc_comissao_terceiros,
    telefone,
    tipo_limpeza,
    taxa_limpeza,
    inventario,
    ativo,
    obs
  } = req.body;

  try {
    await pool.query(
      `UPDATE imoveis SET
        codigo=$1, tipo=$2, endereco=$3, numero=$4, complemento=$5, bairro=$6, cidade=$7, estado=$8, proprietario=$9,
        cep=$10, disponivel_venda=$11, vlr_venda=$12, disponivel_locacao=$13, vlr_locacao=$14,
        locado=$15, reservado=$16, vendido=$17,
        perc_comissao_proprietario=$18, perc_comissao_corretor=$19, perc_comissao_imobiliaria=$20, perc_comissao_terceiros=$21,
        telefone=$22, tipo_limpeza=$23, taxa_limpeza=$24, inventario=$25,
        ativo=$26, obs=$27, updated_at=NOW()
      WHERE id=$28`,
      [
        codigo,
        tipo,
        endereco,
        numero || null,
        complemento || null,
        bairro || null,
        cidade || null,
        estado,
        proprietario || null,
        cep || null,
        disponivel_venda !== undefined ? disponivel_venda : false,
        vlr_venda || 0,
        disponivel_locacao !== undefined ? disponivel_locacao : false,
        vlr_locacao || 0,
        locado !== undefined ? locado : false,
        reservado !== undefined ? reservado : false,
        vendido !== undefined ? vendido : false,
        perc_comissao_proprietario || 0,
        perc_comissao_corretor || 0,
        perc_comissao_imobiliaria || 0,
        perc_comissao_terceiros || 0,
        telefone !== undefined ? telefone : false,
        tipo_limpeza || 'IMOBILIARIA',
        taxa_limpeza || 0,
        inventario || null,
        ativo !== false,
        obs || null,
        req.params.id
      ]
    );
    return res.json({ message: 'Imóvel atualizado.' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Código do imóvel já existe.' });
    console.error('[IMOVEIS] PUT error:', err);
    return res.status(500).json({ message: 'Erro ao atualizar.' });
  }
});

/* DELETE /api/imoveis/:id */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE imoveis SET ativo=false WHERE id=$1', [req.params.id]);
    return res.json({ message: 'Imóvel desativado.' });
  } catch (err) {
    console.error('[IMOVEIS] DELETE error:', err);
    return res.status(500).json({ message: 'Erro.' });
  }
});

module.exports = router;