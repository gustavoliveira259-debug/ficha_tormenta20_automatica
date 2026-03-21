import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

// Calcula o modificador de atributo conforme regra T20
// O valor na ficha é o bônus (-2 a 4), não o valor absoluto (8 a 18)
function mod(valor) {
  return Number(valor) || 0
}

// Formata o modificador com + ou -
function modStr(valor) {
  const m = mod(valor)
  return m > 0 ? `+${m}` : `${m}`
}

// Tabela oficial de custo por valor de atributo (T20)
// Valor -2 não tem custo (é penalidade), valor 0 é gratuito
const CUSTO_ATRIBUTO = {
  '-2':  0,   // sem custo (penalidade)
  '-1': -1,   // devolve 1 ponto
   '0':  0,   // gratuito, valor inicial
   '1':  1,
   '2':  2,
   '3':  4,
   '4':  7,
}

const PONTOS_TOTAIS = 10

// Retorna o custo de um valor específico
function custoAtributo(valor) {
  return CUSTO_ATRIBUTO[String(valor)] ?? 0
}

// Soma o custo de todos os 6 atributos
function pontosGastos(ficha) {
  return ['for', 'des', 'con', 'int', 'sab', 'car']
    .reduce((total, attr) => total + custoAtributo(ficha[attr] ?? 0), 0)
}

function pontosRestantes(ficha) {
  return PONTOS_TOTAIS - pontosGastos(ficha)
}

// Lista de perícias — jogador marca manualmente se é treinado
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

// Estado inicial da ficha para personagem novo
const fichaInicial = {
  nomePersonagem: '', jogador: '', raca: '', origem: '',
  classe: '', nivel: 1, divindade: '',
  // Atributos começam em 0 (valor neutro, sem custo)
  for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0,
  pvMaximo: 0, pvAtual: 0, pmMaximo: 0, pmAtual: 0,
  defesaOutros: 0,
  armaduraDefesa: 0, armaduraPenalidade: 0,
  escudoDefesa: 0,   escudoPenalidade: 0,
  ataques: [
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
    { nome: '', testeAtaque: '', dano: '', critico: '', tipo: '', alcance: '' },
  ],
  pericias: Object.fromEntries(PERICIAS.map(p => [p.nome, { treinado: false, outros: 0 }])),
  proficiencias: '',
  habilidades: '',
  equipamento: '',
  ts: '', to: '',
}

// Estilos reutilizáveis
const S = {
  input: {
    background: '#1a1a1a', border: '1px solid #3a3a3a',
    borderRadius: 4, color: '#fff', padding: '3px 6px',
    fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none',
  },
  inputCenter: {
    background: '#1a1a1a', border: '1px solid #3a3a3a',
    borderRadius: 4, color: '#fff', padding: '3px 6px',
    fontSize: 13, width: '100%', boxSizing: 'border-box',
    outline: 'none', textAlign: 'center',
  },
  label: {
    color: '#888', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: '0.05em', display: 'block', marginBottom: 2,
  },
  secao: {
    background: '#1a1a1a', border: '1px solid #8b1a1a',
    borderRadius: 6, padding: '10px 12px', marginBottom: 10,
  },
  secaoTitulo: {
    color: '#e8c97a', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600,
  },
  atributoBox: {
    background: '#111', border: '2px solid #8b1a1a',
    borderRadius: 8, textAlign: 'center', padding: '8px 4px', minWidth: 80,
    flex: 1,
  },
  btnAtributo: (ativo) => ({
    background: ativo ? '#2a2a1a' : '#1a1a1a',
    border: '1px solid #444',
    color: ativo ? '#e8c97a' : '#444',
    borderRadius: 4,
    width: 22, height: 22,
    fontSize: 16, lineHeight: 1,
    cursor: ativo ? 'pointer' : 'not-allowed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, flexShrink: 0,
  }),
}

export default function FichaJogador() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ficha, setFicha] = useState(fichaInicial)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  // Carrega personagem existente se tiver id na URL
  useEffect(() => {
    if (id) {
      api.getCharacters().then(chars => {
        const char = chars.find(c => c.id === Number(id))
        if (char) setFicha({ ...fichaInicial, ...char.data, nomePersonagem: char.name })
      })
    }
  }, [id])

  // Atualiza campo simples
  function set(campo, valor) {
    setFicha(f => ({ ...f, [campo]: valor }))
  }

  // Atualiza campo dentro de um ataque pelo índice
  function setAtaque(i, campo, valor) {
    setFicha(f => {
      const ataques = [...f.ataques]
      ataques[i] = { ...ataques[i], [campo]: valor }
      return { ...f, ataques }
    })
  }

  // Atualiza treinado ou outros de uma perícia
  function setPericia(nome, campo, valor) {
    setFicha(f => ({
      ...f,
      pericias: { ...f.pericias, [nome]: { ...f.pericias[nome], [campo]: valor } }
    }))
  }

  // Aumenta atributo em 1 ponto se possível
  function aumentarAtributo(attr) {
    const valor = ficha[attr] ?? 0
    if (valor >= 4) return
    const custoAtual = custoAtributo(valor)
    const custoProximo = custoAtributo(valor + 1)
    const custo = custoProximo - custoAtual
    if (pontosRestantes(ficha) >= custo) set(attr, valor + 1)
  }

  // Reduz atributo em 1 ponto se possível
  function reduzirAtributo(attr) {
    const valor = ficha[attr] ?? 0
    if (valor <= -2) return
    set(attr, valor - 1)
  }

  // Defesa = 10 + mod(Des) + armadura + escudo + outros
  function calcDefesa() {
    return 10 + mod(ficha.des) + Number(ficha.armaduraDefesa || 0) +
      Number(ficha.escudoDefesa || 0) + Number(ficha.defesaOutros || 0)
  }

  // Total de perícia = mod(atributo) + metade do nível se treinado + outros
  function calcPericia(p) {
    const attrMod = mod(ficha[p.atributo] ?? 0)
    const nivelBonus = ficha.pericias[p.nome]?.treinado
      ? Math.floor(Number(ficha.nivel || 1) / 2)
      : 0
    const outros = Number(ficha.pericias[p.nome]?.outros || 0)
    return attrMod + nivelBonus + outros
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

  return (
    <div style={{ background: '#0f0f0f', minHeight: '100vh', padding: '1rem', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── BARRA SUPERIOR ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'transparent', border: '1px solid #444', color: '#aaa',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13
            }}>← Voltar</button>
            <h1 style={{ color: '#e8c97a', margin: 0, fontSize: 20 }}>⚔️ Ficha do Personagem</h1>
          </div>
          <button onClick={salvar} disabled={salvando} style={{
            background: salvo ? '#2a6a2a' : '#e8c97a',
            color: salvo ? '#fff' : '#111',
            border: 'none', borderRadius: 8, padding: '8px 24px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer'
          }}>
            {salvo ? '✓ Salvo!' : salvando ? 'Salvando...' : 'Salvar Ficha'}
          </button>
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
            <div>
              <span style={S.label}>Raça</span>
              <input style={S.input} value={ficha.raca}
                onChange={e => set('raca', e.target.value)} placeholder="Humano..." />
            </div>
            <div>
              <span style={S.label}>Origem</span>
              <input style={S.input} value={ficha.origem}
                onChange={e => set('origem', e.target.value)} placeholder="Acólito..." />
            </div>
            <div>
              <span style={S.label}>Classe</span>
              <input style={S.input} value={ficha.classe}
                onChange={e => set('classe', e.target.value)} placeholder="Guerreiro..." />
            </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={S.secaoTitulo}>Atributos</div>
                {/* Contador de pontos — fica vermelho se negativo */}
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: restantes < 0 ? '#e05555' : restantes === 0 ? '#aaa' : '#e8c97a',
                  background: '#111',
                  border: `1px solid ${restantes < 0 ? '#8b1a1a' : '#3a3a2a'}`,
                  borderRadius: 6, padding: '3px 12px',
                }}>
                  {restantes} / {PONTOS_TOTAIS} pontos restantes
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {['for', 'des', 'con', 'int', 'sab', 'car'].map(attr => {
                  const valor = ficha[attr] ?? 0
                  const custoAtual = custoAtributo(valor)
                  const custoProximo = valor < 4 ? custoAtributo(valor + 1) - custoAtual : null
                  const podeAumentar = valor < 4 && restantes >= (custoProximo ?? 99)
                  const podeReduzir = valor > -2

                  return (
                    <div key={attr} style={{
                      ...S.atributoBox,
                      borderColor: valor < 0 ? '#6b0000' : '#8b1a1a',
                    }}>
                      {/* Nome do atributo */}
                      <div style={{ color: '#888', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>
                        {attr}
                      </div>

                      {/* Modificador em destaque */}
                      <div style={{
                        fontSize: 24, fontWeight: 700, lineHeight: 1, marginBottom: 6,
                        color: valor < 0 ? '#e05555' : valor === 0 ? '#888' : '#e8c97a',
                      }}>
                        {modStr(valor)}
                      </div>

                      {/* Botões − valor + */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <button onClick={() => reduzirAtributo(attr)} disabled={!podeReduzir}
                          style={S.btnAtributo(podeReduzir)}>−</button>

                        <span style={{ color: '#fff', fontSize: 15, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>
                          {valor}
                        </span>

                        <button onClick={() => aumentarAtributo(attr)} disabled={!podeAumentar}
                          style={S.btnAtributo(podeAumentar)}>+</button>
                      </div>

                      {/* Custo do valor atual */}
                      <div style={{ color: '#555', fontSize: 9, marginTop: 5 }}>
                        {custoAtual === 0 ? 'grátis' : custoAtual < 0
                          ? `${custoAtual} pto` : `${custoAtual} ptos`}
                      </div>

                      {/* Custo do próximo valor */}
                      {podeAumentar && (
                        <div style={{ color: '#3a5a2a', fontSize: 9 }}>
                          próx: +{custoProximo} pto{custoProximo !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Tabela de referência de custos */}
              <div style={{ marginTop: 12, borderTop: '1px solid #2a2a2a', paddingTop: 10 }}>
                <div style={{ color: '#555', fontSize: 9, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Tabela de custos
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Object.entries(CUSTO_ATRIBUTO).map(([val, custo]) => (
                    <div key={val} style={{
                      textAlign: 'center', flex: 1,
                      background: ficha['for'] !== undefined && Number(val) === (ficha['for'] ?? 0)
                        ? '#2a2a1a' : '#111',
                      border: '1px solid #2a2a2a', borderRadius: 4, padding: '4px 2px',
                    }}>
                      <div style={{ color: '#e8c97a', fontSize: 11, fontWeight: 600 }}>{val}</div>
                      <div style={{ color: '#555', fontSize: 9 }}>
                        {custo === 0 ? '—' : custo < 0 ? `${custo}` : `+${custo}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── PV e PM ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={S.secao}>
                <div style={S.secaoTitulo}>Pontos de Vida</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={S.label}>Máximos</span>
                    <input type="number" style={S.inputCenter} value={ficha.pvMaximo}
                      onChange={e => set('pvMaximo', e.target.value)} />
                  </div>
                  <div>
                    <span style={S.label}>Atuais</span>
                    <input type="number" style={S.inputCenter} value={ficha.pvAtual}
                      onChange={e => set('pvAtual', e.target.value)} />
                  </div>
                </div>
              </div>
              <div style={S.secao}>
                <div style={S.secaoTitulo}>Pontos de Mana</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={S.label}>Máximos</span>
                    <input type="number" style={S.inputCenter} value={ficha.pmMaximo}
                      onChange={e => set('pmMaximo', e.target.value)} />
                  </div>
                  <div>
                    <span style={S.label}>Atuais</span>
                    <input type="number" style={S.inputCenter} value={ficha.pmAtual}
                      onChange={e => set('pmAtual', e.target.value)} />
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
                      <th key={h} style={{ color: '#888', fontWeight: 400, textAlign: 'center', paddingBottom: 6, fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ficha.ataques.map((atq, i) => (
                    <tr key={i}>
                      {['nome', 'testeAtaque', 'dano', 'critico', 'tipo', 'alcance'].map(campo => (
                        <td key={campo} style={{ padding: '3px 4px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#e8c97a', fontSize: 28, fontWeight: 700 }}>{calcDefesa()}</div>
                    <div style={{ color: '#888', fontSize: 10 }}>Total</div>
                  </div>
                  <div style={{ color: '#555' }}>=</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#aaa', fontSize: 14 }}>10</div>
                    <div style={{ color: '#888', fontSize: 10 }}>Base</div>
                  </div>
                  <div style={{ color: '#555' }}>+</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#aaa', fontSize: 14 }}>{modStr(ficha.des)}</div>
                    <div style={{ color: '#888', fontSize: 10 }}>Mod. Des</div>
                  </div>
                  <div style={{ color: '#555' }}>+</div>
                  <div>
                    <span style={S.label}>Outros</span>
                    <input type="number" style={{ ...S.inputCenter, width: 50 }}
                      value={ficha.defesaOutros} onChange={e => set('defesaOutros', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={S.secaoTitulo}>Armadura & Escudo</div>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ color: '#888', fontWeight: 400, fontSize: 10 }}></th>
                        <th style={{ color: '#888', fontWeight: 400, fontSize: 10 }}>Defesa</th>
                        <th style={{ color: '#888', fontWeight: 400, fontSize: 10 }}>Penalidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ color: '#888', fontSize: 11, paddingRight: 6 }}>Armadura</td>
                        <td style={{ padding: '3px 4px' }}>
                          <input type="number" style={S.inputCenter} value={ficha.armaduraDefesa}
                            onChange={e => set('armaduraDefesa', e.target.value)} />
                        </td>
                        <td style={{ padding: '3px 4px' }}>
                          <input type="number" style={S.inputCenter} value={ficha.armaduraPenalidade}
                            onChange={e => set('armaduraPenalidade', e.target.value)} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: '#888', fontSize: 11, paddingRight: 6 }}>Escudo</td>
                        <td style={{ padding: '3px 4px' }}>
                          <input type="number" style={S.inputCenter} value={ficha.escudoDefesa}
                            onChange={e => set('escudoDefesa', e.target.value)} />
                        </td>
                        <td style={{ padding: '3px 4px' }}>
                          <input type="number" style={S.inputCenter} value={ficha.escudoPenalidade}
                            onChange={e => set('escudoPenalidade', e.target.value)} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={S.secao}>
                <div style={S.secaoTitulo}>Proficiências & Outras Características</div>
                <textarea
                  style={{ ...S.input, height: 160, resize: 'vertical' }}
                  value={ficha.proficiencias}
                  onChange={e => set('proficiencias', e.target.value)}
                  placeholder="Proficiências, idiomas, características especiais..."
                />
              </div>
            </div>

            {/* ── HABILIDADES E MAGIAS ── */}
            <div style={S.secao}>
              <div style={S.secaoTitulo}>Habilidades & Magias</div>
              <textarea
                style={{ ...S.input, height: 180, resize: 'vertical' }}
                value={ficha.habilidades}
                onChange={e => set('habilidades', e.target.value)}
                placeholder="Liste as habilidades, poderes e magias conhecidas..."
              />
            </div>

            {/* ── TS e TO ── */}
            <div style={S.secao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span style={S.label}>TS (Tendência / Sonho)</span>
                  <input style={S.input} value={ficha.ts} onChange={e => set('ts', e.target.value)} />
                </div>
                <div>
                  <span style={S.label}>TO (Tendência / Objetivo)</span>
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
                    <th style={{ color: '#888', fontWeight: 400, fontSize: 9, textAlign: 'left', paddingBottom: 4 }}>Perícia</th>
                    <th style={{ color: '#888', fontWeight: 400, fontSize: 9 }}>T</th>
                    <th style={{ color: '#888', fontWeight: 400, fontSize: 9 }}>Total</th>
                    <th style={{ color: '#888', fontWeight: 400, fontSize: 9 }}>Outros</th>
                  </tr>
                </thead>
                <tbody>
                  {PERICIAS.map(p => {
                    const total = calcPericia(p)
                    const treinado = ficha.pericias[p.nome]?.treinado || false
                    return (
                      <tr key={p.nome} style={{
                        borderBottom: '1px solid #222',
                        background: treinado ? '#1f1a0f' : 'transparent',
                      }}>
                        <td style={{
                          color: treinado ? '#e8c97a' : '#ccc',
                          padding: '3px 2px', fontSize: 10,
                          fontWeight: treinado ? 600 : 400,
                        }}>
                          {p.nome}
                        </td>
                        <td style={{ textAlign: 'center', padding: '2px' }}>
                          <input
                            type="radio"
                            checked={treinado}
                            onChange={() => setPericia(p.nome, 'treinado', !treinado)}
                            onClick={() => treinado && setPericia(p.nome, 'treinado', false)}
                            style={{ cursor: 'pointer', accentColor: '#e8c97a', width: 14, height: 14 }}
                          />
                        </td>
                        <td style={{
                          textAlign: 'center',
                          color: treinado ? '#e8c97a' : '#aaa',
                          fontWeight: treinado ? 700 : 400,
                          fontSize: 12,
                        }}>
                          {total >= 0 ? `+${total}` : total}
                        </td>
                        <td style={{ padding: '2px' }}>
                          <input
                            type="number"
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
              <textarea
                style={{ ...S.input, height: 200, resize: 'vertical', fontSize: 12 }}
                value={ficha.equipamento}
                onChange={e => set('equipamento', e.target.value)}
                placeholder="Liste os itens, armas e equipamentos..."
              />
            </div>

          </div>
        </div>

        {/* ── BOTÃO SALVAR INFERIOR ── */}
        <div style={{ textAlign: 'center', marginTop: 16, paddingBottom: 32 }}>
          <button onClick={salvar} disabled={salvando} style={{
            background: salvo ? '#2a6a2a' : '#e8c97a',
            color: salvo ? '#fff' : '#111',
            border: 'none', borderRadius: 8, padding: '12px 48px',
            fontSize: 16, fontWeight: 600, cursor: 'pointer'
          }}>
            {salvo ? '✓ Ficha Salva!' : salvando ? 'Salvando...' : 'Salvar Ficha'}
          </button>
        </div>

      </div>
    </div>
  )
}

