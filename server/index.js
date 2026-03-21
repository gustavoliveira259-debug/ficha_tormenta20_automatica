const express = require('express')
const Database = require('better-sqlite3')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const db = new Database('tormenta.db')
const SECRET = 'tormenta20-secret-local'

app.use(cors())
app.use(express.json())

// Cria as tabelas no banco se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

// Middleware — verifica o token em rotas protegidas
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sem token' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// Cadastro
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body
  const hash = await bcrypt.hash(password, 10)
  try {
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash)
    const token = jwt.sign({ id: result.lastInsertRowid, email }, SECRET)
    res.json({ token })
  } catch {
    res.status(400).json({ error: 'E-mail já cadastrado' })
  }
})

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Credenciais inválidas' })
  const token = jwt.sign({ id: user.id, email }, SECRET)
  res.json({ token })
})

// Listar personagens do usuário logado
app.get('/api/characters', auth, (req, res) => {
  const chars = db.prepare('SELECT * FROM characters WHERE user_id = ?').all(req.user.id)
  res.json(chars.map(c => ({ ...c, data: JSON.parse(c.data) })))
})

// Criar personagem
app.post('/api/characters', auth, (req, res) => {
  const { name, data } = req.body
  const result = db.prepare('INSERT INTO characters (user_id, name, data) VALUES (?, ?, ?)')
    .run(req.user.id, name, JSON.stringify(data))
  res.json({ id: result.lastInsertRowid, name, data })
})

// Atualizar personagem
app.put('/api/characters/:id', auth, (req, res) => {
  const { name, data } = req.body
  db.prepare('UPDATE characters SET name = ?, data = ? WHERE id = ? AND user_id = ?')
    .run(name, JSON.stringify(data), req.params.id, req.user.id)
  res.json({ ok: true })
})

// Deletar personagem
app.delete('/api/characters/:id', auth, (req, res) => {
  db.prepare('DELETE FROM characters WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// 0.0.0.0 permite acesso de outros dispositivos na rede local
app.listen(3001, '0.0.0.0', () => {
  console.log('✅ Servidor rodando em http://localhost:3001')
})