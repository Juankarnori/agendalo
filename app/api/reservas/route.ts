import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { formatFecha, formatHora } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { servicio_id, fecha, hora, cliente_nombre, cliente_email, cliente_telefono, notas } = body

  if (!servicio_id || !fecha || !hora || !cliente_nombre || !cliente_email) {
    return NextResponse.json({ error: 'Campos requeridos incompletos' }, { status: 400 })
  }

  // Verificar que el slot sigue disponible
  const { data: existente } = await supabaseAdmin
    .from('reservas')
    .select('id')
    .eq('fecha', fecha)
    .eq('hora', hora)
    .in('estado', ['pendiente', 'confirmada'])
    .single()

  if (existente) {
    return NextResponse.json({ error: 'Este horario ya no está disponible' }, { status: 409 })
  }

  const { data: reserva, error } = await supabaseAdmin
    .from('reservas')
    .insert({ servicio_id, fecha, hora, cliente_nombre, cliente_email, cliente_telefono, notas })
    .select('*, servicio:servicios(nombre)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: config } = await supabaseAdmin.from('configuracion').select('*').single()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  // Email al cliente
  await resend.emails.send({
    from: `${config?.negocio_nombre ?? 'Agendalo'} <onboarding@resend.dev>`,
    to: cliente_email,
    subject: '✅ Tu reserva está confirmada',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">¡Reserva confirmada!</h2>
        <p>Hola <strong>${cliente_nombre}</strong>, tu reserva ha sido recibida.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
          <p><strong>Servicio:</strong> ${reserva.servicio?.nombre}</p>
          <p><strong>Fecha:</strong> ${formatFecha(fecha)}</p>
          <p><strong>Hora:</strong> ${formatHora(hora)}</p>
        </div>
        <p>${config?.mensaje_confirmacion ?? ''}</p>
        <p style="color:#64748b;font-size:14px">Puedes ver tu reserva en: <a href="${siteUrl}/confirmacion/${reserva.id}">${siteUrl}/confirmacion/${reserva.id}</a></p>
      </div>
    `,
  })

  // Email al admin
  if (config?.negocio_email) {
    await resend.emails.send({
      from: `Agendalo <onboarding@resend.dev>`,
      to: config.negocio_email,
      subject: `📅 Nueva reserva — ${cliente_nombre}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#4f46e5">Nueva reserva recibida</h2>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:20px 0">
            <p><strong>Cliente:</strong> ${cliente_nombre}</p>
            <p><strong>Email:</strong> ${cliente_email}</p>
            <p><strong>Teléfono:</strong> ${cliente_telefono ?? '—'}</p>
            <p><strong>Servicio:</strong> ${reserva.servicio?.nombre}</p>
            <p><strong>Fecha:</strong> ${formatFecha(fecha)}</p>
            <p><strong>Hora:</strong> ${formatHora(hora)}</p>
            ${notas ? `<p><strong>Notas:</strong> ${notas}</p>` : ''}
          </div>
          <a href="${siteUrl}/admin" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Ver en panel admin</a>
        </div>
      `,
    })
  }

  return NextResponse.json({ reserva })
}

export async function PATCH(req: NextRequest) {
  const { id, estado } = await req.json()
  const { searchParams } = new URL(req.url)
  const adminKey = searchParams.get('key')

  if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('reservas')
    .update({ estado })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reserva: data })
}
