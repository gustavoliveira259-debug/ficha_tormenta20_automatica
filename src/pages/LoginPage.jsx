import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) await register(email, password)
      else await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f0f0f'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 12,
        padding: '2rem',
        width: 360
      }}>
        <h1 style={{ color: '#e8c97a', margin: '0 0 4px', fontSize: 24 }}>
          ⚔️ Tormenta 20
        </h1>
        <p style={{ color: '#888', margin: '0 0 24px', fontSize: 14 }}>
          {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 4 }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#111',
                border: '1px solid #444',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#fff',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 4 }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#111',
                border: '1px solid #444',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#fff',
                fontSize: 14,
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#e05555', fontSize: 13, margin: '0 0 12px' }}>
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#a08840' : '#e8c97a',
              color: '#111',
              border: 'none',
              borderRadius: 8,
              padding: '11px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Aguarde...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <p style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
          {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <span
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{ color: '#e8c97a', cursor: 'pointer' }}
          >
            {isRegister ? 'Entrar' : 'Cadastrar'}
          </span>
        </p>
      </div>
    </div>
  )
}