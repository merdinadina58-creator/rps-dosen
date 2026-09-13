import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export type RpsStatus = 'draft' | 'final' | 'revisi'

const STATUS_LABEL: Record<RpsStatus, string> = {
  draft: 'Draft',
  final: 'Final',
  revisi: 'Revisi',
}

const STATUS_CLASS: Record<RpsStatus, string> = {
  draft: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  final:
    'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  revisi:
    'border-transparent bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (['draft', 'final', 'revisi'].includes(status) ? status : 'draft') as RpsStatus
  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[s], className)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[s]}
    </Badge>
  )
}
