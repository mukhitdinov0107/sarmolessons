import { FileText, Image, File, Code, Video, FileSpreadsheet } from "lucide-react"

interface AttachmentIconProps {
  type: string
  className?: string
}

export function AttachmentIcon({ type, className = "h-4 w-4" }: AttachmentIconProps) {
  switch (type.toLowerCase()) {
    case 'pdf':
    case 'document':
      return <FileText className={className} />
    case 'image':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <Image className={className} />
    case 'excel':
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className={className} />
    case 'code':
    case 'zip':
    case 'js':
    case 'ts':
    case 'py':
    case 'java':
      return <Code className={className} />
    case 'video':
    case 'mp4':
    case 'avi':
    case 'mov':
      return <Video className={className} />
    default:
      return <File className={className} />
  }
} 