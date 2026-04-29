import type { InterventionType } from '../types'

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  intervention: 'Intervention',
  ct:           'Contrôle technique',
  other:        'Autre',
}

export const INTERVENTION_COLORS: Record<InterventionType, string> = {
  intervention: 'bg-blue-100 text-blue-800',
  ct:           'bg-indigo-100 text-indigo-800',
  other:        'bg-gray-100 text-gray-800',
}

export const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Essence',
  diesel:   'Diesel',
  electric: 'Électrique',
  hybrid:   'Hybride',
  lpg:      'GPL',
}
