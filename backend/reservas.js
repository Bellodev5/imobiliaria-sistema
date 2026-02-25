const express = require('express');
const pool    = require('./database');
const { authMiddleware } = require('./middleware');

const router = express.Router();
router.use(authMiddleware);

const SELECT_RESERVA = `
  SELECT
    r.*,
    i.codigo         AS imovel_codigo,
    i.tipo           AS imovel_tipo,
    i.endereco       AS imovel_endereco,
    i.proprietario   AS imovel_proprietario,
    l.nome           AS locatario_nome,
    c.nome           AS corretor_nome,
    f.nome           AS fiador_nome,
    p.nome           AS prestador_nome
  FROM reservas r
  JOIN imoveis  i ON i.id = r.imovel_id
  JOIN pessoas  l ON l.id = r.locatario_id
  LEFT JOIN pessoas c ON c.id = r.corretor_id
  LEFT JOIN pessoas f ON f.id = r.fiador_id
  LEFT JOIN pessoas p ON p.id = r.prestador_id
`;

/* GET /api/reservas */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const wheres = [];

    if (status) { params.push(status); wheres.push(`r.status = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      wheres.push(`(l.nome ILIKE $${n} OR i.codigo ILIKE $${n} OR i.endereco ILIKE $${n} OR r.numero_contrato::text ILIKE $${n})`);
    }

    const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

    const countQ = await pool.query(
      `SELECT COUNT(*) FROM reservas r JOIN pessoas l ON l.id = r.locatario_id JOIN imoveis i ON i.id = r.imovel_id ${whereClause}`,
      params
    );
    const total = parseInt(countQ.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const dataQ = await pool.query(
      `${SELECT_RESERVA} ${whereClause} ORDER BY r.data_limite DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ data: dataQ.rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('[RESERVAS] GET:', err);
    return res.status(500).json({ message: 'Erro ao buscar reservas.' });
  }
});

/* GET /api/reservas/:id */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_RESERVA} WHERE r.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Reserva não encontrada.' });
    const despesas = await pool.query('SELECT * FROM reserva_despesas WHERE reserva_id = $1 ORDER BY data DESC', [req.params.id]);
    return res.json({ ...result.rows[0], despesas: despesas.rows });
  } catch (err) {
    console.error('[RESERVAS] GET by id:', err);
    return res.status(500).json({ message: 'Erro ao buscar reserva.' });
  }
});

/* POST /api/reservas */
router.post('/', async (req, res) => {
  const {
    imovel_id, locatario_id, corretor_id, fiador_id,
    data_entrada, data_saida, data_limite,
    num_diarias, valor_diaria, valor_total,
    adiantamento, perc_adiantamento, caucao,
    status, tipo_locacao, eh_proprietario,
    tipo_limpeza, taxa_limpeza, prestador_id, vlr_prestador,
    perc_comissao_prop, perc_comissao_corretor, perc_comissao_imob, perc_comissao_terceiros,
    vlr_comissao_prop, vlr_comissao_corretor, vlr_comissao_imob, vlr_comissao_terceiros,
    obs,
  } = req.body;

  try {
    const lastContract = await pool.query('SELECT MAX(numero_contrato) as max FROM reservas');
    const numero_contrato = (lastContract.rows[0].max || 9000) + 1;

    const result = await pool.query(`
      INSERT INTO reservas (
        numero_contrato, imovel_id, locatario_id, corretor_id, fiador_id,
        data_entrada, data_saida, data_limite,
        num_diarias, valor_diaria, valor_total,
        adiantamento, perc_adiantamento, caucao,
        status, tipo_locacao, eh_proprietario,
        tipo_limpeza, taxa_limpeza, prestador_id, vlr_prestador,
        perc_comissao_prop, perc_comissao_corretor, perc_comissao_imob, perc_comissao_terceiros,
        vlr_comissao_prop, vlr_comissao_corretor, vlr_comissao_imob, vlr_comissao_terceiros, obs
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) RETURNING id, numero_contrato
    `, [
      numero_contrato, imovel_id, locatario_id, corretor_id||null, fiador_id||null,
      data_entrada, data_saida, data_limite||null,
      num_diarias, valor_diaria, valor_total,
      adiantamento||0, perc_adiantamento||0, caucao||0,
      status||'EM ABERTO', tipo_locacao||'DIARIA', eh_proprietario||false,
      tipo_limpeza||'IMOBILIARIA', taxa_limpeza||0, prestador_id||null, vlr_prestador||0,
      perc_comissao_prop||0, perc_comissao_corretor||0, perc_comissao_imob||0, perc_comissao_terceiros||0,
      vlr_comissao_prop||0, vlr_comissao_corretor||0, vlr_comissao_imob||0, vlr_comissao_terceiros||0,
      obs||null,
    ]);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[RESERVAS] POST:', err);
    return res.status(500).json({ message: 'Erro ao criar reserva.' });
  }
});

/* PUT /api/reservas/:id */
router.put('/:id', async (req, res) => {
  const {
    imovel_id, locatario_id, corretor_id, fiador_id,
    data_entrada, data_saida, data_limite,
    num_diarias, valor_diaria, valor_total,
    adiantamento, perc_adiantamento, caucao,
    status, tipo_locacao, eh_proprietario,
    tipo_limpeza, taxa_limpeza, prestador_id, vlr_prestador,
    perc_comissao_prop, perc_comissao_corretor, perc_comissao_imob, perc_comissao_terceiros,
    vlr_comissao_prop, vlr_comissao_corretor, vlr_comissao_imob, vlr_comissao_terceiros,
    obs,
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE reservas SET
        imovel_id=$1, locatario_id=$2, corretor_id=$3, fiador_id=$4,
        data_entrada=$5, data_saida=$6, data_limite=$7,
        num_diarias=$8, valor_diaria=$9, valor_total=$10,
        adiantamento=$11, perc_adiantamento=$12, caucao=$13,
        status=$14, tipo_locacao=$15, eh_proprietario=$16,
        tipo_limpeza=$17, taxa_limpeza=$18, prestador_id=$19, vlr_prestador=$20,
        perc_comissao_prop=$21, perc_comissao_corretor=$22, perc_comissao_imob=$23, perc_comissao_terceiros=$24,
        vlr_comissao_prop=$25, vlr_comissao_corretor=$26, vlr_comissao_imob=$27, vlr_comissao_terceiros=$28,
        obs=$29, updated_at=NOW()
      WHERE id=$30 RETURNING id
    `, [
      imovel_id, locatario_id, corretor_id||null, fiador_id||null,
      data_entrada, data_saida, data_limite||null,
      num_diarias, valor_diaria, valor_total,
      adiantamento||0, perc_adiantamento||0, caucao||0,
      status, tipo_locacao, eh_proprietario||false,
      tipo_limpeza, taxa_limpeza||0, prestador_id||null, vlr_prestador||0,
      perc_comissao_prop||0, perc_comissao_corretor||0, perc_comissao_imob||0, perc_comissao_terceiros||0,
      vlr_comissao_prop||0, vlr_comissao_corretor||0, vlr_comissao_imob||0, vlr_comissao_terceiros||0,
      obs||null, req.params.id,
    ]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Reserva não encontrada.' });
    return res.json({ message: 'Reserva atualizada.', id: result.rows[0].id });
  } catch (err) {
    console.error('[RESERVAS] PUT:', err);
    return res.status(500).json({ message: 'Erro ao atualizar reserva.' });
  }
});

/* PATCH /api/reservas/:id/status */
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['EM ABERTO', 'CONFIRMADA', 'CANCELADA'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Status inválido.' });
  try {
    await pool.query('UPDATE reservas SET status=$1, updated_at=NOW() WHERE id=$2', [status, req.params.id]);
    return res.json({ message: 'Status atualizado.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao atualizar status.' });
  }
});

/* DELETE /api/reservas/:id */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservas WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Reserva não encontrada.' });
    return res.json({ message: 'Reserva excluída.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir.' });
  }
});

/* GET /api/reservas/conflito?imovel_id=&data_entrada=&data_saida=&excluir_id= */
router.get('/verificar/conflito', async (req, res) => {
  const { imovel_id, data_entrada, data_saida, excluir_id = 0 } = req.query;
  try {
    const result = await pool.query(`
      SELECT id, numero_contrato, data_entrada, data_saida, status
      FROM reservas
      WHERE imovel_id = $1 AND status != 'CANCELADA' AND id != $4
        AND (data_entrada, data_saida) OVERLAPS ($2::date, $3::date)
    `, [imovel_id, data_entrada, data_saida, excluir_id]);
    return res.json({ conflitos: result.rows });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao verificar conflito.' });
  }
});

module.exports = router;