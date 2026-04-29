import { Wrench, ShieldCheck, MoreHorizontal } from 'lucide-react'
import type { InterventionType } from '../types'

interface TypeOption {
  type: InterventionType
  icon: typeof Wrench
  label: string
  description: string
  color: string
  bg: string
}

const OPTIONS: TypeOption[] = [
  {
    type: 'intervention',
    icon: Wrench,
    label: 'Intervention',
    description: "Vidange, pneumatiques, freinage, réparation, carrosserie, électronique… tout type d'entretien ou de réparation",
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  },
  {
    type: 'ct',
    icon: ShieldCheck,
    label: 'Contrôle technique',
    description: 'Résultat (favorable / défavorable), contre-visite, N° de procès-verbal, prochaine échéance',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
  },
  {
    type: 'other',
    icon: MoreHorizontal,
    label: 'Autre',
    description: 'Toute autre opération ne rentrant dans aucune des catégories ci-dessus',
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200 hover:border-gray-400',
  },
]

interface Props {
  onSelect: (type: InterventionType) => void
}

export default function InterventionTypeSelector({ onSelect }: Props) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Quelle est la nature de l'intervention ?</p>
      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ type, icon: Icon, label, description, color, bg }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${bg}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`font-semibold text-sm ${color}`}>{label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { OPTIONS }
