export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'lpg'

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate: string
  mileage: number
  color?: string
  fuelType: FuelType
  purchaseDate?: string
  notes?: string
  shareToken?: string
  isShareEnabled: boolean
  aiSummary?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type InterventionType = 'intervention' | 'ct' | 'other'

export type InterventionTag =
  | 'vidange'
  | 'pneumatiques'
  | 'freinage'
  | 'revision'
  | 'reparation'
  | 'carrosserie'
  | 'electrique'
  | 'piece'

export type CtResult = 'favorable' | 'favorable_minor' | 'unfavorable'

export interface CtMetadata {
  result: CtResult
  counterVisitRequired: boolean
  counterVisitDeadline?: string
  nextCtDate?: string
  reportNumber?: string
}

export type InterventionMetadata = CtMetadata

export type PartType = 'part' | 'labor' | 'fluid' | 'discount' | 'other'

export interface Part {
  name: string
  lineType?: PartType
  reference?: string
  brand?: string
  quantity?: number
  vat?: number
  price?: number     // Prix HT
  priceTtc?: number  // Prix TTC
}

export interface Attachment {
  name: string
  path: string
  mimeType: string
  size: number
  uploadedAt: string
}

export interface Intervention {
  id: string
  vehicleId: string
  type: InterventionType
  title: string
  description?: string
  date: string
  mileage: number
  cost?: number
  garage?: string
  technician?: string
  parts?: Part[]
  tags?: InterventionTag[]
  attachments?: Attachment[]
  nextServiceMileage?: number
  nextServiceDate?: string
  metadata?: InterventionMetadata
  createdAt: string
}

export type AlertTriggerType = 'mileage' | 'date' | 'both'

export interface Alert {
  id: string
  vehicleId: string
  triggerType: AlertTriggerType
  title: string
  description?: string
  triggerMileage?: number
  triggerDate?: string
  intervalMileage?: number
  intervalDays?: number
  isActive: boolean
  isDismissed: boolean
  lastTriggeredDate?: string
  lastTriggeredMileage?: number
  createdAt: string
}

export interface AppData {
  vehicles: Vehicle[]
  interventions: Intervention[]
  alerts: Alert[]
}
