# Agendalo — Sistema de Reservas Online

> Plataforma de agendamiento para cualquier negocio de servicios.  
> Elimina las agendas en papel y los mensajes de WhatsApp.  
> **[Ver en vivo →](https://agendalo.vercel.app)**

---

## El problema que resuelve

Negocios como peluquerías, consultorios, canchas deportivas y estudios gestionan sus citas por WhatsApp o llamadas telefónicas. Esto genera:

- Doble reservas en el mismo horario
- Tiempo perdido en coordinación manual
- Clientes que no pueden reservar fuera del horario de atención

**Agendalo** permite que el cliente reserve solo, en cualquier momento, sin llamar a nadie. El negocio gestiona todo desde un panel admin limpio y en tiempo real.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | **Next.js 16** + TypeScript + Tailwind CSS 4 |
| Base de datos | **Supabase** (PostgreSQL + Auth + RLS) |
| Emails | **Resend** |
| Deploy | **Vercel** |

---

## Funcionalidades

### Página pública `/reservar`
- Flujo de 4 pasos: servicio → fecha → hora → datos personales
- Slots calculados dinámicamente según horarios y reservas existentes
- Confirmación por email automática al cliente y al negocio
- Página de confirmación con código de reserva único

### Panel de administración `/admin`
- Dashboard con stats: total, pendientes, confirmadas, completadas
- Filtros por fecha y estado
- Cambio de estado con un clic: pendiente → confirmada → completada
- CRUD completo de servicios (nombre, duración, precio, activo/inactivo)

---

## Lo más interesante técnicamente

El reto principal fue construir el **sistema de slots disponibles** — calcular en tiempo real qué horarios están libres para una fecha y servicio específico, descartando los ya reservados y los bloqueados.

```ts
// /api/slots — calcula disponibilidad en tiempo real
const [horarios, reservas, bloqueos] = await Promise.all([
  supabaseAdmin.from('horarios_disponibles').select('*').eq('dia_semana', diaSemana),
  supabaseAdmin.from('reservas').select('hora').eq('fecha', fecha).in('estado', ['pendiente', 'confirmada']),
  supabaseAdmin.from('bloqueos').select('*').eq('fecha', fecha),
])
```

El segundo reto fue la **concurrencia** — si dos personas intentan el mismo slot al mismo tiempo, solo una puede confirmarlo. Lo resolví verificando disponibilidad justo antes del INSERT y usando Row Level Security en Supabase para que el cliente solo pueda insertar, nunca leer reservas ajenas.

---

## Base de datos

```
servicios          → qué se puede reservar (nombre, duración, precio)
horarios_disponibles → días y horas de atención por día de semana
bloqueos           → fechas/horarios cerrados (feriados, vacaciones)
reservas           → citas confirmadas con estado y datos del cliente
configuracion      → nombre del negocio, intervalo de slots, días de anticipación
```

---

## Correr localmente

```bash
git clone https://github.com/Juankarnori/agendalo.git
cd agendalo
npm install
cp .env.example .env.local   # Completar con tus credenciales
npm run dev                  # http://localhost:3000
```

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

El schema completo de la base de datos está en [`supabase/schema.sql`](supabase/schema.sql).

---

*Desarrollado por [Juan Noriega](https://github.com/Juankarnori) · Ambato, Ecuador*
