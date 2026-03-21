import { createContext, useContext, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  async function login(email, password) {
    const res = await api.login(email, password)
    if (res.error) throw new Error(res.error)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify({ email }))
    setUser({ email })
  }

  async function register(email, password) {
    const res = await api.register(email, password)
    if (res.error) throw new Error(res.error)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify({ email }))
    setUser({ email })
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)