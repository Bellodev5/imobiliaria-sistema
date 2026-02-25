const express = require('express');
const pool    = require('./database');
const { authMiddleware } = require('./middleware');

const router = express.Router();
router.use(authMiddleware);

/* GET /api/limpeza - Lista todos os registros de limpeza ou filtra por imóvel */
router.get('/', async (req, res) => {
  const { imovel_id, reserva_id } = req.query;
  try {
    let query = `
      SELECT 
        l.*,
        i.codigo AS imovel_codigo,
        i.endereco AS imovel_endereco,
        r.numero_contrato,
        r.data_entrada,
        r.data_saida,
        loc.nome AS locatario_nome,
        p.nome AS prestador_nome
      FROM limpeza l
      LEFT JOIN reservas r ON r.id = l.reserva_id
      LEFT JOIN imoveis i ON i.id = l.imovel_id
      LEFT JOIN pessoas loc ON loc.id = r.locatario_id
      LEFT JOIN pessoas p ON p.id = l.prestador_id
      WHERE 1=1
    `;
    const params = [];

    if (imovel_id) {
      params.push(imovel_id);
      query += ` AND l.imovel_id = $${params.length}`;
    }
    if (reserva_id) {
      params.push(reserva_id);
      query += ` AND l.reserva_id = $${params.length}`;
    }

    query += ' ORDER BY l.data DESC, l.created_at DESC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error('[LIMPEZA] GET:', err);
    return res.status(500).json({ message: 'Erro ao buscar registros de limpeza.' });
  }
});

/* GET /api/limpeza/:id */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        i.codigo AS imovel_codigo,
        i.endereco AS imovel_endereco,
        r.numero_contrato,
        p.nome AS prestador_nome
      FROM limpeza l
      LEFT JOIN imoveis i ON i.id = l.imovel_id
      LEFT JOIN reservas r ON r.id = l.reserva_id
      LEFT JOIN pessoas p ON p.id = l.prestador_id
      WHERE l.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro de limpeza não encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar registro.' });
  }
});

/* POST /api/limpeza */
router.post('/', async (req, res) => {
  const { reserva_id, imovel_id, prestador_id, data, valor, status, obs } = req.body;

  if (!imovel_id || !data) {
    return res.status(400).json({ message: 'Imóvel e data são obrigatórios.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO limpeza (reserva_id, imovel_id, prestador_id, data, valor, status, obs)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      reserva_id || null,
      imovel_id,
      prestador_id || null,
      data,
      valor || 0,
      status || 'Aberto',
      obs || null
    ]);

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[LIMPEZA] POST:', err);
    return res.status(500).json({ message: 'Erro ao criar registro de limpeza.' });
  }
});

/* PUT /api/limpeza/:id */
router.put('/:id', async (req, res) => {
  const { reserva_id, imovel_id, prestador_id, data, valor, status, obs } = req.body;

  try {
    const result = await pool.query(`
      UPDATE limpeza 
      SET reserva_id=$1, imovel_id=$2, prestador_id=$3, data=$4, valor=$5, status=$6, obs=$7, updated_at=NOW()
      WHERE id=$8
      RETURNING id
    `, [
      reserva_id || null,
      imovel_id,
      prestador_id || null,
      data,
      valor || 0,
      status,
      obs || null,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro não encontrado.' });
    }
    return res.json({ message: 'Registro atualizado com sucesso.' });
  } catch (err) {
    console.error('[LIMPEZA] PUT:', err);
    return res.status(500).json({ message: 'Erro ao atualizar registro.' });
  }
});

/* DELETE /api/limpeza/:id */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM limpeza WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Registro não encontrado.' });
    }
    return res.json({ message: 'Registro excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao excluir registro.' });
  }
});

module.exports = router;