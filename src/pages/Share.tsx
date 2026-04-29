import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Car, Gauge, Fuel, Calendar, Wrench, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import type { CtResult, InterventionType, InterventionMetadata, CtMetadata, PartType } from '../types'
import { TAG_MAP } from '../utils/interventionTags'
import { Paperclip, FileText, ImageIcon, File } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import type { Vehicle, Intervention } from '../types'
import { INTERVENTION_LABELS, INTERVENTION_COLORS, FUEL_LABELS } from '../utils/interventionLabels'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function vehicleFromDb(r: any): Vehicle {
  return {
    id: r.id, make: r.make, model: r.model, year: r.year,
    vin: r.vin ?? undefined, licensePlate: r.license_plate, mileage: r.mileage,
    color: r.color ?? undefined, fuelType: r.fuel_type,
    purchaseDate: r.purchase_date ?? undefined, notes: r.notes ?? undefined,
    shareToken: r.share_token, isShareEnabled: r.is_share_enabled,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interventionFromDb(r: any): Intervention {
  return {
    id: r.id, vehicleId: r.vehicle_id, type: r.type, title: r.title,
    description: r.description ?? undefined, date: r.date, mileage: r.mileage,
    cost: r.cost != null ? parseFloat(r.cost) : undefined,
    garage: r.garage ?? undefined, technician: r.technician ?? undefined,
    parts: r.parts ?? undefined,
    tags: r.tags?.length ? r.tags : undefined,
    attachments: r.attachments?.length ? r.attachments : undefined,
    nextServiceMileage: r.next_service_mileage ?? undefined,
    nextServiceDate: r.next_service_date ?? undefined, metadata: r.metadata ?? undefined,
    createdAt: r.created_at,
  }
}

export default function Share() {
  const { token } = useParams<{ token: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [status, setStatus] = useState<'loading' | 'found' | 'not_found'>('loading')

  useEffect(() => {
    if (!token) { setStatus('not_found'); return }
    async function load() {
      const { data: v } = await supabase
        .from('vehicles')
        .select('*')
        .eq('share_token', token)
        .eq('is_share_enabled', true)
        .single()

      if (!v) { setStatus('not_found'); return }

      const { data: ints } = await supabase
        .from('interventions')
        .select('*')
        .eq('vehicle_id', v.id)
        .order('date', { ascending: false })

      setVehicle(vehicleFromDb(v))
      setInterventions((ints ?? []).map(interventionFromDb))
      setStatus('found')
    }
    load()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center p-4">
        <AlertTriangle className="w-12 h-12 text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-700">Lien de partage invalide</h1>
        <p className="text-gray-400 text-sm">Ce lien n'existe pas ou le partage a été désactivé par le propriétaire.</p>
        <Link to="/" className="btn-secondary mt-2">Accéder à Cars Health</Link>
      </div>
    )
  }

  const totalCost = interventions.reduce((s, i) => s + (i.cost ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Car className="w-5 h-5" />
          <span className="font-bold">Cars Health</span>
          <span className="text-blue-300 text-sm ml-auto">Historique partagé</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Vehicle card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{vehicle!.make} {vehicle!.model}</h1>
                <p className="text-blue-200 text-sm mt-0.5">{vehicle!.year} · {FUEL_LABELS[vehicle!.fuelType]}</p>
              </div>
              <span className="bg-white/20 text-white font-mono font-semibold px-3 py-1 rounded-lg text-sm">
                {vehicle!.licensePlate}
              </span>
            </div>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoItem icon={Gauge} label="Kilométrage" value={`${vehicle!.mileage.toLocaleString()} km`} />
            <InfoItem icon={Fuel} label="Carburant" value={FUEL_LABELS[vehicle!.fuelType]} />
            {vehicle!.purchaseDate && (
              <InfoItem icon={Calendar} label="Achat" value={format(parseISO(vehicle!.purchaseDate), 'd MMM yyyy', { locale: fr })} />
            )}
            <InfoItem icon={Wrench} label="Interventions" value={interventions.length.toString()} />
          </div>
          {vehicle!.vin && (
            <div className="px-6 pb-4 text-xs text-gray-400">VIN : <span className="font-mono">{vehicle!.vin}</span></div>
          )}
        </div>

        {/* Summary */}
        {interventions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{interventions.length}</p>
              <p className="text-xs text-gray-500">Interventions</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{totalCost.toFixed(0)} €</p>
              <p className="text-xs text-gray-500">Coût total</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {interventions.length > 0 ? (totalCost / interventions.length).toFixed(0) : 0} €
              </p>
              <p className="text-xs text-gray-500">Coût moyen</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des interventions</h2>
          {interventions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              Aucune intervention enregistrée
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {interventions.map(i => (
                  <div key={i.id} className="relative pl-14">
                    <div className="absolute left-4 top-5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INTERVENTION_COLORS[i.type]}`}>
                              {INTERVENTION_LABELS[i.type]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(parseISO(i.date), 'd MMMM yyyy', { locale: fr })}
                            </span>
                            {i.mileage > 0 && (
                              <span className="text-xs text-gray-400">{i.mileage.toLocaleString()} km</span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{i.title}</p>
                          {i.tags && i.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {i.tags.map(tag => {
                                const cfg = TAG_MAP[tag]
                                if (!cfg) return null
                                return (
                                  <span key={tag} className={`text-xs px-2 py-0.5 rounded border font-medium ${cfg.bg} ${cfg.color}`}>
                                    {cfg.label}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          {i.description && <p className="text-sm text-gray-500 mt-1">{i.description}</p>}
                          {i.attachments && i.attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                <Paperclip className="w-3 h-3" /> {i.attachments.length} document{i.attachments.length > 1 ? 's' : ''} joint{i.attachments.length > 1 ? 's' : ''}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {i.attachments.map((att, idx) => {
                                  const Icon = att.mimeType.startsWith('image/') ? ImageIcon : att.mimeType === 'application/pdf' ? FileText : File
                                  return (
                                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
                                      <Icon className="w-3.5 h-3.5 shrink-0" />
                                      <span className="max-w-[120px] truncate">{att.name}</span>
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          {i.garage && (
                            <p className="text-xs text-gray-400 mt-1">
                              {i.type === 'ct' ? 'Centre' : 'Garage'} : {i.garage}
                            </p>
                          )}
                          {i.metadata && <MetadataDisplay type={i.type} metadata={i.metadata} />}
                          {i.parts && i.parts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {i.parts.map((p, idx) => {
                                const badge = p.lineType ? PART_TYPE_BADGE[p.lineType] : null
                                const isDiscount = p.lineType === 'discount'
                                const ttc = isDiscount ? null : (p.priceTtc ?? (p.price != null ? p.price * (1 + (p.vat ?? 0) / 100) : null))
                                return (
                                  <span key={idx} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${isDiscount ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {badge && (
                                      <span className={`px-1.5 py-0 rounded font-semibold ${badge.cls}`}>{badge.label}</span>
                                    )}
                                    {p.name}{isDiscount && p.price != null ? ` · −${p.price.toFixed(2)} €` : ttc != null ? ` · ${ttc.toFixed(2)} € TTC` : ''}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        {i.cost !== undefined && (
                          <span className="shrink-0 font-semibold text-gray-900 text-sm">{i.cost.toFixed(2)} €</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">
          Historique généré avec Cars Health
        </p>
      </main>
    </div>
  )
}

const PART_TYPE_BADGE: Record<PartType, { label: string; cls: string } | null> = {
  part:     null,
  labor:    { label: 'MO',     cls: 'bg-blue-100 text-blue-700' },
  fluid:    { label: 'Fluide', cls: 'bg-green-100 text-green-700' },
  discount: { label: 'Remise', cls: 'bg-red-100 text-red-600' },
  other:    { label: 'Autre',  cls: 'bg-gray-100 text-gray-500' },
}

const CT_RESULT_CONFIG: Record<CtResult, { label: string; sub: string; icon: typeof ShieldCheck; color: string; bg: string }> = {
  favorable:       { label: 'Favorable',   sub: 'Aucune défaillance',    icon: ShieldCheck, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  favorable_minor: { label: 'Favorable',   sub: 'Défaillances mineures', icon: ShieldAlert, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  unfavorable:     { label: 'Défavorable', sub: 'Contre-visite requise', icon: ShieldX,     color: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
}

function MetadataDisplay({ type, metadata }: { type: InterventionType; metadata: InterventionMetadata }) {
  if (type !== 'ct') return null
  const m = metadata as CtMetadata
  const cfg = CT_RESULT_CONFIG[m.result]
  const Icon = cfg.icon
  return (
    <div className={`mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-lg border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-4 h-4" />
      <span>{cfg.label} — {cfg.sub}</span>
      {m.counterVisitDeadline && <span className="opacity-75">· Contre-visite avant le {m.counterVisitDeadline}</span>}
      {m.nextCtDate && <span className="opacity-75">· Prochain CT : {m.nextCtDate}</span>}
      {m.reportNumber && <span className="opacity-75">· PV {m.reportNumber}</span>}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Car; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-semibold text-gray-900 text-sm">{value}</p>
      </div>
    </div>
  )
}
