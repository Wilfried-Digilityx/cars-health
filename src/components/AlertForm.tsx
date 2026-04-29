import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Alert, AlertTriggerType, Vehicle } from '../types'

interface AlertFormProps {
  vehicles: Vehicle[]
  initial?: Alert
  defaultVehicleId?: string
  onSave: (a: Alert) => void
  onCancel: () => void
  isSaving?: boolean
}

const TRIGGER_LABELS: Record<AlertTriggerType, string> = {
  mileage: 'Par kilométrage',
  date: 'Par date',
  both: 'Kilométrage et date',
}

export default function AlertForm({
  vehicles,
  initial,
  defaultVehicleId,
  onSave,
  onCancel,
  isSaving,
}: AlertFormProps) {
  const [form, setForm] = useState({
    vehicleId: initial?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? '',
    triggerType: initial?.triggerType ?? ('mileage' as AlertTriggerType),
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    triggerMileage: initial?.triggerMileage?.toString() ?? '',
    triggerDate: initial?.triggerDate ?? '',
    intervalMileage: initial?.intervalMileage?.toString() ?? '',
    intervalDays: initial?.intervalDays?.toString() ?? '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? uuidv4(),
      vehicleId: form.vehicleId,
      triggerType: form.triggerType,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      triggerMileage: form.triggerMileage ? parseInt(form.triggerMileage) : undefined,
      triggerDate: form.triggerDate || undefined,
      intervalMileage: form.intervalMileage ? parseInt(form.intervalMileage) : undefined,
      intervalDays: form.intervalDays ? parseInt(form.intervalDays) : undefined,
      isActive: initial?.isActive ?? true,
      isDismissed: initial?.isDismissed ?? false,
      lastTriggeredDate: initial?.lastTriggeredDate,
      lastTriggeredMileage: initial?.lastTriggeredMileage,
      createdAt: initial?.createdAt ?? now,
    })
  }

  const showMileage = form.triggerType === 'mileage' || form.triggerType === 'both'
  const showDate = form.triggerType === 'date' || form.triggerType === 'both'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {vehicles.length > 1 && (
        <div>
          <label className="form-label">Véhicule *</label>
          <select className="form-select" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="form-label">Intitulé de l'alerte *</label>
        <input
          className="form-input"
          required
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Ex : Vidange, Contrôle technique, Pneus hiver…"
        />
      </div>

      <div>
        <label className="form-label">Type de déclenchement *</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TRIGGER_LABELS) as AlertTriggerType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('triggerType', t)}
              className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                form.triggerType === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {TRIGGER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {showMileage && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Déclencher à (km)</label>
            <input
              className="form-input"
              type="number"
              min={0}
              value={form.triggerMileage}
              onChange={e => set('triggerMileage', e.target.value)}
              placeholder="Ex : 150000"
            />
          </div>
          <div>
            <label className="form-label">Répéter tous les (km)</label>
            <input
              className="form-input"
              type="number"
              min={0}
              value={form.intervalMileage}
              onChange={e => set('intervalMileage', e.target.value)}
              placeholder="Ex : 10000"
            />
          </div>
        </div>
      )}

      {showDate && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Déclencher le</label>
            <input
              className="form-input"
              type="date"
              value={form.triggerDate}
              onChange={e => set('triggerDate', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Répéter tous les (jours)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              value={form.intervalDays}
              onChange={e => set('intervalDays', e.target.value)}
              placeholder="Ex : 365"
            />
          </div>
        </div>
      )}

      <div>
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          rows={2}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Détails ou instructions…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={isSaving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
          {isSaving
            ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : initial ? 'Mettre à jour' : "Créer l'alerte"
          }
        </button>
      </div>
    </form>
  )
}
