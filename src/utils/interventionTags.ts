import type { InterventionTag } from '../types'

export interface TagConfig {
  tag: InterventionTag
  label: string
  color: string
  bg: string
}

export const TAG_CONFIG: TagConfig[] = [
  { tag: 'vidange',      label: 'Vidange',              color: 'text-amber-700',  bg: 'bg-amber-100  border-amber-300'  },
  { tag: 'pneumatiques', label: 'Pneumatiques',         color: 'text-blue-700',   bg: 'bg-blue-100   border-blue-300'   },
  { tag: 'freinage',     label: 'Freinage',             color: 'text-red-700',    bg: 'bg-red-100    border-red-300'    },
  { tag: 'revision',     label: 'Révision',             color: 'text-green-700',  bg: 'bg-green-100  border-green-300'  },
  { tag: 'reparation',   label: 'Réparation',           color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  { tag: 'carrosserie',  label: 'Carrosserie',          color: 'text-pink-700',   bg: 'bg-pink-100   border-pink-300'   },
  { tag: 'electrique',   label: 'Électrique / Électronique', color: 'text-cyan-700',   bg: 'bg-cyan-100   border-cyan-300'   },
  { tag: 'piece',        label: 'Remplacement de pièce', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
]

export const TAG_MAP = Object.fromEntries(TAG_CONFIG.map(t => [t.tag, t])) as Record<InterventionTag, TagConfig>
