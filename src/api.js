const BASE = 'http://localhost:3001/api'
const token = () => localStorage.getItem('token')

export const api = {
  register: (email, password) =>
    fetch(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  login: (email, password) =>
    fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  getCharacters: () =>
    fetch(`${BASE}/characters`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()),

  saveCharacter: (char) =>
    fetch(`${BASE}/characters${char.id ? '/' + char.id : ''}`, {
      method: char.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`
      },
      body: JSON.stringify(char)
    }).then(r => r.json()),

  deleteCharacter: (id) =>
    fetch(`${BASE}/characters/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()),
}