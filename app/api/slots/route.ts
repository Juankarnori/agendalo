import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { generarSlots } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')       // "yyyy-MM-dd"
  const servicioId = searchParams.get('servicio')

  if (!fecha || !servicioId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const diaSemana = new Date(fecha + 'T12:00:00').getDay()

  const [{ data: horarios }, { data: servicio }, { data: config }, { data: reservas }, { data: bloqueos }] =
    await Promise.all([
      supabaseAdmin.from('horarios_disponibles').select('*').eq('dia_semana', diaSemana).eq('activo', true),
      supabaseAdmin.from('servicios').select('duracion').eq('id', servicioId).single(),
      supabaseAdmin.from('configuracion').select('intervalo_minutos').single(),
      supabaseAdmin.from('reservas').select('hora').eq('fecha', fecha).in('estado', ['pendiente', 'confirmada']),
      supabaseAdmin.from('bloqueos').select('*').eq('fecha', fecha),
    ])

  if (!horarios?.length || !servicio || !config) {
    return NextResponse.json({ slots: [] })
  }

  const ocupadas = new Set((reservas ?? []).map((r: { hora: string }) => r.hora.slice(0, 5)))
  const bloqueoDiaCompleto = (bloqueos ?? []).some((b: { hora_inicio: string | null }) => !b.hora_inicio)

  if (bloqueoDiaCompleto) return NextResponse.json({ slots: [] })

  const todosSlots: string[] = []
  for (const horario of horarios) {
    const slots = generarSlots(horario.hora_inicio, horario.hora_fin, config.intervalo_minutos, servicio.duracion)
    todosSlots.push(...slots)
  }

  const disponibles = todosSlots.filter(slot => !ocupadas.has(slot))
  return NextResponse.json({ slots: disponibles })
}
