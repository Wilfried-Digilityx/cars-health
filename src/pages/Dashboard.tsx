import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Car, Wrench, Bell, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useData } from '../context/DataContext'
import { evaluateAlert, getAlertColor } from '../utils/alerts'
import { INTERVENTION_LABELS, INTERVENTION_COLORS } from '../utils/interventionLabels'
import EmptyState from '../components/EmptyState'

export default function Dashboard() {
  const { data } = useData()
  const { vehicles, interventions, alerts } = data

  const recentInterventions = useMemo(() =>
    [...interventions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
    [interventions]
  )

  const alertStatuses = useMemo(() =>
    alerts.map(a => {
      const vehicle = vehicles.find(v => v.id === a.vehicleId)
      if (!vehicle) return null
      return { status: evaluateAlert(a, vehicle), vehicle }
    }).filter(Boolean),
    [alerts, vehicles]
  )

  const dueAlerts = alertStatuses.filter(s => s!.status.isDue || s!.status.isOverdue)
  const totalCost = interventions.reduce((sum, i) => sum + (i.cost ?? 0), 0)

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Bienvenue sur Cars Health"
        description="Commencez par ajouter votre véhicule pour suivre son historique et recevoir des alertes de maintenance."
        action={
          <Link to="/vehicles" className="btn-primary">
            <Car className="w-4 h-4" />
            Ajouter mon véhicule
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de vos véhicules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Car} label="Véhicules" value={vehicles.length} color="blue" to="/vehicles" />
        <StatCard icon={Wrench} label="Interventions" value={interventions.length} color="purple" to="/history" />
        <StatCard icon={Bell} label="Alertes actives" value={dueAlerts.length} color={dueAlerts.length > 0 ? 'red' : 'green'} to="/alerts" />
        <StatCard icon={TrendingUp} label="Coût total" value={`${totalCost.toFixed(0)} €`} color="amber" />
      </div>

      {/* Vehicles summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Mes véhicules</h2>
          <Link to="/vehicles" className="text-sm text-blue-600 hover:text-blue-700">Voir tout →</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map(v => {
            const vAlerts = alertStatuses.filter(s => s!.vehicle.id === v.id && (s!.status.isDue || s!.status.isOverdue))
            const lastInt = interventions
              .filter(i => i.vehicleId === v.id)
              .sort((a, b) => b.date.localeCompare(a.date))[0]
            return (
              <Link key={v.id} to={`/vehicles/${v.id}`} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{v.make} {v.model}</p>
                    <p className="text-sm text-gray-500">{v.year} · {v.licensePlate}</p>
                    <p className="text-sm text-gray-600 mt-2">{v.mileage.toLocaleString()} km</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {vAlerts.length > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        {vAlerts.length} alerte{vAlerts.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {vAlerts.length === 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        À jour
                      </span>
                    )}
                  </div>
                </div>
                {lastInt && (
                  <p className="text-xs text-gray-400 mt-3 border-t pt-3">
                    Dernière intervention : {INTERVENTION_LABELS[lastInt.type]} — {format(parseISO(lastInt.date), 'd MMM yyyy', { locale: fr })}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Due alerts */}
      {dueAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertes à traiter
            </h2>
            <Link to="/alerts" className="text-sm text-blue-600 hover:text-blue-700">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {dueAlerts.slice(0, 4).map(s => {
              const color = getAlertColor(s!.status)
              const colorMap: Record<'red' | 'amber' | 'green', string> = {
                red: 'border-red-200 bg-red-50',
                amber: 'border-amber-200 bg-amber-50',
                green: 'border-green-200 bg-green-50',
              }
              const textMap: Record<'red' | 'amber' | 'green', string> = {
                red: 'text-red-700',
                amber: 'text-amber-700',
                green: 'text-green-700',
              }
              return (
                <Link
                  key={s!.status.alert.id}
                  to="/alerts"
                  className={`flex items-center justify-between p-4 rounded-xl border ${colorMap[color]} hover:opacity-90 transition-opacity`}
                >
                  <div>
                    <p className={`font-medium text-sm ${textMap[color]}`}>{s!.status.alert.title}</p>
                    <p className="text-xs text-gray-500">{s!.vehicle.make} {s!.vehicle.model}</p>
                  </div>
                  <span className={`text-xs font-semibold ${textMap[color]}`}>{s!.status.message}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent interventions */}
      {recentInterventions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Interventions récentes</h2>
            <Link to="/history" className="text-sm text-blue-600 hover:text-blue-700">Voir tout →</Link>
          </div>
          <div className="card divide-y divide-gray-100">
            {recentInterventions.map(i => {
              const vehicle = vehicles.find(v => v.id === i.vehicleId)
              return (
                <div key={i.id} className="flex items-center gap-4 p-4">
                  <div className="shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${INTERVENTION_COLORS[i.type]}`}>
                      {INTERVENTION_LABELS[i.type]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{i.title}</p>
                    {vehicle && <p className="text-xs text-gray-400">{vehicle.make} {vehicle.model}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {format(parseISO(i.date), 'd MMM yyyy', { locale: fr })}
                    </p>
                    {i.cost !== undefined && (
                      <p className="text-xs font-medium text-gray-700">{i.cost.toFixed(2)} €</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  to,
}: {
  icon: typeof Car
  label: string
  value: number | string
  color: 'blue' | 'purple' | 'red' | 'green' | 'amber'
  to?: string
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  const content = (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>
}
