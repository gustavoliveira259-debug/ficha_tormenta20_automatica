import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import FichaJogador from './pages/FichaJogador'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />
          {/* Rota para criar ficha nova */}
          <Route path="/ficha/nova" element={
            <PrivateRoute><FichaJogador /></PrivateRoute>
          } />
          {/* Rota para editar ficha existente pelo id */}
          <Route path="/ficha/:id" element={
            <PrivateRoute><FichaJogador /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}