'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { format, addDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Loader2, Home } from 'lucide-react'
import Link from 'next/link'
import type { Servicio } from '@/types'

type Paso = 'servicio' | 'fecha' | 'hora' | 'datos' | 'enviando'

export default function ReservarPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>('servicio')
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [servicioSel, setServicioSel] = useState<Servicio | null>(null)
  const [fechaSel, setFechaSel] = useState<string>('')
  const [horaSel, setHoraSel] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', notas: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('servicios').select('*').eq('activo', true).then(({ data }) => {
      setServicios(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!fechaSel || !servicioSel) return
    setLoadingSlots(true)
    setHoraSel('')
    fetch(`/api/slots?fecha=${fechaSel}&servicio=${servicioSel.id}`)
      .then(r => r.json())
      .then(({ slots }) => setSlots(slots ?? []))
      .finally(() => setLoadingSlots(false))
  }, [fechaSel, servicioSel])

  const dias = Array.from({ length: 14 }, (_, i) => addDays(new Date(), semanaOffset * 7 + i + 1))

  function volver() {
    if (paso === 'fecha') setPaso('servicio')
    else if (paso === 'hora') setPaso('fecha')
    else if (paso === 'datos') setPaso('hora')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.email) { setError('Nombre y email son requeridos'); return }
    setError('')
    setPaso('enviando')

    const res = await fetch('/api/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        servicio_id: servicioSel!.id,
        fecha: fechaSel,
        hora: horaSel + ':00',
        cliente_nombre: form.nombre,
        cliente_email: form.email,
        cliente_telefono: form.telefono || null,
        notas: form.notas || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error); setPaso('datos'); return }
    router.push(`/confirmacion/${data.reserva.id}`)
  }

  return (
    <main className="min-h-screen bg-[#0f0f14]">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-white/5 transition text-slate-400 hover:text-white">
            <Home className="w-5 h-5" />
          </Link>
          {paso !== 'servicio' && paso !== 'enviando' && (
            <button onClick={volver} className="p-1.5 rounded-lg hover:bg-white/5 transition text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-bold text-white text-lg">Nueva reserva</h1>
        </div>
        {/* Barra de progreso */}
        <div className="max-w-2xl mx-auto mt-3 flex gap-1">
          {(['servicio', 'fecha', 'hora', 'datos'] as Paso[]).map((p, i) => (
            <div key={p} className={`h-1 flex-1 rounded-full transition-colors ${
              ['servicio','fecha','hora','datos','enviando'].indexOf(paso) >= i ? 'bg-indigo-500' : 'bg-white/10'
            }`} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* PASO 1: Servicio */}
        {paso === 'servicio' && (
          <div>
            <p className="text-slate-400 mb-6 flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> Selecciona un servicio</p>
            <div className="grid gap-3">
              {servicios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setServicioSel(s); setPaso('fecha') }}
                  className="w-full text-left bg-[#13131a] border-2 border-white/5 hover:border-indigo-500/50 rounded-2xl p-5 transition group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white group-hover:text-indigo-400 transition">{s.nombre}</p>
                      {s.descripcion && <p className="text-sm text-slate-500 mt-1">{s.descripcion}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s.duracion} min</p>
                      {s.precio && <p className="font-bold text-indigo-400">${s.precio}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: Fecha */}
        {paso === 'fecha' && (
          <div>
            <p className="text-slate-400 mb-2 flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> Selecciona una fecha</p>
            <p className="text-sm text-slate-600 mb-6">Servicio: <span className="text-indigo-400 font-medium">{servicioSel?.nombre}</span></p>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSemanaOffset(s => Math.max(0, s - 1))} disabled={semanaOffset === 0}
                className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 transition text-slate-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-slate-400 capitalize">
                {format(dias[0], "MMMM yyyy", { locale: es })}
              </span>
              <button onClick={() => setSemanaOffset(s => s + 1)}
                className="p-2 rounded-lg hover:bg-white/5 transition text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {dias.map(dia => {
                const str = format(dia, 'yyyy-MM-dd')
                const esDom = dia.getDay() === 0
                return (
                  <button
                    key={str}
                    disabled={esDom}
                    onClick={() => { setFechaSel(str); setPaso('hora') }}
                    className={`flex flex-col items-center py-3 rounded-xl text-sm font-medium transition
                      ${esDom ? 'opacity-20 cursor-not-allowed' : ''}
                      ${fechaSel === str
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#13131a] hover:bg-indigo-500/10 text-slate-300 border border-white/5 hover:border-indigo-500/30'}
                    `}
                  >
                    <span className="text-xs opacity-60 capitalize">{format(dia, 'EEE', { locale: es })}</span>
                    <span className="text-base font-bold">{format(dia, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* PASO 3: Hora */}
        {paso === 'hora' && (
          <div>
            <p className="text-slate-400 mb-2 flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /> Selecciona un horario</p>
            <p className="text-sm text-slate-600 mb-6 capitalize">
              {format(parseISO(fechaSel), "EEEE d 'de' MMMM", { locale: es })} · {servicioSel?.nombre}
            </p>
            {loadingSlots ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="font-medium">No hay horarios disponibles este día</p>
                <button onClick={() => setPaso('fecha')} className="mt-4 text-indigo-400 text-sm hover:underline">Elige otra fecha</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => { setHoraSel(slot); setPaso('datos') }}
                    className={`py-3 rounded-xl text-sm font-semibold transition border
                      ${horaSel === slot
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-[#13131a] text-slate-300 border-white/5 hover:border-indigo-500/40 hover:text-white'}
                    `}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 4: Datos */}
        {paso === 'datos' && (
          <div>
            <p className="text-slate-400 mb-2 flex items-center gap-2 text-sm"><User className="w-4 h-4" /> Tus datos</p>
            <p className="text-sm text-slate-600 mb-6 capitalize">
              {format(parseISO(fechaSel), "EEEE d 'de' MMMM", { locale: es })} · {horaSel} · {servicioSel?.nombre}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo *</label>
                <input type="text" required value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Juan Pérez"
                  className="w-full bg-[#13131a] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full bg-[#13131a] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Teléfono</label>
                <input type="tel" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="+593 99 000 0000"
                  className="w-full bg-[#13131a] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Notas (opcional)</label>
                <textarea value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Cualquier información adicional..."
                  rows={3}
                  className="w-full bg-[#13131a] border-2 border-white/5 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition resize-none" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition mt-2">
                Confirmar reserva
              </button>
            </form>
          </div>
        )}

        {/* ENVIANDO */}
        {paso === 'enviando' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <p className="text-slate-400 font-medium">Confirmando tu reserva...</p>
          </div>
        )}
      </div>
    </main>
  )
}
