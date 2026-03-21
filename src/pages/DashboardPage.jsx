import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCharacters()
      .then(data => {
        if (Array.isArray(data)) setCharacters(data)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', padding: '2rem', color: '#fff' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#e8c97a', margin: 0, fontSize: 24 }}>⚔️ Meus Personagens</h1>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} style={{
            background: 'transparent', border: '1px solid #444',
            color: '#aaa', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontSize: 13
          }}>
            Sair
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#666' }}>Carregando...</p>
        ) : characters.length === 0 ? (
          <div style={{
            border: '1px dashed #333', borderRadius: 12,
            padding: '3rem', textAlign: 'center'
          }}>
            <p style={{ color: '#555', margin: '0 0 16px' }}>Nenhum personagem criado ainda.</p>
            {/* Botão leva para a página de ficha nova */}
            <button
              onClick={() => navigate('/ficha/nova')}
              style={{
                background: '#e8c97a', color: '#111', border: 'none',
                borderRadius: 8, padding: '10px 24px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              + Criar primeiro personagem
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Cada card abre a ficha do personagem */}
            {characters.map(char => (
              <div
                key={char.id}
                onClick={() => navigate(`/ficha/${char.id}`)}
                style={{
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 10, padding: '1rem 1.25rem',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer'
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: '#e8c97a' }}>
                    {char.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: '#666' }}>
                    {char.data?.raca} · {char.data?.classe} · Nv {char.data?.nivel ?? 1}
                  </p>
                </div>
                <span style={{
                  fontSize: 12, background: '#2a2a2a', color: '#888',
                  padding: '4px 10px', borderRadius: 20
                }}>
                  Ver ficha →
                </span>
              </div>
            ))}

            {/* Botão novo personagem no final da lista */}
            <button
              onClick={() => navigate('/ficha/nova')}
              style={{
                marginTop: 8, background: 'transparent',
                border: '1px dashed #444', color: '#666',
                borderRadius: 10, padding: '14px',
                fontSize: 14, cursor: 'pointer'
              }}
            >
              + Novo personagem
            </button>
          </div>
        )}
      </div>
    </div>
  )
}