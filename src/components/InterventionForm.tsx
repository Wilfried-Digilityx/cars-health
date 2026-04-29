import { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, Sparkles, Upload, CheckCircle, AlertCircle, X, ArrowLeft, ShieldCheck, ShieldAlert, ShieldX, Paperclip, FileText, ImageIcon, File } from 'lucide-react'
import type { Intervention, InterventionType, InterventionTag, PartType, Part, Attachment, Vehicle, CtResult, CtMetadata } from '../types'
import { INTERVENTION_LABELS } from '../utils/interventionLabels'
import { TAG_CONFIG } from '../utils/interventionTags'
import { supabase } from '../lib/supabase'
import InterventionTypeSelector, { OPTIONS } from './InterventionTypeSelector'

const AI_ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf'
const ATTACH_ACCEPTED = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt'
const MAX_AI_MB = 8
const MAX_ATTACH_MB = 20

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return File
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

const PART_TYPE_OPTIONS: { value: PartType; label: string }[] = [
  { value: 'part',     label: 'Pièce'        },
  { value: 'labor',    label: "Main d'œuvre" },
  { value: 'fluid',    label: 'Fluide'       },
  { value: 'discount', label: 'Remise'       },
  { value: 'other',    label: 'Autre'        },
]

const round2 = (n: number) => Math.round(n * 100) / 100

const CT_RESULTS: { value: CtResult; label: string; sub: string; icon: typeof ShieldCheck; color: string; bg: string }[] = [
  { value: 'favorable',       label: 'Favorable',   sub: 'Aucune défaillance',         icon: ShieldCheck, color: 'text-green-700', bg: 'border-green-300 bg-green-50' },
  { value: 'favorable_minor', label: 'Favorable',   sub: 'Avec défaillances mineures', icon: ShieldAlert, color: 'text-amber-700', bg: 'border-amber-300 bg-amber-50' },
  { value: 'unfavorable',     label: 'Défavorable', sub: 'Contre-visite requise',      icon: ShieldX,     color: 'text-red-700',   bg: 'border-red-300   bg-red-50'   },
]

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface Props {
  vehicles: Vehicle[]
  initial?: Intervention
  defaultVehicleId?: string
  onSave: (i: Intervention) => void
  onCancel: () => void
  isSaving?: boolean
}

export default function InterventionForm({ vehicles, initial, defaultVehicleId, onSave, onCancel, isSaving }: Props) {
  const [type, setType] = useState<InterventionType | null>(initial?.type ?? null)

  if (!type) {
    return (
      <div>
        <InterventionTypeSelector onSelect={setType} />
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button type="button" className="btn-secondary w-full justify-center" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    )
  }

  return (
    <TypedForm
      type={type}
      vehicles={vehicles}
      initial={initial}
      defaultVehicleId={defaultVehicleId}
      onSave={onSave}
      onCancel={onCancel}
      isSaving={isSaving}
      onChangeType={() => setType(null)}
    />
  )
}

interface TypedFormProps extends Props {
  type: InterventionType
  onChangeType: () => void
}

function TypedForm({ type, vehicles, initial, defaultVehicleId, onSave, onCancel, isSaving, onChangeType }: TypedFormProps) {
  const typeOption = OPTIONS.find(o => o.type === type)!
  const Icon = typeOption.icon

  // ── Shared state ──────────────────────────────────────────────────────────────
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? defaultVehicleId ?? vehicles[0]?.id ?? '')
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [date, setDate]           = useState(initial?.date ?? new Date().toISOString().split('T')[0])
  const [mileage, setMileage]     = useState(initial?.mileage?.toString() ?? '')
  const [cost, setCost]           = useState(initial?.cost?.toString() ?? '')
  const [garage, setGarage]       = useState(initial?.garage ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  // ── Tags (intervention) ───────────────────────────────────────────────────────
  const [tags, setTags] = useState<InterventionTag[]>(initial?.tags ?? [])
  const toggleTag = (tag: InterventionTag) =>
    setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])

  // ── Parts (intervention) ──────────────────────────────────────────────────────
  const [parts, setParts] = useState<Part[]>(initial?.parts ?? [])
  const [dynamicPricing, setDynamicPricing] = useState(true)
  const addPart    = () => setParts(p => [...p, { name: '', brand: '', reference: '', lineType: 'part' as PartType, vat: 20 }])
  const removePart = (i: number) => setParts(p => p.filter((_, idx) => idx !== i))
  const updatePart = (i: number, key: keyof Part, value: string) =>
    setParts(p => p.map((part, idx) => {
      if (idx !== i) return part
      if (key === 'lineType') {
        if (value === 'discount') return { ...part, lineType: 'discount' as PartType, brand: undefined, vat: undefined, priceTtc: undefined }
        if (part.lineType === 'discount') return { ...part, lineType: value as PartType, vat: 20 }
        return { ...part, lineType: value as PartType }
      }
      if (key === 'price') {
        const ht = value === '' ? undefined : round2(parseFloat(value))
        if (!dynamicPricing) return { ...part, price: ht }
        return { ...part, price: ht, priceTtc: ht != null ? round2(ht * (1 + (part.vat ?? 0) / 100)) : undefined }
      }
      if (key === 'priceTtc') {
        const ttc = value === '' ? undefined : round2(parseFloat(value))
        if (!dynamicPricing) return { ...part, priceTtc: ttc }
        return { ...part, priceTtc: ttc, price: ttc != null ? round2(ttc / (1 + (part.vat ?? 0) / 100)) : undefined }
      }
      if (key === 'vat') {
        const vat = value === '' ? undefined : parseFloat(value)
        if (!dynamicPricing) return { ...part, vat }
        const ttc = part.price != null && vat != null ? round2(part.price * (1 + vat / 100)) : part.priceTtc
        return { ...part, vat, priceTtc: ttc }
      }
      return { ...part, [key]: value }
    }))

  // ── CT metadata ───────────────────────────────────────────────────────────────
  const [ct, setCt] = useState<CtMetadata>((initial?.metadata as CtMetadata) ?? { result: 'favorable', counterVisitRequired: false })
  const handleCtResult = (result: CtResult) => {
    setCt(m => ({ ...m, result, counterVisitRequired: result === 'unfavorable', counterVisitDeadline: result !== 'unfavorable' ? undefined : m.counterVisitDeadline }))
  }

  // ── Attachments ───────────────────────────────────────────────────────────────
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? [])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const attachInputRef = useRef<HTMLInputElement>(null)

  const addPendingFile = (file: File) => {
    if (file.size > MAX_ATTACH_MB * 1024 * 1024) return
    setPendingFiles(prev => [...prev, file])
  }
  const removePending = (idx: number) => setPendingFiles(p => p.filter((_, i) => i !== idx))
  const removeExisting = (path: string) => setAttachments(a => a.filter(x => x.path !== path))

  const handleAttachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(addPendingFile)
    ;(e.target as HTMLInputElement).value = ''
  }

  // ── AI import ─────────────────────────────────────────────────────────────────
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [aiMessage, setAiMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    ;(e.target as HTMLInputElement).value = ''
    if (!file) return
    if (file.size > MAX_AI_MB * 1024 * 1024) { setAiStatus('error'); setAiMessage(`Fichier trop volumineux (max ${MAX_AI_MB} Mo)`); return }

    setAiStatus('loading'); setAiMessage(file.name)
    try {
      const base64 = await fileToBase64(file)
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { fileBase64: base64, mediaType: file.type, interventionType: type },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      if (data.title)       setTitle(data.title)
      if (data.date)        setDate(data.date)
      if (data.mileage)     setMileage(String(data.mileage))
      if (data.cost)        setCost(String(data.cost))
      if (data.garage)      setGarage(data.garage)
      if (data.description) setDescription(data.description)

      if (data.metadata && type === 'ct') {
        setCt(c => ({ ...c, ...data.metadata, counterVisitRequired: data.metadata.result === 'unfavorable' }))
      }
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        setTags(data.tags as InterventionTag[])
      }
      if (Array.isArray(data.parts) && data.parts.length > 0) {
        setParts(data.parts.map((p: Part) => ({ name: p.name ?? '', brand: p.brand ?? '', reference: p.reference ?? '', lineType: (p.lineType ?? 'part') as PartType, vat: p.vat ?? 20, price: p.price ?? undefined, priceTtc: p.priceTtc ?? undefined })))
      }

      // Auto-attach the analyzed file
      addPendingFile(file)
      setAiStatus('success')
    } catch (err) {
      setAiStatus('error')
      setAiMessage(err instanceof Error ? err.message : "Erreur lors de l'analyse")
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date().toISOString()
    const interventionId = initial?.id ?? uuidv4()
    const cleanParts = parts.filter(p => p.name.trim())

    // Upload pending files
    let uploadedAttachments: Attachment[] = []
    if (pendingFiles.length > 0) {
      setIsUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        for (const file of pendingFiles) {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${user.id}/${interventionId}/${Date.now()}_${safeName}`
          const { error } = await supabase.storage
            .from('intervention-attachments')
            .upload(path, file)
          if (!error) {
            uploadedAttachments.push({
              name: file.name,
              path,
              mimeType: file.type,
              size: file.size,
              uploadedAt: now,
            })
          }
        }
      }
      setIsUploading(false)
    }

    const allAttachments = [...attachments, ...uploadedAttachments]

    onSave({
      id: interventionId,
      vehicleId,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      mileage: parseInt(mileage) || 0,
      cost: cost ? parseFloat(cost) : undefined,
      garage: garage.trim() || undefined,
      parts: cleanParts.length > 0 ? cleanParts : undefined,
      tags: type === 'intervention' && tags.length > 0 ? tags : undefined,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      metadata: type === 'ct' ? ct : undefined,
      createdAt: initial?.createdAt ?? now,
    })
  }

  const isAnalyzing = aiStatus === 'loading'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Type header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white border-2 ${typeOption.bg.split(' ').find(c => c.startsWith('border-')) ?? ''}`}>
          <Icon className={`w-5 h-5 ${typeOption.color}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${typeOption.color}`}>{typeOption.label}</p>
          <p className="text-xs text-gray-400 leading-snug">{typeOption.description}</p>
        </div>
        {!initial && (
          <button type="button" onClick={onChangeType}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Changer
          </button>
        )}
      </div>

      {/* ── Tags (intervention only) ─────────────────────────────────────────── */}
      {type === 'intervention' && (
        <div>
          <p className="form-label mb-2">Tags thématiques</p>
          <div className="flex flex-wrap gap-2">
            {TAG_CONFIG.map(({ tag, label, color, bg }) => {
              const selected = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                    ${selected ? `${bg} ${color} border-current` : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── AI import ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900">Analyse IA — {INTERVENTION_LABELS[type]}</p>
            <p className="text-xs text-blue-500 mt-0.5">Importez une facture ou un document pour pré-remplir le formulaire automatiquement.</p>
            {aiStatus === 'idle' && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Importer un document
              </button>
            )}
            {aiStatus === 'loading' && (
              <div className="mt-2.5 flex items-center gap-2 text-xs text-blue-700">
                <span className="inline-block w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin shrink-0" />
                Analyse de <span className="font-medium ml-1">{aiMessage}</span>…
              </div>
            )}
            {aiStatus === 'success' && (
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Formulaire pré-rempli. Vérifiez et ajustez si besoin.
                </div>
                <button type="button" onClick={() => { setAiStatus('idle'); fileInputRef.current?.click() }}
                  className="text-xs text-blue-600 hover:underline shrink-0">Réimporter</button>
              </div>
            )}
            {aiStatus === 'error' && (
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {aiMessage}
                </div>
                <button type="button" onClick={() => { setAiStatus('idle'); fileInputRef.current?.click() }}
                  className="p-1 rounded hover:bg-red-100 text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept={AI_ACCEPTED} className="hidden"
          onChange={handleFileChange} disabled={isAnalyzing} />
      </div>

      {/* ── Vehicle selector ─────────────────────────────────────────────────── */}
      {vehicles.length > 1 && (
        <div>
          <label className="form-label">Véhicule *</label>
          <select className="form-select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>)}
          </select>
        </div>
      )}

      {/* ── Title + Date ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Intitulé *</label>
          <input className="form-input" required value={title}
            placeholder={type === 'ct' ? 'Contrôle technique' : type === 'intervention' ? 'Vidange + filtres, Freinage AV…' : 'Description courte'}
            onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" required value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* ── CT specific ──────────────────────────────────────────────────────── */}
      {type === 'ct' && (
        <fieldset className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <legend className="text-sm font-semibold text-indigo-900 px-1">Résultat du contrôle technique</legend>
          <div className="grid grid-cols-3 gap-2">
            {CT_RESULTS.map(r => {
              const RIcon = r.icon
              const selected = ct.result === r.value
              return (
                <button key={r.value} type="button" onClick={() => handleCtResult(r.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
                    ${selected ? `${r.bg} ${r.color} border-current shadow-sm` : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                  <RIcon className="w-6 h-6" />
                  <span className="text-xs font-semibold leading-tight">{r.label}</span>
                  <span className="text-xs leading-tight opacity-75">{r.sub}</span>
                </button>
              )
            })}
          </div>
          {ct.result === 'unfavorable' && (
            <div>
              <label className="form-label">Date limite de contre-visite</label>
              <input className="form-input" type="date" value={ct.counterVisitDeadline ?? ''}
                onChange={e => setCt(m => ({ ...m, counterVisitDeadline: e.target.value || undefined }))} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Prochaine échéance CT</label>
              <input className="form-input" type="date" value={ct.nextCtDate ?? ''}
                onChange={e => setCt(m => ({ ...m, nextCtDate: e.target.value || undefined }))} />
            </div>
            <div>
              <label className="form-label">N° de procès-verbal</label>
              <input className="form-input" placeholder="2024-FR-000123" value={ct.reportNumber ?? ''}
                onChange={e => setCt(m => ({ ...m, reportNumber: e.target.value || undefined }))} />
            </div>
          </div>
        </fieldset>
      )}

      {/* ── Mileage + Cost ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Kilométrage</label>
          <input className="form-input" type="number" min={0} placeholder="km"
            value={mileage} onChange={e => setMileage(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Coût total (€)</label>
          <input className="form-input" type="number" min={0} step="0.01" placeholder="0.00"
            value={cost} onChange={e => setCost(e.target.value)} />
        </div>
      </div>

      {/* ── Garage ───────────────────────────────────────────────────────────── */}
      <div>
        <label className="form-label">{type === 'ct' ? 'Centre de contrôle' : 'Garage / Atelier'}</label>
        <input className="form-input"
          placeholder={type === 'ct' ? 'Centre Autovision, Dekra…' : 'Garage Dupont…'}
          value={garage} onChange={e => setGarage(e.target.value)} />
      </div>

      {/* ── Parts / labor list (intervention only) ──────────────────────────── */}
      {type === 'intervention' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="form-label mb-0">Détail des frais</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={dynamicPricing} onChange={e => setDynamicPricing(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600" />
                <span className="text-xs text-gray-500">Prix dynamique</span>
              </label>
              <button type="button" onClick={addPart} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {parts.length > 0 && (
            <div className="grid grid-cols-[110px_1fr_1fr_96px_64px_100px_auto] gap-2 mb-1">
              {['Type', 'Désignation', 'Marque', 'HT (€)', 'TVA %', 'TTC (€)', ''].map(h => (
                <p key={h} className="text-xs text-gray-400 px-1">{h}</p>
              ))}
            </div>
          )}

          {parts.map((part, i) => {
            if (part.lineType === 'discount') {
              return (
                <div key={i} className="grid grid-cols-[110px_1fr_100px_auto] gap-2 mb-2">
                  <select className="form-select text-xs" value="discount"
                    onChange={e => updatePart(i, 'lineType', e.target.value)}>
                    {PART_TYPE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input className="form-input" placeholder="Remise fidélité, coupon…" value={part.name}
                    onChange={e => updatePart(i, 'name', e.target.value)} />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-red-500 font-semibold pointer-events-none">−</span>
                    <input className="form-input text-right tabular-nums pl-5 text-red-600" type="number" min={0} step="0.01" placeholder="0.00"
                      value={part.price ?? ''} onChange={e => updatePart(i, 'price', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removePart(i)} className="p-2 text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            }
            return (
              <div key={i} className="grid grid-cols-[110px_1fr_1fr_96px_64px_100px_auto] gap-2 mb-2">
                <select className="form-select text-xs" value={part.lineType ?? 'part'}
                  onChange={e => updatePart(i, 'lineType', e.target.value)}>
                  {PART_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input className="form-input" placeholder={part.lineType === 'labor' ? 'Pose, diagnostic…' : 'Amortisseur AV…'} value={part.name}
                  onChange={e => updatePart(i, 'name', e.target.value)} />
                <input className="form-input" placeholder="Monroe" value={part.brand ?? ''}
                  onChange={e => updatePart(i, 'brand', e.target.value)} />
                <input className="form-input text-right tabular-nums" type="number" min={0} step="0.01" placeholder="0.00"
                  value={part.price ?? ''} onChange={e => updatePart(i, 'price', e.target.value)} />
                <input className="form-input text-right tabular-nums" type="number" min={0} max={100} step="0.1" placeholder="20"
                  value={part.vat ?? ''} onChange={e => updatePart(i, 'vat', e.target.value)} />
                <input className="form-input text-right tabular-nums" type="number" min={0} step="0.01" placeholder="0.00"
                  value={part.priceTtc ?? ''} onChange={e => updatePart(i, 'priceTtc', e.target.value)} />
                <button type="button" onClick={() => removePart(i)} className="p-2 text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}

          {parts.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">Aucun frais — ajoutez pièces, main d'œuvre, fluides…</p>
          )}

          {parts.filter(p => p.name.trim()).length > 0 && (() => {
            const totalTtc = parts.filter(p => p.name.trim()).reduce((sum, p) => {
              if (p.lineType === 'discount') return sum - (p.price ?? 0)
              return sum + (p.priceTtc ?? (p.price != null ? round2(p.price * (1 + (p.vat ?? 0) / 100)) : 0))
            }, 0)
            const costVal = cost ? parseFloat(cost) : null
            const diff = costVal != null ? round2(totalTtc - costVal) : null
            const matches = diff != null && Math.abs(diff) < 0.01
            return (
              <div className="mt-1 pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Total des frais</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-gray-900">{round2(totalTtc).toFixed(2)} € TTC</span>
                  {diff !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${matches ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {matches ? '= Coût total' : `${diff > 0 ? '+' : ''}${diff.toFixed(2)} € vs coût total`}
                    </span>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Notes / Description ──────────────────────────────────────────────── */}
      <div>
        <label className="form-label">
          {type === 'ct' ? 'Défaillances / Observations du contrôleur' : 'Description / Observations'}
        </label>
        <textarea className="form-textarea" rows={3} value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={
            type === 'ct'           ? 'Défaillances constatées, recommandations du contrôleur…'
            : type === 'intervention' ? 'Vidange 5W40 Castrol, remplacement filtre air et filtre habitacle, pneus été Michelin 205/55R16…'
            : 'Observations, remarques…'
          } />
      </div>

      {/* ── Attachments ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5" /> Pièces jointes
          </label>
          <button type="button" onClick={() => attachInputRef.current?.click()}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>
        <input ref={attachInputRef} type="file" accept={ATTACH_ACCEPTED} multiple className="hidden"
          onChange={handleAttachChange} />

        {(attachments.length > 0 || pendingFiles.length > 0) ? (
          <div className="space-y-1.5">
            {attachments.map(att => {
              const Icon = fileIcon(att.mimeType)
              return (
                <div key={att.path} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-700 flex-1 truncate">{att.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatSize(att.size)}</span>
                  <button type="button" onClick={() => removeExisting(att.path)}
                    className="p-0.5 text-gray-400 hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
            {pendingFiles.map((file, i) => {
              const Icon = fileIcon(file.type)
              return (
                <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-xs text-blue-700 flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-blue-400 shrink-0">{formatSize(file.size)}</span>
                  <button type="button" onClick={() => removePending(i)}
                    className="p-0.5 text-blue-400 hover:text-red-500 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
            Aucune pièce jointe — factures, photos, rapports…
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel} disabled={isSaving || isAnalyzing || isUploading}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={isSaving || isAnalyzing || isUploading}>
          {isUploading
            ? <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Envoi…</>
            : isSaving
            ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : initial ? 'Mettre à jour' : "Enregistrer l'intervention"
          }
        </button>
      </div>
    </form>
  )
}
