'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { formatFecha, formatHora } from '@/lib/utils'
import { Calendar, LogOut, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import type { Reserva, EstadoReserva } from '@/types'

const ESTADOS: { value: EstadoReserva; label: string; color: string }[] = [
  { value: 'pendiente',  label: 'Pendiente',  color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  { value: 'completada', label: 'Completada', color: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  { value: 'cancelada',  label: 'Cancelada',  color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
]

export default function AdminPage() {
  const router = useRouter()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<EstadoReserva | 'todas'>('todas')
  const [fechaFiltro, setFechaFiltro] = useState(format(new Date(), 'yyyy-MM-dd'))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/admin/login')
      else cargarReservas()
    })
  }, [])

  async function cargarReservas() {
    setLoading(true)
    let query = supabase
      .from('reservas')
      .select('*, servicio:servicios(nombre)')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true })

    if (fechaFiltro) query = query.eq('fecha', fechaFiltro)
    if (filtro !== 'todas') query = query.eq('estado', filtro)

    const { data } = await query
    setReservas(data ?? [])
    setLoading(false)
  }

  useEffect(() => { cargarReservas() }, [filtro, fechaFiltro])

  async function cambiarEstado(id: string, estado: EstadoReserva) {
    await supabase.from('reservas').update({ estado }).eq('id', id)
    setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === 'pendiente').length,
    confirmadas: reservas.filter(r => r.estado === 'confirmada').length,
    completadas: reservas.filter(r => r.estado === 'completada').length,
  }

  return (
    <div className="min-h-screen bg-[#0f0f14]">
      {/* Header */}
      <header className="bg-[#13131a] border-b border-white/5 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-bold text-white">Panel Admin</h1>
              <p className="text-xs text-slate-500">Agendalo</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 transition">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
            { label: 'Confirmadas', value: stats.confirmadas, color: 'text-blue-400' },
            { label: 'Completadas', value: stats.completadas, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#13131a] rounded-2xl border border-white/5 p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            className="bg-[#13131a] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition"
          />
          <div className="flex gap-2 flex-wrap">
            {(['todas', ...ESTADOS.map(e => e.value)] as const).map(e => (
              <button key={e} onClick={() => setFiltro(e as EstadoReserva | 'todas')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition border-2 ${
                  filtro === e
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-white/5 bg-[#13131a] text-slate-500 hover:text-white'
                }`}>
                {e === 'todas' ? 'Todas' : ESTADOS.find(s => s.value === e)?.label}
              </button>
            ))}
          </div>
          <button onClick={cargarReservas} className="p-2 rounded-xl border-2 border-white/5 bg-[#13131a] hover:border-indigo-500/50 transition text-slate-500 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-16 text-slate-600">Cargando...</div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-16 text-slate-600">No hay reservas para este filtro</div>
        ) : (
          <div className="space-y-3">
            {reservas.map(r => {
              const estadoInfo = ESTADOS.find(e => e.value === r.estado)!
              return (
                <div key={r.id} className="bg-[#13131a] rounded-2xl border border-white/5 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                          {estadoInfo.label}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">{r.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-white">{r.cliente_nombre}</p>
                      <p className="text-sm text-slate-500">{r.cliente_email} {r.cliente_telefono && `· ${r.cliente_telefono}`}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1 capitalize"><Calendar className="w-3.5 h-3.5" />{formatFecha(r.fecha)}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatHora(r.hora)}</span>
                      </div>
                      {r.servicio && <p className="text-xs text-indigo-400 mt-1">{(r.servicio as { nombre: string }).nombre}</p>}
                      {r.notas && <p className="text-xs text-slate-600 mt-1 italic">"{r.notas}"</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {r.estado === 'pendiente' && (
                        <>
                          <button onClick={() => cambiarEstado(r.id, 'confirmada')}
                            className="flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-2 rounded-xl transition">
                            <CheckCircle className="w-3.5 h-3.5" /> Confirmar
                          </button>
                          <button onClick={() => cambiarEstado(r.id, 'cancelada')}
                            className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-3 py-2 rounded-xl transition">
                            <XCircle className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </>
                      )}
                      {r.estado === 'confirmada' && (
                        <button onClick={() => cambiarEstado(r.id, 'completada')}
                          className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-2 rounded-xl transition">
                          <CheckCircle className="w-3.5 h-3.5" /> Completada
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
