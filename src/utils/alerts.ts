import { differenceInDays, parseISO } from 'date-fns'
import type { Alert, Vehicle } from '../types'

export interface AlertStatus {
  alert: Alert
  isDue: boolean
  isOverdue: boolean
  daysUntil?: number
  milesUntil?: number
  message: string
}

export function evaluateAlert(alert: Alert, vehicle: Vehicle): AlertStatus {
  if (!alert.isActive || alert.isDismissed) {
    return { alert, isDue: false, isOverdue: false, message: 'Alerte inactive' }
  }

  const today = new Date()
  let isDue = false
  let isOverdue = false
  let daysUntil: number | undefined
  let milesUntil: number | undefined
  const messages: string[] = []

  if (alert.triggerType === 'mileage' || alert.triggerType === 'both') {
    if (alert.triggerMileage !== undefined) {
      milesUntil = alert.triggerMileage - vehicle.mileage
      if (milesUntil <= 0) {
        isOverdue = true
        messages.push(`Dépassé de ${Math.abs(milesUntil).toLocaleString()} km`)
      } else if (milesUntil <= 500) {
        isDue = true
        messages.push(`Dans ${milesUntil.toLocaleString()} km`)
      }
    }
  }

  if (alert.triggerType === 'date' || alert.triggerType === 'both') {
    if (alert.triggerDate) {
      daysUntil = differenceInDays(parseISO(alert.triggerDate), today)
      if (daysUntil < 0) {
        isOverdue = true
        messages.push(`Dépassée de ${Math.abs(daysUntil)} jours`)
      } else if (daysUntil <= 30) {
        isDue = true
        messages.push(`Dans ${daysUntil} jours`)
      }
    }
  }

  const message = messages.join(' · ') || 'À jour'
  return { alert, isDue, isOverdue, daysUntil, milesUntil, message }
}

export function getAlertColor(status: AlertStatus): 'red' | 'amber' | 'green' {
  if (status.isOverdue) return 'red'
  if (status.isDue) return 'amber'
  return 'green'
}
