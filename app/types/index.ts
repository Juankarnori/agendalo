export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada'

export interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  duracion: number        // minutos
  precio: number | null
  activo: boolean
  created_at: string
}

export interface HorarioDisponible {
  id: string
  dia_semana: number      // 0=domingo, 1=lunes, ... 6=sábado
  hora_inicio: string     // "HH:MM"
  hora_fin: string        // "HH:MM"
  activo: boolean
}

export interface Bloqueo {
  id: string
  fecha: string           // "YYYY-MM-DD"
  hora_inicio: string | null   // null = día completo bloqueado
  hora_fin: string | null
  motivo: string | null
}

export interface Reserva {
  id: string
  servicio_id: string
  servicio?: Servicio
  fecha: string           // "YYYY-MM-DD"
  hora: string            // "HH:MM"
  cliente_nombre: string
  cliente_email: string
  cliente_telefono: string | null
  estado: EstadoReserva
  notas: string | null
  created_at: string
}

export interface Configuracion {
  id: string
  negocio_nombre: string
  negocio_email: string
  negocio_telefono: string | null
  negocio_direccion: string | null
  intervalo_minutos: number   // cada cuántos minutos hay un slot (ej: 30)
  dias_anticipacion: number   // máximo días en el futuro para reservar
  mensaje_confirmacion: string | null
}
