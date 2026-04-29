import { useState, useMemo } from 'react'
import { Plus, Wrench, Search, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Intervention, InterventionType } from '../types'
import { useData } from '../context/DataContext'
import { INTERVENTION_LABELS, INTERVENTION_COLORS } from '../utils/interventionLabels'
import InterventionForm from '../components/InterventionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

export default function History() {
  const { data, addIntervention, updateIntervention, deleteIntervention } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Intervention | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Intervention | null>(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<InterventionType | ''>('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return [...data.interventions]
      .filter(i => {
        if (filterVehicle && i.vehicleId !== filterVehicle) return false
        if (filterType && i.type !== filterType) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            i.title.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.garage?.toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [data.interventions, filterVehicle, filterType, search])

  const totalCost = filtered.reduce((s, i) => s + (i.cost ?? 0), 0)

  const handleSave = async (i: Intervention) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      if (editTarget) await updateIntervention(i)
      else await addIntervention(i)
      setShowForm(false)
      setEditTarget(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (data.vehicles.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="Aucun véhicule"
        description="Ajoutez d'abord un véhicule avant d'enregistrer des interventions."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
          <p className="text-gray-500 text-sm mt-1">{data.interventions.length} intervention{data.interventions.length > 1 ? 's' : ''} enregistrée{data.interventions.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Nouvelle intervention
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select sm:w-44"
          value={filterVehicle}
          onChange={e => setFilterVehicle(e.target.value)}
        >
          <option value="">Tous les véhicules</option>
          {data.vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.make} {v.model}</option>
          ))}
        </select>
        <select
          className="form-select sm:w-44"
          value={filterType}
          onChange={e => setFilterType(e.target.value as InterventionType | '')}
        >
          <option value="">Tous les types</option>
          {(Object.keys(INTERVENTION_LABELS) as InterventionType[]).map(t => (
            <option key={t} value={t}>{INTERVENTION_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <span className="font-medium text-gray-700">Total : {totalCost.toFixed(2)} €</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Aucune intervention"
          description="Enregistrez votre première intervention pour démarrer le suivi."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Nouvelle intervention
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(i => {
            const vehicle = data.vehicles.find(v => v.id === i.vehicleId)
            return (
              <div key={i.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INTERVENTION_COLORS[i.type]}`}>
                        {INTERVENTION_LABELS[i.type]}
                      </span>
                      {vehicle && (
                        <span className="text-xs text-gray-400">{vehicle.make} {vehicle.model}</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900">{i.title}</p>
                    {i.description && <p className="text-sm text-gray-500 mt-1">{i.description}</p>}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                      <span>{format(parseISO(i.date), 'd MMM yyyy', { locale: fr })}</span>
                      {i.mileage > 0 && <span>{i.mileage.toLocaleString()} km</span>}
                      {i.garage && <span>{i.garage}</span>}
                    </div>

                    {i.parts && i.parts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {i.parts.map((p, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {p.name}{p.brand ? ` · ${p.brand}` : ''}{p.price != null ? ` · ${p.price.toFixed(2)} €` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {i.cost !== undefined && (
                      <p className="font-semibold text-gray-900">{i.cost.toFixed(2)} €</p>
                    )}
                    <div className="flex gap-1 mt-2 justify-end">
                      <button
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        onClick={() => { setEditTarget(i); setShowForm(true) }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(i)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal
          title={editTarget ? "Modifier l'intervention" : 'Nouvelle intervention'}
          onClose={() => { setShowForm(false); setEditTarget(null); setSaveError(null) }}
          size="lg"
        >
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}
          <InterventionForm
            vehicles={data.vehicles}
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditTarget(null) }}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer l'intervention"
          message={`Supprimer « ${deleteTarget.title} » ?`}
          onConfirm={async () => { await deleteIntervention(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
