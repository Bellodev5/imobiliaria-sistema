const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('./database');
const { authMiddleware } = require('./middleware');

const router = express.Router();

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const user = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      usuario: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil }
    });
  } catch (err) {
    console.error('[AUTH] login error:', err);
    return res.status(500).json({ message: 'Erro interno. Tente novamente.' });
  }
});

/* GET /api/auth/me */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, perfil, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno.' });
  }
});

/* POST /api/auth/logout */
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({ message: 'Logout realizado.' });
});

module.exports = router;