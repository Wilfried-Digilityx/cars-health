import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Vehicle, FuelType } from '../types'
import { FUEL_LABELS } from '../utils/interventionLabels'

interface VehicleFormProps {
  initial?: Vehicle
  onSave: (v: Vehicle) => void
  onCancel: () => void
  isSaving?: boolean
}

const fuelTypes: FuelType[] = ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg']

export default function VehicleForm({ initial, onSave, onCancel, isSaving }: VehicleFormProps) {
  const [form, setForm] = useState({
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    year: initial?.year?.toString() ?? new Date().getFullYear().toString(),
    licensePlate: initial?.licensePlate ?? '',
    vin: initial?.vin ?? '',
    color: initial?.color ?? '',
    fuelType: initial?.fuelType ?? ('gasoline' as FuelType),
    mileage: initial?.mileage?.toString() ?? '0',
    purchaseDate: initial?.purchaseDate ?? '',
    notes: initial?.notes ?? '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? uuidv4(),
      make: form.make.trim(),
      model: form.model.trim(),
      year: parseInt(form.year),
      licensePlate: form.licensePlate.trim().toUpperCase(),
      vin: form.vin.trim() || undefined,
      color: form.color.trim() || undefined,
      fuelType: form.fuelType,
      mileage: parseInt(form.mileage) || 0,
      purchaseDate: form.purchaseDate || undefined,
      notes: form.notes.trim() || undefined,
      isShareEnabled: initial?.isShareEnabled ?? false,
      shareToken: initial?.shareToken,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Marque *</label>
          <input
            className="form-input"
            required
            value={form.make}
            onChange={e => set('make', e.target.value)}
            placeholder="Renault, Peugeot…"
          />
        </div>
        <div>
          <label className="form-label">Modèle *</label>
          <input
            className="form-input"
            required
            value={form.model}
            onChange={e => set('model', e.target.value)}
            placeholder="Clio, 308…"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Année *</label>
          <input
            className="form-input"
            type="number"
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            value={form.year}
            onChange={e => set('year', e.target.value)}
          />
        </div>
        <div>
          <label className="form-label">Immatriculation *</label>
          <input
            className="form-input"
            required
            value={form.licensePlate}
            onChange={e => set('licensePlate', e.target.value)}
            placeholder="AB-123-CD"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Carburant *</label>
          <select className="form-select" value={form.fuelType} onChange={e => set('fuelType', e.target.value)}>
            {fuelTypes.map(f => (
              <option key={f} value={f}>{FUEL_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Kilométrage actuel</label>
          <input
            className="form-input"
            type="number"
            min={0}
            value={form.mileage}
            onChange={e => set('mileage', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Couleur</label>
          <input
            className="form-input"
            value={form.color}
            onChange={e => set('color', e.target.value)}
            placeholder="Blanc, Noir…"
          />
        </div>
        <div>
          <label className="form-label">Date d'achat</label>
          <input
            className="form-input"
            type="date"
            value={form.purchaseDate}
            onChange={e => set('purchaseDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Numéro VIN / châssis</label>
        <input
          className="form-input"
          value={form.vin}
          onChange={e => set('vin', e.target.value)}
          placeholder="17 caractères"
          maxLength={17}
        />
      </div>

      <div>
        <label className="form-label">Notes</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Informations complémentaires…"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={isSaving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={isSaving}>
          {isSaving
            ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : initial ? 'Mettre à jour' : 'Ajouter le véhicule'
          }
        </button>
      </div>
    </form>
  )
}
