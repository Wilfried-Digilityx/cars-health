import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Car, Pencil, Trash2, Gauge } from 'lucide-react'
import type { Vehicle } from '../types'
import { useData } from '../context/DataContext'
import { FUEL_LABELS } from '../utils/interventionLabels'
import VehicleForm from '../components/VehicleForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

export default function Vehicles() {
  const { data, addVehicle, updateVehicle, deleteVehicle } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async (v: Vehicle) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await (editTarget ? updateVehicle(v) : addVehicle(v))
      setShowForm(false)
      setEditTarget(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (v: Vehicle) => {
    setEditTarget(v)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteVehicle(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes véhicules</h1>
          <p className="text-gray-500 text-sm mt-1">{data.vehicles.length} véhicule{data.vehicles.length > 1 ? 's' : ''} enregistré{data.vehicles.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {data.vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer à suivre son historique de maintenance."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Ajouter un véhicule
            </button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {data.vehicles.map(v => (
            <div key={v.id} className="card overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xl">{v.make} {v.model}</h3>
                    <p className="text-blue-200 text-sm">{v.year} · {FUEL_LABELS[v.fuelType]}</p>
                  </div>
                  <span className="bg-white/20 text-white text-sm font-mono font-semibold px-3 py-1 rounded-lg">
                    {v.licensePlate}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Gauge className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-lg">{v.mileage.toLocaleString()} km</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {v.color && (
                    <div>
                      <p className="text-gray-400 text-xs">Couleur</p>
                      <p className="font-medium">{v.color}</p>
                    </div>
                  )}
                  {v.purchaseDate && (
                    <div>
                      <p className="text-gray-400 text-xs">Achat</p>
                      <p className="font-medium">{v.purchaseDate}</p>
                    </div>
                  )}
                  {v.vin && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">VIN</p>
                      <p className="font-mono text-xs">{v.vin}</p>
                    </div>
                  )}
                </div>

                {v.notes && (
                  <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{v.notes}</p>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="btn-secondary flex-1 justify-center text-sm"
                  >
                    Voir le détail
                  </Link>
                  <button
                    className="btn-secondary px-3"
                    onClick={() => handleEdit(v)}
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => setDeleteTarget(v)}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal
          title={editTarget ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          onClose={() => { setShowForm(false); setEditTarget(null); setSaveError(null) }}
          size="lg"
        >
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}
          <VehicleForm
            initial={editTarget ?? undefined}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditTarget(null) }}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer le véhicule"
          message={`Supprimer ${deleteTarget.make} ${deleteTarget.model} (${deleteTarget.licensePlate}) ? Toutes les interventions et alertes associées seront également supprimées.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
