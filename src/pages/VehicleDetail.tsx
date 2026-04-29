import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Plus, Gauge, Calendar, Fuel, Wrench, Share2, Copy, Check, EyeOff, ShieldCheck, ShieldAlert, ShieldX, Sparkles, RefreshCw, AlertTriangle, CheckCircle, ThumbsUp, Activity } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CtResult, InterventionType, InterventionMetadata, CtMetadata, PartType, Vehicle, Intervention } from '../types'
import { TAG_MAP } from '../utils/interventionTags'
import AttachmentList from '../components/AttachmentList'
import { useData } from '../context/DataContext'
import { INTERVENTION_LABELS, INTERVENTION_COLORS, FUEL_LABELS } from '../utils/interventionLabels'
import { supabase } from '../lib/supabase'
import VehicleForm from '../components/VehicleForm'
import InterventionForm from '../components/InterventionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, updateVehicle, deleteVehicle, addIntervention, updateIntervention, deleteIntervention } = useData()

  const vehicle = data.vehicles.find(v => v.id === id)
  const interventions = useMemo(() =>
    data.interventions
      .filter(i => i.vehicleId === id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [data.interventions, id]
  )

  const [activeTab, setActiveTab] = useState<'history' | 'summary'>('history')
  const [showEditVehicle, setShowEditVehicle] = useState(false)
  const [showDeleteVehicle, setShowDeleteVehicle] = useState(false)
  const [showIntervention, setShowIntervention] = useState(false)
  const [editIntervention, setEditIntervention] = useState<Intervention | null>(null)
  const [deleteIntervention2, setDeleteIntervention2] = useState<Intervention | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!vehicle) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Véhicule introuvable.</p>
        <Link to="/vehicles" className="btn-primary mt-4 inline-flex">Retour aux véhicules</Link>
      </div>
    )
  }

  const totalCost = interventions.reduce((s, i) => s + (i.cost ?? 0), 0)
  const shareUrl = vehicle.shareToken
    ? `${window.location.origin}/share/${vehicle.shareToken}`
    : null

  const toggleShare = async () => {
    setIsSaving(true)
    await updateVehicle({ ...vehicle, isShareEnabled: !vehicle.isShareEnabled })
    setIsSaving(false)
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/vehicles" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{vehicle.make} {vehicle.model}</h1>
          <p className="text-gray-500 text-sm">{vehicle.year} · {vehicle.licensePlate}</p>
        </div>
        <button className="btn-secondary" onClick={() => setShowEditVehicle(true)}>
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Modifier</span>
        </button>
        <button
          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          onClick={() => setShowDeleteVehicle(true)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Vehicle info */}
      <div className="card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem icon={Gauge} label="Kilométrage" value={`${vehicle.mileage.toLocaleString()} km`} />
          <InfoItem icon={Fuel} label="Carburant" value={FUEL_LABELS[vehicle.fuelType]} />
          {vehicle.purchaseDate && (
            <InfoItem icon={Calendar} label="Achat" value={format(parseISO(vehicle.purchaseDate), 'd MMM yyyy', { locale: fr })} />
          )}
          <InfoItem icon={Wrench} label="Interventions" value={interventions.length.toString()} />
        </div>
        {vehicle.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">{vehicle.notes}</p>
          </div>
        )}
      </div>

      {/* Share panel */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Partager l'historique
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Activez le partage pour générer un lien public que vous transmettez à un acheteur potentiel. Il verra l'historique complet en lecture seule.
            </p>
          </div>
          <button
            onClick={toggleShare}
            disabled={isSaving}
            className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
              ${vehicle.isShareEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${vehicle.isShareEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {vehicle.isShareEnabled && shareUrl && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Lien de partage :</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 truncate">
                {shareUrl}
              </code>
              <button
                onClick={copyShareLink}
                className={`shrink-0 btn-secondary px-3 py-2 text-sm ${copied ? 'text-green-600 border-green-300' : ''}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {!vehicle.isShareEnabled && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <EyeOff className="w-3.5 h-3.5" />
            Partage désactivé — l'historique est privé
          </div>
        )}
      </div>

      {/* Cost summary */}
      {interventions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{interventions.length}</p>
            <p className="text-xs text-gray-500">Interventions</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalCost.toFixed(0)} €</p>
            <p className="text-xs text-gray-500">Coût total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {interventions.length > 0 ? (totalCost / interventions.length).toFixed(0) : 0} €
            </p>
            <p className="text-xs text-gray-500">Coût moyen</p>
          </div>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Wrench className="w-4 h-4" />
              Historique
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Sparkles className="w-4 h-4" />
              Résumé IA
            </button>
          </div>
          {activeTab === 'history' && (
            <button
              className="btn-primary"
              onClick={() => { setEditIntervention(null); setShowIntervention(true) }}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>

        {/* ── History tab ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          interventions.length === 0 ? (
            <div className="card p-8 text-center">
              <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucune intervention enregistrée</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {interventions.map(intervention => (
                  <div key={intervention.id} className="relative pl-14">
                    <div className="absolute left-4 top-5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                    <div className="card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INTERVENTION_COLORS[intervention.type] ?? 'bg-gray-100 text-gray-800'}`}>
                              {INTERVENTION_LABELS[intervention.type] ?? intervention.type}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(parseISO(intervention.date), 'd MMMM yyyy', { locale: fr })}
                            </span>
                            {intervention.mileage > 0 && (
                              <span className="text-xs text-gray-400">{intervention.mileage.toLocaleString()} km</span>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{intervention.title}</p>
                          {intervention.tags && intervention.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {intervention.tags.map(tag => {
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
                          {intervention.description && (
                            <p className="text-sm text-gray-500 mt-1">{intervention.description}</p>
                          )}
                          {intervention.garage && (
                            <p className="text-xs text-gray-400 mt-1">
                              {intervention.type === 'ct' ? 'Centre' : 'Garage'} : {intervention.garage}
                            </p>
                          )}
                          {intervention.metadata && (
                            <MetadataDisplay type={intervention.type} metadata={intervention.metadata} />
                          )}
                          {intervention.parts && intervention.parts.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {intervention.parts.map((p, i) => {
                                const badge = p.lineType ? PART_TYPE_BADGE[p.lineType] : null
                                const isDiscount = p.lineType === 'discount'
                                const ttc = isDiscount ? null : (p.priceTtc ?? (p.price != null ? p.price * (1 + (p.vat ?? 0) / 100) : null))
                                return (
                                  <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${isDiscount ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {badge && (
                                      <span className={`px-1.5 py-0 rounded font-semibold ${badge.cls}`}>{badge.label}</span>
                                    )}
                                    {p.name}{isDiscount && p.price != null ? ` · −${p.price.toFixed(2)} €` : ttc != null ? ` · ${ttc.toFixed(2)} € TTC` : ''}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          {intervention.attachments && intervention.attachments.length > 0 && (
                            <AttachmentList attachments={intervention.attachments} />
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          {intervention.cost !== undefined && (
                            <p className="font-semibold text-gray-900">{intervention.cost.toFixed(2)} €</p>
                          )}
                          <div className="flex gap-1 mt-2">
                            <button
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              onClick={() => { setEditIntervention(intervention); setShowIntervention(true) }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                              onClick={() => setDeleteIntervention2(intervention)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* ── Summary tab ──────────────────────────────────────────────────── */}
        {activeTab === 'summary' && (
          <VehicleSummary
            vehicle={vehicle}
            interventions={interventions}
            onSave={async (s) => { await updateVehicle({ ...vehicle, aiSummary: s as unknown as Record<string, unknown> }) }}
          />
        )}
      </div>

      {showEditVehicle && (
        <Modal title="Modifier le véhicule" onClose={() => setShowEditVehicle(false)} size="lg">
          <VehicleForm
            initial={vehicle}
            onSave={async v => { setIsSaving(true); await updateVehicle(v); setIsSaving(false); setShowEditVehicle(false) }}
            onCancel={() => setShowEditVehicle(false)}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {showDeleteVehicle && (
        <ConfirmDialog
          title="Supprimer le véhicule"
          message={`Supprimer ${vehicle.make} ${vehicle.model} ? Toutes les interventions et alertes seront supprimées.`}
          onConfirm={async () => { await deleteVehicle(vehicle.id); navigate('/vehicles') }}
          onCancel={() => setShowDeleteVehicle(false)}
        />
      )}

      {showIntervention && (
        <Modal
          title={editIntervention ? "Modifier l'intervention" : 'Nouvelle intervention'}
          onClose={() => { setShowIntervention(false); setEditIntervention(null); setSaveError(null) }}
          size="xl"
        >
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}
          <InterventionForm
            vehicles={[vehicle]}
            initial={editIntervention ?? undefined}
            defaultVehicleId={vehicle.id}
            onSave={async i => {
              setIsSaving(true)
              setSaveError(null)
              try {
                if (editIntervention) await updateIntervention(i)
                else await addIntervention(i)
                setShowIntervention(false)
                setEditIntervention(null)
              } catch (err) {
                setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
              } finally {
                setIsSaving(false)
              }
            }}
            onCancel={() => { setShowIntervention(false); setEditIntervention(null); setSaveError(null) }}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {deleteIntervention2 && (
        <ConfirmDialog
          title="Supprimer l'intervention"
          message={`Supprimer « ${deleteIntervention2.title} » ?`}
          onConfirm={async () => {
            await deleteIntervention(deleteIntervention2.id)
            setDeleteIntervention2(null)
          }}
          onCancel={() => setDeleteIntervention2(null)}
        />
      )}
    </div>
  )
}

// ── Vehicle Summary ───────────────────────────────────────────────────────────

interface SummaryData {
  health: 'excellent' | 'good' | 'fair' | 'poor'
  healthLabel: string
  overview: string
  highlights: string[]
  costAnalysis: string
  recommendations: string[]
  buyerNote: string
}

const HEALTH_CONFIG = {
  excellent: { color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: CheckCircle,    label: 'Très bon état' },
  good:      { color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: ThumbsUp,       label: 'Bon état'      },
  fair:      { color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  icon: Activity,       label: 'État correct'  },
  poor:      { color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    icon: AlertTriangle,  label: 'Préoccupant'   },
}

function VehicleSummary({ vehicle, interventions, onSave }: {
  vehicle: Vehicle
  interventions: Intervention[]
  onSave: (summary: SummaryData) => Promise<void>
}) {
  const existing = vehicle.aiSummary as SummaryData | undefined
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(existing ? 'done' : 'idle')
  const [summary, setSummary] = useState<SummaryData | null>(existing ?? null)
  const [errorMsg, setErrorMsg] = useState('')

  const generate = async () => {
    setStatus('loading')
    setErrorMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { vehicle, interventions },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      const result = data as SummaryData
      setSummary(result)
      setStatus('done')
      await onSave(result)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
      setStatus('error')
    }
  }

  if (status === 'idle') {
    return (
      <div className="card p-10 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Résumé IA du véhicule</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            L'IA analyse toutes les informations du véhicule et son historique d'interventions pour générer une synthèse complète.
          </p>
        </div>
        <button className="btn-primary" onClick={generate}>
          <Sparkles className="w-4 h-4" />
          Générer le résumé
        </button>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="card p-10 flex flex-col items-center text-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Analyse en cours…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card p-8 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-600">{errorMsg}</p>
        <button className="btn-secondary" onClick={generate}>Réessayer</button>
      </div>
    )
  }

  if (!summary) return null

  const healthCfg = HEALTH_CONFIG[summary.health] ?? HEALTH_CONFIG.good
  const HealthIcon = healthCfg.icon

  return (
    <div className="space-y-4">
      {/* Health badge + overview */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${healthCfg.bg} ${healthCfg.color}`}>
            <HealthIcon className="w-4 h-4" />
            {summary.healthLabel}
          </div>
          <button
            onClick={generate}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regénérer
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{summary.overview}</p>
      </div>

      {/* Highlights */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          Points notables
        </h3>
        <ul className="space-y-2">
          {summary.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      {/* Cost + Recommendations side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Analyse des coûts
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{summary.costAnalysis}</p>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Points de vigilance
          </h3>
          <ul className="space-y-2">
            {summary.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Buyer note */}
      <div className="card p-5 bg-blue-50 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Note acheteur potentiel
        </h3>
        <p className="text-sm text-blue-800 leading-relaxed">{summary.buyerNote}</p>
      </div>
    </div>
  )
}

// ── Part type badge ───────────────────────────────────────────────────────────

const PART_TYPE_BADGE: Record<PartType, { label: string; cls: string } | null> = {
  part:     null,
  labor:    { label: 'MO',     cls: 'bg-blue-100 text-blue-700' },
  fluid:    { label: 'Fluide', cls: 'bg-green-100 text-green-700' },
  discount: { label: 'Remise', cls: 'bg-red-100 text-red-600' },
  other:    { label: 'Autre',  cls: 'bg-gray-100 text-gray-500' },
}

// ── CT Result & misc ──────────────────────────────────────────────────────────

const CT_RESULT_CONFIG: Record<CtResult, { label: string; sub: string; icon: typeof ShieldCheck; color: string; bg: string }> = {
  favorable:       { label: 'Favorable',  sub: 'Aucune défaillance',    icon: ShieldCheck, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  favorable_minor: { label: 'Favorable',  sub: 'Défaillances mineures', icon: ShieldAlert, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
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

function InfoItem({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-semibold text-gray-900 text-sm">{value}</p>
      </div>
    </div>
  )
}
