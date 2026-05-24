import Link from 'next/link'
import { Calendar, Clock, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data: config } = await supabase.from('configuracion').select('*').single()

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-indigo-50 to-slate-50">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          <Calendar className="w-4 h-4" />
          Reservas en línea
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 max-w-2xl leading-tight">
          Agenda tu cita en{' '}
          <span className="text-indigo-600">{config?.negocio_nombre ?? 'Agendalo'}</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-xl">
          Elige el servicio, la fecha y la hora que más te convenga. Rápido, fácil y sin llamadas.
        </p>
        <Link
          href="/reservar"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold px-8 py-4 rounded-2xl transition shadow-lg shadow-indigo-200"
        >
          Reservar ahora
        </Link>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Calendar, titulo: 'Elige fecha y hora', desc: 'Selecciona el día y el horario disponible que más te convenga.' },
              { icon: CheckCircle, titulo: 'Completa tus datos', desc: 'Ingresa tu nombre, email y teléfono. Solo toma un minuto.' },
              { icon: Mail, titulo: 'Recibe confirmación', desc: 'Te enviamos un email con todos los detalles de tu reserva.' },
            ].map(({ icon: Icon, titulo, desc }, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{titulo}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info de contacto */}
      {config && (
        <section className="py-10 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-500">
            {config.negocio_telefono && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{config.negocio_telefono}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>{config.negocio_email}</span>
            </div>
            {config.negocio_direccion && (
              <span>{config.negocio_direccion}</span>
            )}
          </div>
        </section>
      )}

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        © {new Date().getFullYear()} {config?.negocio_nombre ?? 'Agendalo'} · Powered by Agendalo
      </footer>
    </main>
  )
}
