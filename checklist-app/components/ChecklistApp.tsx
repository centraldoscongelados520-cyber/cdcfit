'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'

const CATEGORIES: Record<Category, { label: string; emoji: string; color: string }> = {
  proteinas:        { label: 'Proteínas',       emoji: '🥩', color: '#4ade80' },
  graos:            { label: 'Grãos e Bases',    emoji: '🌾', color: '#f5a623' },
  hortifruti:       { label: 'Hortifruti',       emoji: '🥦', color: '#86efac' },
  laticinios:       { label: 'Laticínios',       emoji: '🧀', color: '#fde68a' },
  temperos:         { label: 'Temperos',         emoji: '🧂', color: '#c4b5fd' },
  industrializados: { label: 'Industrializados', emoji: '🥫', color: '#fb923c' },
  doces:            { label: 'Doces e Apoio',    emoji: '🍫', color: '#f9a8d4' },
  frutas:           { label: 'Frutas',           emoji: '🍊', color: '#fdba74' },
}

const ORDER = Object.keys(CATEGORIES) as Category[]

export default function ChecklistApp() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Category>('proteinas')
  const [newItem, setNewItem] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setItems(data)
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, payload.new as Item])
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as Item : i))
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const cat = CATEGORIES[activeTab]
  const filtered = items.filter(i => i.category === activeTab)
  const checkedCount = filtered.filter(i => i.checked).length
  const totalPending = items.filter(i => !i.checked).length

  async function addItem() {
    const name = newItem.trim()
    if (!name) return
    setAdding(true)
    await supabase.from('items').insert({ name, category: activeTab, checked: false })
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
          <h1 className="font-heading text-3xl font-extrabold text-white leading-tight">
            Compras
          </h1>
          {totalPending > 0 && (
            <span className="text-xs mb-1 px-2 py-1 rounded-lg" style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}>
              {totalPending} pendentes
            </span>
          )}
        </div>
      </div>

      {/* Category tabs — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: 'none' }}>
        {ORDER.map((key) => {
          const c = CATEGORIES[key]
          const count = items.filter(i => i.category === key && !i.checked).length
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: isActive ? c.color : 'var(--surface)',
                color: isActive ? '#000' : 'var(--text-muted)',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
              {count > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{
                    background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--surface2)',
                    color: isActive ? '#000' : 'var(--text)',
                  }}
                >
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
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(checkedCount / filtered.length) * 100}%`, background: cat.color }}
              />
            </div>
          </div>
        )}

        {/* Add item */}
        <div className="flex gap-2 mb-5">
          <input
            ref={inputRef}
            type="text"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder={`Adicionar em ${cat.label}...`}
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1.5px solid var(--border)' }}
          />
          <button
            onClick={addItem}
            disabled={adding || !newItem.trim()}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: cat.color, color: '#000' }}
          >
            +
          </button>
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
                <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item)} onDelete={() => deleteItem(item.id)} accentColor={cat.color} />
              ))}
              {filtered.filter(i => i.checked).map(item => (
                <ItemRow key={item.id} item={item} onToggle={() => toggleItem(item)} onDelete={() => deleteItem(item.id)} accentColor={cat.color} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, onToggle, onDelete, accentColor }: {
  item: Item
  onToggle: () => void
  onDelete: () => void
  accentColor: string
}) {
  return (
    <div
      className="item-enter flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ background: 'var(--surface)', opacity: item.checked ? 0.45 : 1 }}
    >
      <button
        onClick={onToggle}
        className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150"
        style={{
          borderColor: item.checked ? accentColor : 'var(--border)',
          background: item.checked ? accentColor : 'transparent',
        }}
      >
        {item.checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <span className="flex-1 text-sm" style={{
        textDecoration: item.checked ? 'line-through' : 'none',
        color: item.checked ? 'var(--text-muted)' : 'var(--text)',
      }}>
        {item.name}
      </span>

      <button
        onClick={onDelete}
        className="w-7 h-7 rounded-xl flex items-center justify-center opacity-25 active:opacity-100"
        style={{ color: 'var(--danger)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}
