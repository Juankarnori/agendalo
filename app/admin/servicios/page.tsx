'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, X, Check, Loader2, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Servicio } from '@/types'

const VACIO: Omit<Servicio, 'id' | 'created_at'> = {
  nombre: '',
  descripcion: '',
  duracion: 30,
  precio: null,
  activo: true,
}

export default function ServiciosPage() {
  const router = useRouter()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'nuevo' | 'editar' | null>(null)
  const [form, setForm] = useState(VACIO)
  const [editId, setEditId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/admin/login')
      else cargar()
    })
  }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('servicios').select('*').order('created_at', { ascending: true })
    setServicios(data ?? [])
    setLoading(false)
  }

  function abrirNuevo() {
    setForm(VACIO)
    setEditId(null)
    setError('')
    setModal('nuevo')
  }

  function abrirEditar(s: Servicio) {
    setForm({ nombre: s.nombre, descripcion: s.descripcion ?? '', duracion: s.duracion, precio: s.precio, activo: s.activo })
    setEditId(s.id)
    setError('')
    setModal('editar')
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (form.duracion < 5) { setError('La duración mínima es 5 minutos'); return }
    setGuardando(true)
    setError('')

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || null,
      duracion: form.duracion,
      precio: form.precio || null,
      activo: form.activo,
    }

    if (modal === 'nuevo') {
      const { error } = await supabase.from('servicios').insert(payload)
      if (error) { setError(error.message); setGuardando(false); return }
    } else {
      const { error } = await supabase.from('servicios').update(payload).eq('id', editId!)
      if (error) { setError(error.message); setGuardando(false); return }
    }

    setGuardando(false)
    setModal(null)
    cargar()
  }

  async function eliminar(id: string) {
    await supabase.from('servicios').delete().eq('id', id)
    setConfirmDelete(null)
    cargar()
  }

  async function toggleActivo(s: Servicio) {
    await supabase.from('servicios').update({ activo: !s.activo }).eq('id', s.id)
    setServicios(prev => prev.map(x => x.id === s.id ? { ...x, activo: !x.activo } : x))
  }

  return (
    <div className="min-h-screen bg-[#0f0f14]">
      {/* Header */}
      <header className="bg-[#13131a] border-b border-white/5 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-lg hover:bg-white/5 transition text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-white">Servicios</h1>
              <p className="text-xs text-slate-500">Gestión de servicios</p>
            </div>
          </div>
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
            <Plus className="w-4 h-4" /> Nuevo servicio
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16 text-slate-600">Cargando...</div>
        ) : servicios.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">No hay servicios creados</p>
            <button onClick={abrirNuevo} className="text-indigo-400 hover:underline text-sm">Crear el primero</button>
          </div>
        ) : (
          <div className="space-y-3">
            {servicios.map(s => (
              <div key={s.id} className={`bg-[#13131a] rounded-2xl border p-5 transition ${s.activo ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{s.nombre}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.activo ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {s.descripcion && <p className="text-sm text-slate-500 mb-2">{s.descripcion}</p>}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>⏱ {s.duracion} min</span>
                      {s.precio && <span className="text-indigo-400 font-semibold">${s.precio}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActivo(s)} title={s.activo ? 'Desactivar' : 'Activar'}
                      className="p-2 rounded-lg hover:bg-white/5 transition text-slate-500 hover:text-white">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => abrirEditar(s)}
                      className="p-2 rounded-lg hover:bg-white/5 transition text-slate-500 hover:text-indigo-400">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(s.id)}
                      className="p-2 rounded-lg hover:bg-white/5 transition text-slate-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">
                {modal === 'nuevo' ? 'Nuevo servicio' : 'Editar servicio'}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/5 transition text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Consulta estándar"
                  className="w-full bg-[#0f0f14] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
                <textarea value={form.descripcion ?? ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción breve del servicio"
                  rows={2}
                  className="w-full bg-[#0f0f14] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 outline-none transition resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Duración (min) *</label>
                  <input type="number" min={5} step={5} value={form.duracion}
                    onChange={e => setForm(f => ({ ...f, duracion: Number(e.target.value) }))}
                    className="w-full bg-[#0f0f14] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Precio (opcional)</label>
                  <input type="number" min={0} step={0.01} value={form.precio ?? ''}
                    onChange={e => setForm(f => ({ ...f, precio: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="0.00"
                    className="w-full bg-[#0f0f14] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 outline-none transition" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${form.activo ? 'bg-indigo-600' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-slate-300">Servicio activo (visible en la tienda)</span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)}
                  className="flex-1 border-2 border-white/5 hover:border-white/10 text-slate-400 font-semibold py-2.5 rounded-xl transition">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-bold text-white mb-2">¿Eliminar servicio?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer. Las reservas existentes no se verán afectadas.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 border-2 border-white/5 text-slate-400 font-semibold py-2.5 rounded-xl transition hover:border-white/10">
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmDelete)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
