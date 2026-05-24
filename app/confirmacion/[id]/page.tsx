import { supabaseAdmin } from '@/lib/supabase-server'
import { formatFecha, formatHora } from '@/lib/utils'
import { CheckCircle, Calendar, Clock, Mail } from 'lucide-react'
import Link from 'next/link'

export default async function ConfirmacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: reserva } = await supabaseAdmin
    .from('reservas')
    .select('*, servicio:servicios(nombre, duracion)')
    .eq('id', id)
    .single()

  if (!reserva) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[#0f0f14]">
        <div className="text-center">
          <p className="text-slate-500">Reserva no encontrada</p>
          <Link href="/" className="mt-4 inline-block text-indigo-400 hover:underline">Volver al inicio</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f0f14] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">¡Reserva confirmada!</h1>
          <p className="text-slate-400 mt-2">Revisa tu email — te enviamos los detalles.</p>
        </div>

        <div className="bg-[#13131a] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Servicio</p>
              <p className="font-semibold text-white">{reserva.servicio?.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Fecha y hora</p>
              <p className="font-semibold text-white capitalize">
                {formatFecha(reserva.fecha)} · {formatHora(reserva.hora)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Confirmación enviada a</p>
              <p className="font-semibold text-white">{reserva.cliente_email}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300 text-center">
          Código de reserva: <span className="font-mono font-bold">{id.slice(0, 8).toUpperCase()}</span>
        </div>

        <Link href="/" className="mt-6 block text-center text-slate-500 hover:text-indigo-400 transition text-sm">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}
