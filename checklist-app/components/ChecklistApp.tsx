'use client'
 
import { useEffect, useState, useRef } from 'react'
import { supabase, type Item, type Category, type Withdrawal } from '@/lib/supabase'
 
const CATEGORIES: Record<Category, { label: string; emoji: string; color: string }> = {
  proteinas:  { label: 'Proteínas',    emoji: '🥩', color: '#4ade80' },
  hortifruti: { label: 'Hortifruti',   emoji: '🥦', color: '#86efac' },
  laticinios: { label: 'Laticínios',   emoji: '🧀', color: '#fde68a' },
  seco:       { label: 'Estoque Seco', emoji: '📦', color: '#fbbf24' },
  massas:     { label: 'Massas',       emoji: '🍝', color: '#fdba74' },
  temperos:   { label: 'Temperos',     emoji: '🧂', color: '#c4b5fd' },
  doces:      { label: 'Doces',        emoji: '🍫', color: '#f9a8d4' },
  limpeza:    { label: 'Limpeza',      emoji: '🧹', color: '#67e8f9' },
}
 
const ORDER = Object.keys(CATEGORIES) as Category[]
 
export default function ChecklistApp() {
  const [items, setItems] = useState<Item[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Category>('proteinas')
  const [view, setView] = useState<'lista' | 'historico'>('lista')
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const [modal, setModal] = useState<Item | null>(null)
  const [modalType, setModalType] = useState<'entrada' | 'saida'>('saida')
  const [wQty, setWQty] = useState('')
  const [wPerson, setWPerson] = useState<'Thais' | 'Tawana' | ''>('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
 
  useEffect(() => {
    async function load() {
      const [{ data: itemsData }, { data: wData }] = await Promise.all([
        supabase.from('items').select('*').order('created_at', { ascending: true }),
        supabase.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(100),
      ])
      if (itemsData) setItems(itemsData)
      if (wData) setWithdrawals(wData)
      setLoading(false)
    }
    load()
 
    const ch1 = supabase.channel('items-ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') setItems(prev => [...prev, payload.new as Item])
        else if (payload.eventType === 'UPDATE') setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as Item : i))
        else if (payload.eventType === 'DELETE') setItems(prev => prev.filter(i => i.id !== payload.old.id))
      }).subscribe()
 
    const ch2 = supabase.channel('withdrawals-ch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'withdrawals' }, (payload) => {
        setWithdrawals(prev => [payload.new as Withdrawal, ...prev])
      }).subscribe()
 
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2) }
  }, [])
 
  const cat = CATEGORIES[activeTab]
  const filtered = items.filter(i => i.category === activeTab)
  const checkedCount = filtered.filter(i => i.checked).length
 
  function openModal(item: Item, type: 'entrada' | 'saida') {
    setModal(item)
    setModalType(type)
    setWQty('')
    setWPerson('')
    setModalError('')
  }
 
  async function addItem() {
    const name = newItem.trim()
    if (!name) return
    setAdding(true)
    await supabase.from('items').insert({ name, category: activeTab, checked: false, stock_quantity: 0 })
    setNewItem('')
    setAdding(false)
    inputRef.current?.focus()
  }
 
  async function toggleItem(item: Item) {
    await supabase.from('items').update({ checked: !item.checked }).eq('id', item.id)
  }
 
  async function deleteItem(id: string) {
    await supabase.from('items').delete().eq('id', id)
  }
 
  async function clearChecked() {
    const ids = filtered.filter(i => i.checked).map(i => i.id)
    if (!ids.length) return
    await supabase.from('items').delete().in('id', ids)
  }
 
  async function confirmMovement() {
    if (!modal) return
    setModalError('')
 
    const qty = parseInt(wQty)
    if (!qty || qty <= 0) {
      setModalError('Digite uma quantidade válida.')
      return
    }
    if (modalType === 'saida' && !wPerson) {
      setModalError('Selecione quem está retirando.')
      return
    }
 
    setSaving(true)
 
    try {
      if (modalType === 'entrada') {
        const newStock = (modal.stock_quantity || 0) + qty
 
        const { error: e1 } = await supabase
          .from('items')
          .update({ stock_quantity: newStock })
          .eq('id', modal.id)
 
        if (e1) throw new Error('Erro ao atualizar estoque: ' + e1.message)
 
        const { error: e2 } = await supabase.from('withdrawals').insert({
          item_id: modal.id,
          item_name: modal.name,
          category: modal.category,
          quantity: qty,
          person: 'Entrada',
          type: 'entrada',
        })
 
        if (e2) throw new Error('Erro ao registrar entrada: ' + e2.message)
 
      } else {
        const newStock = Math.max(0, (modal.stock_quantity || 0) - qty)
 
        const { error: e1 } = await supabase
          .from('items')
          .update({ stock_quantity: newStock })
          .eq('id', modal.id)
 
        if (e1) throw new Error('Erro ao atualizar estoque: ' + e1.message)
 
        const { error: e2 } = await supabase.from('withdrawals').insert({
          item_id: modal.id,
          item_name: modal.name,
          category: modal.category,
          quantity: qty,
          person: wPerson,
          type: 'saida',
        })
 
        if (e2) throw new Error('Erro ao registrar saída: ' + e2.message)
      }
 
      setSaving(false)
      setModal(null)
      setWQty('')
      setWPerson('')
      setModalError('')
 
    } catch (err: any) {
      setSaving(false)
      setModalError(err.message || 'Erro desconhecido. Tente novamente.')
    }
  }
 
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
               style={{ borderColor: '#4ade80', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        </div>
      </div>
    )
  }
 
  return (
    <div className="flex flex-col min-h-dvh pb-8">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          Lista compartilhada
        </p>
        <div className="flex items-end justify-between">
          <h1 className="font-heading text-3xl font-extrabold text-white leading-tight">Compras</h1>
          <div className="flex gap-2 mb-1">
            <button onClick={() => setView('lista')}
              className="text-xs px-3 py-1.5 rounded-xl transition-all"
              style={{ background: view === 'lista' ? '#fff' : 'var(--surface)', color: view === 'lista' ? '#000' : 'var(--text-muted)' }}>
              Lista
            </button>
            <button onClick={() => setView('historico')}
              className="text-xs px-3 py-1.5 rounded-xl transition-all"
              style={{ background: view === 'historico' ? '#fff' : 'var(--surface)', color: view === 'historico' ? '#000' : 'var(--text-muted)' }}>
              Histórico
            </button>
          </div>
        </div>
      </div>
 
      {view === 'historico' ? (
        <HistoricoView withdrawals={withdrawals} />
      ) : (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
            {ORDER.map((key) => {
              const c = CATEGORIES[key]
              const count = items.filter(i => i.category === key && !i.checked).length
              const isActive = activeTab === key
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{ background: isActive ? c.color : 'var(--surface)', color: isActive ? '#000' : 'var(--text-muted)', fontFamily: "'Syne', sans-serif" }}>
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                      style={{ background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--surface2)', color: isActive ? '#000' : 'var(--text)' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
 
          <div className="px-4 flex flex-col flex-1">
            {/* Progress */}
            {filtered.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span>{checkedCount} de {filtered.length} itens</span>
                  {checkedCount > 0 && (
                    <button onClick={clearChecked} className="underline underline-offset-2" style={{ color: 'var(--danger)' }}>
                      limpar marcados
                    </button>
                  )}
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(checkedCount / filtered.length) * 100}%`, background: cat.color }} />
                </div>
              </div>
            )}
 
            {/* Add item */}
            <div className="flex gap-2 mb-5">
              <input ref={inputRef} type="text" value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem()}
                placeholder={`Adicionar em ${cat.label}...`}
                className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border)' }} />
              <button onClick={addItem} disabled={adding || !newItem.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-95 disabled:opacity-40"
                style={{ background: cat.color, color: '#000' }}>+</button>
            </div>
 
            {/* List */}
            <div className="flex flex-col gap-2 flex-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-4xl mb-3">{cat.emoji}</div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Nenhum item em {cat.label}.<br />Adicione acima.
                  </p>
                </div>
              ) : (
                <>
                  {filtered.filter(i => !i.checked).map(item => (
                    <ItemRow key={item.id} item={item}
                      onToggle={() => toggleItem(item)}
                      onDelete={() => deleteItem(item.id)}
                      onEntrada={() => openModal(item, 'entrada')}
                      onSaida={() => openModal(item, 'saida')}
                      accentColor={cat.color} />
                  ))}
                  {filtered.filter(i => i.checked).map(item => (
                    <ItemRow key={item.id} item={item}
                      onToggle={() => toggleItem(item)}
                      onDelete={() => deleteItem(item.id)}
                      onEntrada={() => openModal(item, 'entrada')}
                      onSaida={() => openModal(item, 'saida')}
                      accentColor={cat.color} />
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
 
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="w-full rounded-t-3xl p-6" style={{ background: 'var(--surface)', maxWidth: 480, margin: '0 auto' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
 
            {/* Tipo entrada/saída */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => { setModalType('entrada'); setModalError('') }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={{ background: modalType === 'entrada' ? '#4ade80' : 'var(--surface2)', color: modalType === 'entrada' ? '#000' : 'var(--text-muted)', fontFamily: "'Syne', sans-serif" }}>
                ▲ Entrada
              </button>
              <button onClick={() => { setModalType('saida'); setModalError('') }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={{ background: modalType === 'saida' ? '#f87171' : 'var(--surface2)', color: modalType === 'saida' ? '#000' : 'var(--text-muted)', fontFamily: "'Syne', sans-serif" }}>
                ▼ Saída
              </button>
            </div>
 
            <h2 className="font-heading text-xl font-bold text-white mb-1">{modal.name}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Estoque atual: <span className="font-bold text-white">{modal.stock_quantity || 0}</span>
            </p>
 
            <label className="text-xs uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Quantidade
            </label>
            <input type="number" value={wQty} onChange={e => { setWQty(e.target.value); setModalError('') }}
              placeholder="0" min="1"
              className="w-full px-4 py-3 rounded-2xl text-xl font-bold text-center outline-none mb-4"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1.5px solid var(--border)' }} />
 
            {modalType === 'saida' && (
              <>
                <label className="text-xs uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>
                  Quem está retirando?
                </label>
                <div className="flex gap-3 mb-5">
                  {(['Thais', 'Tawana'] as const).map(p => (
                    <button key={p} onClick={() => { setWPerson(p); setModalError('') }}
                      className="flex-1 py-3 rounded-2xl font-heading font-bold text-sm transition-all"
                      style={{
                        background: wPerson === p ? '#4ade80' : 'var(--surface2)',
                        color: wPerson === p ? '#000' : 'var(--text)',
                        border: wPerson === p ? 'none' : '2px solid var(--border)',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
 
            {/* Mensagem de erro */}
            {modalError ? (
              <p className="text-sm text-center mb-3 px-2 py-2 rounded-xl"
                style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>
                {modalError}
              </p>
            ) : null}
 
            <button onClick={confirmMovement}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-heading font-bold text-black transition-all active:scale-95 disabled:opacity-60"
              style={{ background: modalType === 'entrada' ? '#4ade80' : '#f87171' }}>
              {saving ? 'Salvando...' : modalType === 'entrada' ? 'Confirmar entrada' : 'Confirmar saída'}
            </button>
            <button onClick={() => setModal(null)}
              className="w-full py-3 rounded-2xl mt-2 text-sm"
              style={{ color: 'var(--text-muted)' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
 
function ItemRow({ item, onToggle, onDelete, onEntrada, onSaida, accentColor }: {
  item: Item
  onToggle: () => void
  onDelete: () => void
  onEntrada: () => void
  onSaida: () => void
  accentColor: string
}) {
  return (
    <div className="item-enter flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ background: 'var(--surface)', opacity: item.checked ? 0.45 : 1 }}>
      <button onClick={onToggle}
        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
        style={{ borderColor: item.checked ? accentColor : 'var(--border)', background: item.checked ? accentColor : 'transparent' }}>
        {item.checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
 
      <span className="flex-1 text-sm" style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-muted)' : 'var(--text)' }}>
        {item.name}
      </span>
 
      <div className="flex items-center gap-1">
        <button onClick={onEntrada}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all active:scale-95"
          style={{ background: 'var(--surface2)', color: '#4ade80' }}>▲</button>
        <span className="text-xs font-bold px-2 py-1 rounded-lg min-w-[28px] text-center"
          style={{ background: 'var(--surface2)', color: (item.stock_quantity || 0) === 0 ? 'var(--danger)' : accentColor }}>
          {item.stock_quantity || 0}
        </span>
        <button onClick={onSaida}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all active:scale-95"
          style={{ background: 'var(--surface2)', color: '#f87171' }}>▼</button>
      </div>
 
      <button onClick={onDelete}
        className="w-7 h-7 rounded-xl flex items-center justify-center opacity-25 active:opacity-100"
        style={{ color: 'var(--danger)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
 
function HistoricoView({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const grouped = withdrawals.reduce((acc, w) => {
    const date = new Date(w.created_at).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[date]) acc[date] = []
    acc[date].push(w)
    return acc
  }, {} as Record<string, Withdrawal[]>)
 
  return (
    <div className="px-4 flex-1">
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma movimentação registrada ainda.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-6">
            <p className="text-xs uppercase tracking-widest mb-3 capitalize" style={{ color: 'var(--text-muted)' }}>{date}</p>
            <div className="flex flex-col gap-2">
              {items.map(w => {
                const isEntrada = (w as any).type === 'entrada' || (w.person as string) === 'Entrada'
                return (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'var(--surface)' }}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{w.item_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(w.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: isEntrada ? '#4ade80' : '#f87171' }}>
                        {isEntrada ? '+' : '-'}{w.quantity}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {isEntrada ? 'Entrada' : w.person}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
