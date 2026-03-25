import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

// ── HELPERS ──────────────────────────────────────────────────────────────────

function mod(valor) {
  return Number(valor) || 0
}

function modStr(valor) {
  const m = mod(valor)
  return m > 0 ? `+${m}` : `${m}`
}

// ── TABELAS T20 ───────────────────────────────────────────────────────────────

const CUSTO_ATRIBUTO = {
  '-2':  0,
  '-1': -1,
   '0':  0,
   '1':  1,
   '2':  2,
   '3':  4,
   '4':  7,
}

const BONUS_PERICIA_NIVEL = {
   1: [2, 0],  2: [3, 1],  3: [3, 1],  4: [4, 2],
   5: [4, 2],  6: [5, 3],  7: [7, 3],  8: [8, 4],
   9: [8, 4], 10: [9, 5], 11: [9, 5], 12: [10, 6],
  13: [10, 6], 14: [11, 7], 15: [13, 7], 16: [14, 8],
  17: [14, 8], 18: [15, 9], 19: [15, 9], 20: [16, 10],
}

const PONTOS_TOTAIS = 10

const CORES_NEON = {
  amarelo:  '#e8c97a',
  roxo:     '#b44fe8',
  azul:     '#4a90d9',
  vermelho: '#e84a4a',
}

const PERICIAS = [
  { nome: 'Acrobacia',     atributo: 'des' },
  { nome: 'Adestramento',  atributo: 'car' },
  { nome: 'Atletismo',     atributo: 'for' },
  { nome: 'Atuação',       atributo: 'car' },
  { nome: 'Cavalgar',      atributo: 'des' },
  { nome: 'Conhecimento',  atributo: 'int' },
  { nome: 'Cura',          atributo: 'sab' },
  { nome: 'Diplomacia',    atributo: 'car' },
  { nome: 'Enganação',     atributo: 'car' },
  { nome: 'Fortitude',     atributo: 'con' },
  { nome: 'Furtividade',   atributo: 'des' },
  { nome: 'Guerra',        atributo: 'for' },
  { nome: 'Iniciativa',    atributo: 'des' },
  { nome: 'Intimidação',   atributo: 'car' },
  { nome: 'Intuição',      atributo: 'sab' },
  { nome: 'Investigação',  atributo: 'int' },
  { nome: 'Jogatina',      atributo: 'car' },
  { nome: 'Ladinagem',     atributo: 'des' },
  { nome: 'Luta',          atributo: 'for' },
  { nome: 'Misticismo',    atributo: 'int' },
  { nome: 'Nobreza',       atributo: 'int' },
  { nome: 'Ofício 1',      atributo: 'int' },
  { nome: 'Ofício 2',      atributo: 'int' },
  { nome: 'Percepção',     atributo: 'sab' },
  { nome: 'Pilotagem',     atributo: 'des' },
  { nome: 'Pontaria',      atributo: 'des' },
  { nome: 'Reflexos',      atributo: 'des' },
  { nome: 'Religião',      atributo: 'sab' },
  { nome: 'Sobrevivência', atributo: 'sab' },
  { nome: 'Vontade',       atributo: 'sab' },
]

const fichaInicial = {
  nomePersonagem: '', jogador: '', raca: '', origem: '',
  classe: '', nivel: 1, divindade: '',
  for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0,
  pvMaximo: 0, pvAtual: 0, pvTemp: 0,
  pmMaximo: 0, pmAtual: 0,
  defesaOutros: 0,
  armaduraDefesa: 0, armaduraPenalidade: 0,
  escudoDefesa: 0,   escudoPenalidade: 0,
  ataques: [
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
  ],
  pericias: Object.fromEntries(PERICIAS.map(p => [p.nome, { treinado: false, outros: 0 }])),
  proficiencias: '', habilidades: '', equipamento: '', ts: '', to: '',
}

// ── FUNÇÕES ───────────────────────────────────────────────────────────────────

function custoAtributo(valor) {
  return CUSTO_ATRIBUTO[String(valor)] ?? 0
}

function pontosGastos(ficha) {
  return ['for', 'des', 'con', 'int', 'sab', 'car']
    .reduce((total, attr) => total + custoAtributo(ficha[attr] ?? 0), 0)
}

function pontosRestantes(ficha) {
  return PONTOS_TOTAIS - pontosGastos(ficha)
}

function bonusPericiaNivel(nivel, treinado) {
  const n = Math.min(Math.max(Number(nivel) || 1, 1), 20)
  const [t, nt] = BONUS_PERICIA_NIVEL[n]
  return treinado ? t : nt
}

// ── ESTILOS DINÂMICOS ─────────────────────────────────────────────────────────

function makeStyles(neon) {
  return {
    page: {
      background: '#0a0a0a',
      minHeight: '100vh',
      padding: '1rem',
      color: '#e0e0e0',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    },
    topbar: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 20, background: '#111',
      border: `1px solid ${neon}44`, borderRadius: 12,
      padding: '12px 20px',
      boxShadow: `0 0 20px ${neon}22`,
    },
    titulo: {
      color: neon, margin: 0, fontSize: 20, fontWeight: 700,
      textShadow: `0 0 12px ${neon}99`, letterSpacing: '0.05em',
    },
    btnVoltar: {
      background: 'transparent', border: `1px solid ${neon}66`,
      color: neon, borderRadius: 8, padding: '6px 14px',
      cursor: 'pointer', fontSize: 13,
      boxShadow: `0 0 8px ${neon}33`, transition: 'all 0.2s',
    },
    btnSalvar: (salvo) => ({
      background: salvo ? '#1a3a1a' : `${neon}22`,
      color: salvo ? '#5ac05a' : neon,
      border: `1px solid ${salvo ? '#3a8a3a' : neon + '88'}`,
      borderRadius: 8, padding: '7px 20px',
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
      boxShadow: `0 0 10px ${neon}33`,
      letterSpacing: '0.05em', transition: 'all 0.2s',
    }),
    secao: {
      background: '#111',
      border: `1px solid ${neon}44`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 10,
      boxShadow: `0 0 10px ${neon}18, inset 0 0 6px ${neon}08`,
    },
    secaoTitulo: {
      color: neon, fontSize: 10, textTransform: 'uppercase',
      letterSpacing: '0.15em', marginBottom: 10, fontWeight: 700,
      textShadow: `0 0 8px ${neon}88`,
    },
    label: {
      color: '#666', fontSize: 10, textTransform: 'uppercase',
      letterSpacing: '0.08em', display: 'block', marginBottom: 3,
    },
    input: {
      background: '#0d0d0d', border: `1px solid #2a2a2a`,
      borderRadius: 6, color: '#e0e0e0', padding: '6px 10px',
      fontSize: 13, width: '100%', boxSizing: 'border-box',
      outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    inputCenter: {
      background: '#0d0d0d', border: `1px solid #2a2a2a`,
      borderRadius: 6, color: '#e0e0e0', padding: '6px 10px',
      fontSize: 13, width: '100%', boxSizing: 'border-box',
      outline: 'none', textAlign: 'center',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    atributoBox: (negativo) => ({
      background: '#0d0d0d',
      border: `1px solid ${negativo ? '#6b000088' : neon + '55'}`,
      borderRadius: 10, textAlign: 'center', padding: '10px 4px', flex: 1,
      boxShadow: `0 0 10px ${negativo ? '#6b000044' : neon + '22'}`,
      transition: 'all 0.3s',
    }),
    btnAtributo: (ativo) => ({
      background: ativo ? `${neon}22` : '#1a1a1a',
      border: `1px solid ${ativo ? neon + '88' : '#333'}`,
      color: ativo ? neon : '#444',
      borderRadius: 5, width: 24, height: 24,
      fontSize: 16, lineHeight: 1, cursor: ativo ? 'pointer' : 'not-allowed',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 0, flexShrink: 0,
      boxShadow: ativo ? `0 0 6px ${neon}44` : 'none',
      transition: 'all 0.2s',
    }),
    btnCombate: (tipo) => {
      const cores = {
        dano:  { bg: '#3a1a1a', border: '#8b1a1a', color: '#e05555' },
        cura:  { bg: '#1a3a1a', border: '#3a8a3a', color: '#5ac05a' },
        full:  { bg: '#1a1a2a', border: '#3a3a8a', color: '#8888cc' },
        temp:  { bg: '#1a2a3a', border: '#2a4a6a', color: '#4a90d9' },
      }
      const c = cores[tipo]
      return {
        flex: 1, background: c.bg, border: `1px solid ${c.border}`,
        color: c.color, borderRadius: 6, padding: '5px',
        cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
      }
    },
  }
}

// ── COMPONENTE ────────────────────────────────────────────────────────────────

export default function FichaJogador() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ficha, setFicha]     = useState(fichaInicial)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo]     = useState(false)
  const [neon, setNeon]       = useState(() => localStorage.getItem('neonColor') || '#e8c97a')

  const S = makeStyles(neon)

  function mudarNeon(cor) {
    setNeon(cor)
    localStorage.setItem('neonColor', cor)
  }

  useEffect(() => {
    if (id) {
      api.getCharacters().then(chars => {
        const char = chars.find(c => c.id === Number(id))
        if (char) setFicha({ ...fichaInicial, ...char.data, nomePersonagem: char.name })
      })
    }
  }, [id])

  function set(campo, valor) {
    setFicha(f => ({ ...f, [campo]: valor }))
  }

  function setAtaque(i, campo, valor) {
    setFicha(f => {
      const ataques = [...f.ataques]
      ataques[i] = { ...ataques[i], [campo]: valor }
      return { ...f, ataques }
    })
  }

  function setPericia(nome, campo, valor) {
    setFicha(f => ({
      ...f,
      pericias: { ...f.pericias, [nome]: { ...f.pericias[nome], [campo]: valor } }
    }))
  }

  function aumentarAtributo(attr) {
    const valor = ficha[attr] ?? 0
    if (valor >= 4) return
    const custo = custoAtributo(valor + 1) - custoAtributo(valor)
    if (pontosRestantes(ficha) >= custo) set(attr, valor + 1)
  }

  function reduzirAtributo(attr) {
    const valor = ficha[attr] ?? 0
    if (valor <= -2) return
    set(attr, valor - 1)
  }

  function calcDefesa() {
    return 10 + mod(ficha.des) + Number(ficha.armaduraDefesa || 0) +
      Number(ficha.escudoDefesa || 0) + Number(ficha.defesaOutros || 0)
  }

  function calcPericia(p) {
    const treinado = ficha.pericias[p.nome]?.treinado || false
    return mod(ficha[p.atributo] ?? 0) +
      bonusPericiaNivel(ficha.nivel, treinado) +
      Number(ficha.pericias[p.nome]?.outros || 0)
  }

  async function salvar() {
    setSalvando(true)
    try {
      await api.saveCharacter({
        id: id ? Number(id) : undefined,
        name: ficha.nomePersonagem || 'Sem nome',
        data: ficha,
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
      if (!id) navigate('/dashboard')
    } finally {
      setSalvando(false)
    }
  }

  const restantes = pontosRestantes(ficha)

  // Valores de PV para a barra
  const pvMax   = Number(ficha.pvMaximo) || 0
  const pvAtual = Number(ficha.pvAtual)  || 0
  const pvTemp  = Number(ficha.pvTemp)   || 0
  const temTemp = pvTemp > 0
  const pctPV   = pvMax > 0 ? Math.min((pvAtual / pvMax) * 100, 100) : 0
  const pctTemp = pvMax > 0 ? Math.min((pvTemp  / pvMax) * 100, 100) : 0
  const corPV   = temTemp  ? '#4a90d9'
                : pctPV > 50 ? '#3a8a3a'
                : pctPV > 25 ? '#a07020'
                :              '#8b1a1a'

  // Valores de PM para a barra
  const pmMax   = Number(ficha.pmMaximo) || 0
  const pmAtual = Number(ficha.pmAtual)  || 0
  const pctPM   = pmMax > 0 ? Math.min((pmAtual / pmMax) * 100, 100) : 0

  return (
    <div style={S.page}>
      <style>{`
        input:focus, textarea:focus {
          border-color: ${neon}99 !important;
          box-shadow: 0 0 8px ${neon}44 !important;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }
        button:hover { filter: brightness(1.2); }
        tr:hover td { background: ${neon}0a !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: ${neon}66; border-radius: 3px; }
        ::selection { background: ${neon}44; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── TOPBAR ── */}
        <div style={S.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/dashboard')} style={S.btnVoltar}>
              ← Voltar
            </button>
            <h1 style={S.titulo}>⚔️ Tormenta 20</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Seletor de neon */}
            <span style={{ color: '#444', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Neon
            </span>
            {Object.entries(CORES_NEON).map(([nome, cor]) => (
              <button key={nome} onClick={() => mudarNeon(cor)} title={nome} style={{
                width: 22, height: 22, borderRadius: '50%',
                background: cor, padding: 0, cursor: 'pointer',
                border: neon === cor ? '2px solid #fff' : '2px solid transparent',
                boxShadow: neon === cor
                  ? `0 0 10px ${cor}, 0 0 20px ${cor}66`
                  : `0 0 6px ${cor}66`,
                transition: 'all 0.2s',
              }} />
            ))}

            <button onClick={salvar} disabled={salvando} style={S.btnSalvar(salvo)}>
              {salvo ? '✓ Salvo!' : salvando ? 'Salvando...' : 'Salvar Ficha'}
            </button>
          </div>
        </div>

        {/* ── CABEÇALHO ── */}
        <div style={S.secao}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <span style={S.label}>Personagem</span>
              <input style={S.input} value={ficha.nomePersonagem}
                onChange={e => set('nomePersonagem', e.target.value)} placeholder="Nome do personagem" />
            </div>
            <div>
              <span style={S.label}>Jogador</span>
              <input style={S.input} value={ficha.jogador}
                onChange={e => set('jogador', e.target.value)} placeholder="Nome do jogador" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 60px 1fr', gap: 10 }}>
            {[
              { campo: 'raca',      label: 'Raça',    placeholder: 'Humano...'   },
              { campo: 'origem',    label: 'Origem',   placeholder: 'Acólito...'  },
              { campo: 'classe',    label: 'Classe',   placeholder: 'Guerreiro...' },
            ].map(({ campo, label, placeholder }) => (
              <div key={campo}>
                <span style={S.label}>{label}</span>
                <input style={S.input} value={ficha[campo]}
                  onChange={e => set(campo, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <span style={S.label}>Nível</span>
              <input style={S.inputCenter} type="number" min="1" max="20"
                value={ficha.nivel} onChange={e => set('nivel', e.target.value)} />
            </div>
            <div>
              <span style={S.label}>Divindade</span>
              <input style={S.input} value={ficha.divindade}
                onChange={e => set('divindade', e.target.value)} placeholder="Nenhuma..." />
            </div>
          </div>
        </div>

        {/* ── LAYOUT PRINCIPAL ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 10 }}>

          {/* ══ COLUNA ESQUERDA ══ */}
          <div>

            {/* ── ATRIBUTOS ── */}
            <div style={S.secao}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={S.secaoTitulo}>Atributos</div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: restantes < 0 ? '#e05555' : restantes === 0 ? '#666' : neon,
                  background: '#0d0d0d',
                  border: `1px solid ${restantes < 0 ? '#8b1a1a' : neon + '44'}`,
                  borderRadius: 6, padding: '4px 14px',
                  boxShadow: `0 0 8px ${restantes < 0 ? '#e0555533' : neon + '33'}`,
                }}>
                  {restantes} / {PONTOS_TOTAIS} pontos
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {['for', 'des', 'con', 'int', 'sab', 'car'].map(attr => {
                  const valor = ficha[attr] ?? 0
                  const custoProximo = valor < 4 ? custoAtributo(valor + 1) - custoAtributo(valor) : null
                  const podeAumentar = valor < 4 && restantes >= (custoProximo ?? 99)
                  const podeReduzir  = valor > -2

                  return (
                    <div key={attr} style={S.atributoBox(valor < 0)}>
                      <div style={{ color: '#555', fontSize: 10, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.1em' }}>
                        {attr}
                      </div>
                      <div style={{
                        fontSize: 26, fontWeight: 700, lineHeight: 1, marginBottom: 8,
                        color: valor < 0 ? '#e05555' : valor === 0 ? '#555' : neon,
                        textShadow: valor !== 0 ? `0 0 10px ${valor < 0 ? '#e0555566' : neon + '66'}` : 'none',
                      }}>
                        {modStr(valor)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => reduzirAtributo(attr)} disabled={!podeReduzir}
                          style={S.btnAtributo(podeReduzir)}>−</button>
                        <span style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                          {valor}
                        </span>
                        <button onClick={() => aumentarAtributo(attr)} disabled={!podeAumentar}
                          style={S.btnAtributo(podeAumentar)}>+</button>
                      </div>
                      <div style={{ color: '#444', fontSize: 9, marginTop: 6 }}>
                        {custoAtributo(valor) === 0 ? 'grátis'
                          : custoAtributo(valor) < 0 ? `${custoAtributo(valor)} pto`
                          : `${custoAtributo(valor)} ptos`}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Tabela de custos */}
              <div style={{ marginTop: 12, borderTop: `1px solid ${neon}22`, paddingTop: 10 }}>
                <div style={{ color: '#444', fontSize: 9, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Tabela de custos
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Object.entries(CUSTO_ATRIBUTO).map(([val, custo]) => (
                    <div key={val} style={{
                      textAlign: 'center', flex: 1,
                      background: '#0d0d0d',
                      border: `1px solid ${neon}22`,
                      borderRadius: 6, padding: '4px 2px',
                    }}>
                      <div style={{ color: neon, fontSize: 11, fontWeight: 700 }}>{val}</div>
                      <div style={{ color: '#444', fontSize: 9 }}>
                        {custo === 0 ? '—' : custo < 0 ? `${custo}` : `+${custo}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PV e PM ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>

              {/* PONTOS DE VIDA */}
              <div style={S.secao}>
                <div style={S.secaoTitulo}>Pontos de Vida</div>

                {/* Número e barra */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: corPV, textShadow: `0 0 10px ${corPV}88` }}>
                      {pvAtual}
                      {temTemp && <span style={{ fontSize: 13, color: '#4a90d9', marginLeft: 6 }}>+{pvTemp} temp</span>}
                    </span>
                    <span style={{ color: '#444', fontSize: 13 }}>/ {pvMax}</span>
                  </div>

                  {/* Barra */}
                  <div style={{
                    background: '#0d0d0d', borderRadius: 8, height: 16,
                    border: `1px solid ${corPV}44`, overflow: 'hidden', position: 'relative',
                    boxShadow: `0 0 8px ${corPV}22`,
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${pctPV}%`, background: corPV, borderRadius: 8,
                      boxShadow: `0 0 8px ${corPV}`,
                      transition: 'width 0.4s ease, background 0.4s ease',
                    }} />
                    {temTemp && (
                      <div style={{
                        position: 'absolute', left: `${pctPV}%`, top: 0, bottom: 0,
                        width: `${Math.min(pctTemp, 100 - pctPV)}%`,
                        background: '#2a5a8a', borderRadius: '0 8px 8px 0',
                        transition: 'width 0.4s ease',
                      }} />
                    )}
                  </div>
                </div>

                {/* Botões rápidos */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button onClick={() => set('pvAtual', Math.max(0, pvAtual - 1))} style={S.btnCombate('dano')}>− 1</button>
                  <button onClick={() => set('pvAtual', Math.min(pvMax, pvAtual + 1))} style={S.btnCombate('cura')}>+ 1</button>
                  <button onClick={() => set('pvAtual', pvMax)} style={S.btnCombate('full')}>Full</button>
                </div>

                {/* Campos numéricos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <span style={S.label}>Máximos</span>
                    <input type="number" style={S.inputCenter} value={ficha.pvMaximo}
                      onChange={e => set('pvMaximo', e.target.value)} />
                  </div>
                  <div>
                    <span style={S.label}>Atuais</span>
                    <input type="number" style={S.inputCenter} value={ficha.pvAtual}
                      onChange={e => set('pvAtual', Math.max(0, Math.min(Number(e.target.value), pvMax)))} />
                  </div>
                </div>

                {/* PV Temporários */}
                <div style={{ borderTop: `1px solid ${neon}22`, paddingTop: 8 }}>
                  <span style={{ ...S.label, color: '#4a90d9' }}>⬡ PV Temporários</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => set('pvTemp', Math.max(0, pvTemp - 1))} style={{
                      ...S.btnCombate('temp'), flex: 'none', width: 30, padding: '5px 0',
                    }}>−</button>
                    <input type="number" min="0" value={ficha.pvTemp}
                      onChange={e => set('pvTemp', Math.max(0, Number(e.target.value)))}
                      style={{ ...S.inputCenter, color: '#4a90d9', border: '1px solid #2a4a6a' }} />
                    <button onClick={() => set('pvTemp', pvTemp + 1)} style={{
                      ...S.btnCombate('temp'), flex: 'none', width: 30, padding: '5px 0',
                    }}>+</button>
                  </div>
                </div>
              </div>

              {/* PONTOS DE MANA */}
              <div style={S.secao}>
                <div style={S.secaoTitulo}>Pontos de Mana</div>

                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#7a50c0', textShadow: '0 0 10px #7a50c088' }}>
                      {pmAtual}
                    </span>
                    <span style={{ color: '#444', fontSize: 13 }}>/ {pmMax}</span>
                  </div>

                  <div style={{
                    background: '#0d0d0d', borderRadius: 8, height: 16,
                    border: '1px solid #7a50c044', overflow: 'hidden',
                    boxShadow: '0 0 8px #7a50c022',
                  }}>
                    <div style={{
                      height: '100%', width: `${pctPM}%`,
                      background: '#7a50c0',
                      borderRadius: 8,
                      boxShadow: '0 0 8px #7a50c0',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <button onClick={() => set('pmAtual', Math.max(0, pmAtual - 1))} style={{
                    ...S.btnCombate('dano'), color: '#a070e0', border: '1px solid #5a3a8a', background: '#2a1a3a',
                  }}>− 1</button>
                  <button onClick={() => set('pmAtual', Math.min(pmMax, pmAtual + 1))} style={{
                    ...S.btnCombate('cura'), color: '#7a7ae0', border: '1px solid #3a3a8a', background: '#1a1a3a',
                  }}>+ 1</button>
                  <button onClick={() => set('pmAtual', pmMax)} style={S.btnCombate('full')}>Full</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={S.label}>Máximos</span>
                    <input type="number" style={S.inputCenter} value={ficha.pmMaximo}
                      onChange={e => set('pmMaximo', e.target.value)} />
                  </div>
                  <div>
                    <span style={S.label}>Atuais</span>
                    <input type="number" style={S.inputCenter} value={ficha.pmAtual}
                      onChange={e => set('pmAtual', Math.max(0, Math.min(Number(e.target.value), pmMax)))} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── ATAQUES ── */}
            <div style={S.secao}>
              <div style={S.secaoTitulo}>Ataques</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Nome', 'Teste de Ataque', 'Dano', 'Crítico', 'Tipo', 'Alcance'].map(h => (
                      <th key={h} style={{
                        color: '#555', fontWeight: 400, textAlign: 'center',
                        paddingBottom: 8, fontSize: 10, letterSpacing: '0.08em',
                        textTransform: 'uppercase', borderBottom: `1px solid ${neon}22`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ficha.ataques.map((atq, i) => (
                    <tr key={i}>
                      {['nome', 'testeAtaque', 'dano', 'critico', 'tipo', 'alcance'].map(campo => (
                        <td key={campo} style={{ padding: '4px' }}>
                          <input style={S.inputCenter} value={atq[campo]}
                            onChange={e => setAtaque(i, campo, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── DEFESA e PROFICIÊNCIAS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={S.secao}>
                <div style={S.secaoTitulo}>Defesa</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: neon, fontSize: 36, fontWeight: 700,
                      textShadow: `0 0 16px ${neon}99`,
                    }}>{calcDefesa()}</div>
                    <div style={{ color: '#444', fontSize: 10 }}>Total</div>
                  </div>
                  <div style={{ color: '#333', fontSize: 18 }}>=</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: 16 }}>10</div>
                    <div style={{ color: '#444', fontSize: 10 }}>Base</div>
                  </div>
                  <div style={{ color: '#333' }}>+</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#888', fontSize: 16 }}>{modStr(ficha.des)}</div>
                    <div style={{ color: '#444', fontSize: 10 }}>Mod Des</div>
                  </div>
                  <div style={{ color: '#333' }}>+</div>
                  <div>
                    <span style={S.label}>Outros</span>
                    <input type="number" style={{ ...S.inputCenter, width: 54 }}
                      value={ficha.defesaOutros} onChange={e => set('defesaOutros', e.target.value)} />
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${neon}22`, paddingTop: 10 }}>
                  <div style={S.secaoTitulo}>Armadura & Escudo</div>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ color: '#555', fontWeight: 400, fontSize: 10 }}></th>
                        <th style={{ color: '#555', fontWeight: 400, fontSize: 10 }}>Defesa</th>
                        <th style={{ color: '#555', fontWeight: 400, fontSize: 10 }}>Penalidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Armadura', def: 'armaduraDefesa', pen: 'armaduraPenalidade' },
                        { label: 'Escudo',   def: 'escudoDefesa',   pen: 'escudoPenalidade'   },
                      ].map(r => (
                        <tr key={r.label}>
                          <td style={{ color: '#555', fontSize: 11, paddingRight: 6 }}>{r.label}</td>
                          <td style={{ padding: '3px 4px' }}>
                            <input type="number" style={S.inputCenter} value={ficha[r.def]}
                              onChange={e => set(r.def, e.target.value)} />
                          </td>
                          <td style={{ padding: '3px 4px' }}>
                            <input type="number" style={S.inputCenter} value={ficha[r.pen]}
                              onChange={e => set(r.pen, e.target.value)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={S.secao}>
                <div style={S.secaoTitulo}>Proficiências & Características</div>
                <textarea style={{ ...S.input, height: 180, resize: 'vertical', lineHeight: 1.6 }}
                  value={ficha.proficiencias}
                  onChange={e => set('proficiencias', e.target.value)}
                  placeholder="Proficiências, idiomas, características especiais..." />
              </div>
            </div>

            {/* ── HABILIDADES E MAGIAS ── */}
            <div style={S.secao}>
              <div style={S.secaoTitulo}>Habilidades & Magias</div>
              <textarea style={{ ...S.input, height: 180, resize: 'vertical', lineHeight: 1.6 }}
                value={ficha.habilidades}
                onChange={e => set('habilidades', e.target.value)}
                placeholder="Liste as habilidades, poderes e magias conhecidas..." />
            </div>

            {/* ── TS e TO ── */}
            <div style={S.secao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={S.label}>TS — Tendência / Sonho</span>
                  <input style={S.input} value={ficha.ts} onChange={e => set('ts', e.target.value)} />
                </div>
                <div>
                  <span style={S.label}>TO — Tendência / Objetivo</span>
                  <input style={S.input} value={ficha.to} onChange={e => set('to', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ══ COLUNA DIREITA ══ */}
          <div>

            {/* ── PERÍCIAS ── */}
            <div style={{ ...S.secao, padding: '10px 8px' }}>
              <div style={S.secaoTitulo}>Perícias</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ color: '#555', fontWeight: 400, fontSize: 9, textAlign: 'left', paddingBottom: 4 }}>Perícia</th>
                    <th style={{ color: '#555', fontWeight: 400, fontSize: 9 }}>T</th>
                    <th style={{ color: '#555', fontWeight: 400, fontSize: 9 }}>Total</th>
                    <th style={{ color: '#555', fontWeight: 400, fontSize: 9 }}>+</th>
                  </tr>
                  <tr>
                    <td colSpan={4} style={{
                      color: '#444', fontSize: 9, paddingBottom: 6,
                      borderBottom: `1px solid ${neon}22`,
                    }}>
                      Nível {ficha.nivel}:&nbsp;
                      <span style={{ color: neon }}>+{bonusPericiaNivel(ficha.nivel, true)} treinado</span>
                      &nbsp;/&nbsp;
                      <span style={{ color: '#666' }}>+{bonusPericiaNivel(ficha.nivel, false)} não treinado</span>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {PERICIAS.map(p => {
                    const total    = calcPericia(p)
                    const treinado = ficha.pericias[p.nome]?.treinado || false
                    return (
                      <tr key={p.nome} style={{
                        borderBottom: `1px solid #1a1a1a`,
                        background: treinado ? `${neon}0a` : 'transparent',
                        transition: 'background 0.2s',
                      }}>
                        <td style={{
                          color: treinado ? neon : '#999',
                          padding: '4px 2px', fontSize: 10,
                          fontWeight: treinado ? 600 : 400,
                          textShadow: treinado ? `0 0 6px ${neon}66` : 'none',
                        }}>
                          {p.nome}
                        </td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>
                          <input type="radio" checked={treinado}
                            onChange={() => setPericia(p.nome, 'treinado', !treinado)}
                            onClick={() => treinado && setPericia(p.nome, 'treinado', false)}
                            style={{ cursor: 'pointer', accentColor: neon, width: 14, height: 14 }}
                          />
                        </td>
                        <td style={{
                          textAlign: 'center',
                          color: treinado ? neon : '#777',
                          fontWeight: treinado ? 700 : 400, fontSize: 12,
                          textShadow: treinado ? `0 0 6px ${neon}66` : 'none',
                        }}>
                          {total >= 0 ? `+${total}` : total}
                        </td>
                        <td style={{ padding: '2px' }}>
                          <input type="number"
                            value={ficha.pericias[p.nome]?.outros || 0}
                            onChange={e => setPericia(p.nome, 'outros', Number(e.target.value))}
                            style={{ ...S.inputCenter, width: 36, fontSize: 11, padding: '2px' }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── EQUIPAMENTO ── */}
            <div style={S.secao}>
              <div style={S.secaoTitulo}>Equipamento</div>
              <textarea style={{ ...S.input, height: 200, resize: 'vertical', fontSize: 12, lineHeight: 1.6 }}
                value={ficha.equipamento}
                onChange={e => set('equipamento', e.target.value)}
                placeholder="Liste os itens, armas e equipamentos..." />
            </div>

          </div>
        </div>

        {/* ── BOTÃO SALVAR INFERIOR ── */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 32 }}>
          <button onClick={salvar} disabled={salvando} style={{
            ...S.btnSalvar(salvo),
            padding: '12px 56px', fontSize: 15,
          }}>
            {salvo ? '✓ Ficha Salva!' : salvando ? 'Salvando...' : 'Salvar Ficha'}
          </button>
        </div>

      </div>
    </div>
  )
}