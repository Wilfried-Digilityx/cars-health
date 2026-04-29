import { useState, useMemo } from 'react'
import { Plus, Bell, BellOff, Pencil, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import type { Alert } from '../types'
import { useData } from '../context/DataContext'
import { evaluateAlert, getAlertColor } from '../utils/alerts'
import AlertForm from '../components/AlertForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'

export default function Alerts() {
  const { data, addAlert, updateAlert, deleteAlert } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Alert | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Alert | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const alertStatuses = useMemo(() =>
    data.alerts.map(a => {
      const vehicle = data.vehicles.find(v => v.id === a.vehicleId)
      if (!vehicle) return null
      return { status: evaluateAlert(a, vehicle), vehicle, alert: a }
    }).filter(Boolean),
    [data.alerts, data.vehicles]
  )

  const overdueAlerts = alertStatuses.filter(s => s!.status.isOverdue)
  const dueAlerts = alertStatuses.filter(s => !s!.status.isOverdue && s!.status.isDue)
  const okAlerts = alertStatuses.filter(s => !s!.status.isOverdue && !s!.status.isDue)

  const handleSave = async (a: Alert) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      if (editTarget) await updateAlert(a)
      else await addAlert(a)
      setShowForm(false)
      setEditTarget(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (a: Alert) => {
    await updateAlert({ ...a, isActive: !a.isActive })
  }

  const dismiss = async (a: Alert) => {
    await updateAlert({ ...a, isDismissed: true })
  }

  if (data.vehicles.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Aucun véhicule"
        description="Ajoutez d'abord un véhicule avant de créer des alertes de maintenance."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes de maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">{data.alerts.length} alerte{data.alerts.length > 1 ? 's' : ''} configurée{data.alerts.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true) }}>
          <Plus className="w-4 h-4" />
          Nouvelle alerte
        </button>
      </div>

      {/* Summary badges */}
      {data.alerts.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {overdueAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {overdueAlerts.length} dépassée{overdueAlerts.length > 1 ? 's' : ''}
            </div>
          )}
          {dueAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              {dueAlerts.length} à venir
            </div>
          )}
          {okAlerts.length > 0 && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              {okAlerts.length} à jour
            </div>
          )}
        </div>
      )}

      {alertStatuses.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Aucune alerte"
          description="Créez des alertes pour être notifié quand un entretien est dû (vidange, contrôle technique, pneus saisonniers…)."
          action={
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Créer une alerte
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {[
            { title: 'Dépassées', items: overdueAlerts, icon: AlertTriangle, color: 'red' as const },
            { title: 'Bientôt dues', items: dueAlerts, icon: Clock, color: 'amber' as const },
            { title: 'À jour', items: okAlerts, icon: CheckCircle, color: 'green' as const },
          ].map(({ title, items, icon: Icon, color }) =>
            items.length > 0 ? (
              <section key={title}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${color}-500`} />
                  {title}
                </h2>
                <div className="space-y-2">
                  {items.map(s => {
                    const borderMap = { red: 'border-red-200', amber: 'border-amber-200', green: 'border-gray-200' }
                    const bgMap = { red: 'bg-red-50', amber: 'bg-amber-50', green: 'bg-white' }
                    const textMap = { red: 'text-red-700', amber: 'text-amber-700', green: 'text-green-700' }
                    const c = getAlertColor(s!.status)
                    return (
                      <div
                        key={s!.alert.id}
                        className={`card border p-4 ${borderMap[c]} ${bgMap[c]}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{s!.alert.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {s!.vehicle.make} {s!.vehicle.model} · {s!.vehicle.licensePlate}
                            </p>
                            {s!.alert.description && (
                              <p className="text-sm text-gray-500 mt-1">{s!.alert.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                              {s!.alert.triggerMileage && (
                                <span>Km cible : {s!.alert.triggerMileage.toLocaleString()} km</span>
                              )}
                              {s!.alert.triggerDate && (
                                <span>Date : {s!.alert.triggerDate}</span>
                              )}
                              {s!.alert.intervalMileage && (
                                <span>Intervalle : {s!.alert.intervalMileage.toLocaleString()} km</span>
                              )}
                              {s!.alert.intervalDays && (
                                <span>Intervalle : {s!.alert.intervalDays} jours</span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className={`text-sm font-semibold ${textMap[c]}`}>{s!.status.message}</span>
                            <div className="flex gap-1 mt-2 justify-end">
                              {(s!.status.isDue || s!.status.isOverdue) && (
                                <button
                                  className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-green-600 transition-colors"
                                  title="Marquer comme traité"
                                  onClick={() => dismiss(s!.alert)}
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                                title={s!.alert.isActive ? 'Désactiver' : 'Activer'}
                                onClick={() => toggleActive(s!.alert)}
                              >
                                {s!.alert.isActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                                onClick={() => { setEditTarget(s!.alert); setShowForm(true) }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1.5 rounded hover:bg-white text-gray-400 hover:text-red-600 transition-colors"
                                onClick={() => setDeleteTarget(s!.alert)}
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
              </section>
            ) : null
          )}
        </div>
      )}

      {showForm && (
        <Modal
          title={editTarget ? "Modifier l'alerte" : 'Nouvelle alerte'}
          onClose={() => { setShowForm(false); setEditTarget(null); setSaveError(null) }}
        >
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}
          <AlertForm
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
          title="Supprimer l'alerte"
          message={`Supprimer l'alerte « ${deleteTarget.title} » ?`}
          onConfirm={async () => { await deleteAlert(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
