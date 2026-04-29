import type { AppData, Vehicle, Intervention, Alert } from '../types'

const STORAGE_KEY = 'cars-health-data'

const defaultData: AppData = {
  vehicles: [],
  interventions: [],
  alerts: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    return { ...defaultData, ...JSON.parse(raw) }
  } catch {
    return defaultData
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getData(): AppData {
  return loadData()
}

export function saveVehicle(vehicle: Vehicle): void {
  const data = loadData()
  const idx = data.vehicles.findIndex(v => v.id === vehicle.id)
  if (idx >= 0) {
    data.vehicles[idx] = vehicle
  } else {
    data.vehicles.push(vehicle)
  }
  saveData(data)
}

export function deleteVehicle(id: string): void {
  const data = loadData()
  data.vehicles = data.vehicles.filter(v => v.id !== id)
  data.interventions = data.interventions.filter(i => i.vehicleId !== id)
  data.alerts = data.alerts.filter(a => a.vehicleId !== id)
  saveData(data)
}

export function saveIntervention(intervention: Intervention): void {
  const data = loadData()
  const idx = data.interventions.findIndex(i => i.id === intervention.id)
  if (idx >= 0) {
    data.interventions[idx] = intervention
  } else {
    data.interventions.push(intervention)
  }
  saveData(data)
}

export function deleteIntervention(id: string): void {
  const data = loadData()
  data.interventions = data.interventions.filter(i => i.id !== id)
  saveData(data)
}

export function saveAlert(alert: Alert): void {
  const data = loadData()
  const idx = data.alerts.findIndex(a => a.id === alert.id)
  if (idx >= 0) {
    data.alerts[idx] = alert
  } else {
    data.alerts.push(alert)
  }
  saveData(data)
}

export function deleteAlert(id: string): void {
  const data = loadData()
  data.alerts = data.alerts.filter(a => a.id !== id)
  saveData(data)
}
