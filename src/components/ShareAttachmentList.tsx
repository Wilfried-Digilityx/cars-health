import { useEffect, useState } from 'react'
import { FileText, ImageIcon, File, Download, Paperclip } from 'lucide-react'
import type { Attachment } from '../types'
import { supabase } from '../lib/supabase'

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return File
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

interface Props {
  attachments: Attachment[]
}

export default function ShareAttachmentList({ attachments }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!attachments.length) return
    let cancelled = false

    async function loadUrls() {
      const result: Record<string, string> = {}
      for (const att of attachments) {
        // Try signed URL first (works if RLS allows anon), fallback to public URL
        const { data: signed } = await supabase.storage
          .from('intervention-attachments')
          .createSignedUrl(att.path, 3600)

        if (signed?.signedUrl) {
          result[att.path] = signed.signedUrl
        } else {
          const { data: pub } = supabase.storage
            .from('intervention-attachments')
            .getPublicUrl(att.path)
          if (pub?.publicUrl) result[att.path] = pub.publicUrl
        }
      }
      if (!cancelled) setUrls(result)
    }

    loadUrls()
    return () => { cancelled = true }
  }, [attachments])

  if (!attachments.length) return null

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-400 flex items-center gap-1 mb-1.5">
        <Paperclip className="w-3 h-3" /> {attachments.length} pièce{attachments.length > 1 ? 's' : ''} jointe{attachments.length > 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {attachments.map(att => {
          const Icon = fileIcon(att.mimeType)
          const url = urls[att.path]
          return (
            <a
              key={att.path}
              href={url ?? '#'}
              download={att.name}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { if (!url) e.preventDefault() }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors
                ${url
                  ? 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
                  : 'bg-gray-50 border-gray-100 text-gray-400 cursor-default'
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="max-w-[120px] truncate">{att.name}</span>
              <span className="text-gray-400 shrink-0">{formatSize(att.size)}</span>
              {url && <Download className="w-3 h-3 shrink-0 opacity-50" />}
            </a>
          )
        })}
      </div>
    </div>
  )
}
