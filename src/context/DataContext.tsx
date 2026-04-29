import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { AppData, Vehicle, Intervention, Alert } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// ── DB ↔ TS mappers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function vehicleFromDb(r: any): Vehicle {
  return {
    id: r.id,
    make: r.make,
    model: r.model,
    year: r.year,
    vin: r.vin ?? undefined,
    licensePlate: r.license_plate,
    mileage: r.mileage,
    color: r.color ?? undefined,
    fuelType: r.fuel_type,
    purchaseDate: r.purchase_date ?? undefined,
    notes: r.notes ?? undefined,
    shareToken: r.share_token ?? undefined,
    isShareEnabled: r.is_share_enabled ?? false,
    aiSummary: r.ai_summary ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function vehicleToDb(v: Vehicle, userId: string) {
  return {
    id: v.id,
    user_id: userId,
    make: v.make,
    model: v.model,
    year: v.year,
    vin: v.vin ?? null,
    license_plate: v.licensePlate,
    mileage: v.mileage,
    color: v.color ?? null,
    fuel_type: v.fuelType,
    purchase_date: v.purchaseDate ?? null,
    notes: v.notes ?? null,
    is_share_enabled: v.isShareEnabled,
    ai_summary: v.aiSummary ?? null,
    updated_at: new Date().toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interventionFromDb(r: any): Intervention {
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    type: r.type,
    title: r.title,
    description: r.description ?? undefined,
    date: r.date,
    mileage: r.mileage,
    cost: r.cost != null ? parseFloat(r.cost) : undefined,
    garage: r.garage ?? undefined,
    technician: r.technician ?? undefined,
    parts: r.parts ?? undefined,
    tags: r.tags?.length ? r.tags : undefined,
    attachments: r.attachments?.length ? r.attachments : undefined,
    nextServiceMileage: r.next_service_mileage ?? undefined,
    nextServiceDate: r.next_service_date ?? undefined,
    metadata: r.metadata ?? undefined,
    createdAt: r.created_at,
  }
}

function interventionToDb(i: Intervention, userId: string) {
  return {
    id: i.id,
    vehicle_id: i.vehicleId,
    user_id: userId,
    type: i.type,
    title: i.title,
    description: i.description ?? null,
    date: i.date,
    mileage: i.mileage,
    cost: i.cost ?? null,
    garage: i.garage ?? null,
    technician: i.technician ?? null,
    parts: i.parts ?? null,
    tags: i.tags ?? [],
    attachments: i.attachments ?? [],
    next_service_mileage: i.nextServiceMileage ?? null,
    next_service_date: i.nextServiceDate ?? null,
    metadata: i.metadata ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function alertFromDb(r: any): Alert {
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    triggerType: r.trigger_type,
    title: r.title,
    description: r.description ?? undefined,
    triggerMileage: r.trigger_mileage ?? undefined,
    triggerDate: r.trigger_date ?? undefined,
    intervalMileage: r.interval_mileage ?? undefined,
    intervalDays: r.interval_days ?? undefined,
    isActive: r.is_active,
    isDismissed: r.is_dismissed,
    lastTriggeredDate: r.last_triggered_date ?? undefined,
    lastTriggeredMileage: r.last_triggered_mileage ?? undefined,
    createdAt: r.created_at,
  }
}

function alertToDb(a: Alert, userId: string) {
  return {
    id: a.id,
    vehicle_id: a.vehicleId,
    user_id: userId,
    trigger_type: a.triggerType,
    title: a.title,
    description: a.description ?? null,
    trigger_mileage: a.triggerMileage ?? null,
    trigger_date: a.triggerDate ?? null,
    interval_mileage: a.intervalMileage ?? null,
    interval_days: a.intervalDays ?? null,
    is_active: a.isActive,
    is_dismissed: a.isDismissed,
    last_triggered_date: a.lastTriggeredDate ?? null,
    last_triggered_mileage: a.lastTriggeredMileage ?? null,
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const empty: AppData = { vehicles: [], interventions: [], alerts: [] }

interface DataContextValue {
  data: AppData
  isLoading: boolean
  addVehicle: (v: Vehicle) => Promise<void>
  updateVehicle: (v: Vehicle) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  addIntervention: (i: Intervention) => Promise<void>
  updateIntervention: (i: Intervention) => Promise<void>
  deleteIntervention: (id: string) => Promise<void>
  addAlert: (a: Alert) => Promise<void>
  updateAlert: (a: Alert) => Promise<void>
  deleteAlert: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<AppData>(empty)
  const [isLoading, setIsLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) { setData(empty); return }
    setIsLoading(true)
    const [v, i, a] = await Promise.all([
      supabase.from('vehicles').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('interventions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at'),
    ])
    setData({
      vehicles: (v.data ?? []).map(vehicleFromDb),
      interventions: (i.data ?? []).map(interventionFromDb),
      alerts: (a.data ?? []).map(alertFromDb),
    })
    setIsLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addVehicle = useCallback(async (v: Vehicle) => {
    if (!user) return
    const { error } = await supabase.from('vehicles').insert(vehicleToDb(v, user.id))
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const updateVehicle = useCallback(async (v: Vehicle) => {
    if (!user) return
    const { error } = await supabase.from('vehicles').update(vehicleToDb(v, user.id)).eq('id', v.id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const deleteVehicle = useCallback(async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const addIntervention = useCallback(async (i: Intervention) => {
    if (!user) return
    const { error } = await supabase.from('interventions').insert(interventionToDb(i, user.id))
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const updateIntervention = useCallback(async (i: Intervention) => {
    if (!user) return
    const { error } = await supabase.from('interventions').update(interventionToDb(i, user.id)).eq('id', i.id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const deleteIntervention = useCallback(async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('interventions').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const addAlert = useCallback(async (a: Alert) => {
    if (!user) return
    const { error } = await supabase.from('alerts').insert(alertToDb(a, user.id))
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const updateAlert = useCallback(async (a: Alert) => {
    if (!user) return
    const { error } = await supabase.from('alerts').update(alertToDb(a, user.id)).eq('id', a.id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  const deleteAlert = useCallback(async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('alerts').delete().eq('id', id)
    if (error) throw new Error(error.message)
    await fetchAll()
  }, [user, fetchAll])

  return (
    <DataContext.Provider value={{
      data, isLoading,
      addVehicle, updateVehicle, deleteVehicle,
      addIntervention, updateIntervention, deleteIntervention,
      addAlert, updateAlert, deleteAlert,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
