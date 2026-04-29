import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Supprimer',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={onCancel}>Annuler</button>
          <button className="btn-danger flex-1" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Modal>
  )
}
