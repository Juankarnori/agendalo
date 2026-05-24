import { format, addMinutes, parse, isAfter, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatFecha(fecha: string) {
  return format(parse(fecha, 'yyyy-MM-dd', new Date()), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
}

export function formatHora(hora: string) {
  return hora.slice(0, 5)
}

export function generarSlots(
  horaInicio: string,
  horaFin: string,
  intervaloMin: number,
  duracionServicio: number
): string[] {
  const slots: string[] = []
  const base = new Date()
  let current = parse(horaInicio, 'HH:mm:ss', base)
  const fin = parse(horaFin, 'HH:mm:ss', base)
  const finConDuracion = addMinutes(fin, -duracionServicio + intervaloMin)

  while (!isAfter(current, finConDuracion)) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, intervaloMin)
  }
  return slots
}

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
