import { RunForm } from '@/components/RunForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Run } from '@/api/runs'

// Shared overlay for both adding (no initialRun) and editing (initialRun set) a
// run. RunForm is rendered only while open so it remounts fresh each time —
// re-prefilling for edit and clearing for add — and onDone closes the dialog
// (RunForm fires onDone after a successful create or edit).
export function RunFormDialog({
  open,
  onOpenChange,
  initialRun,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRun?: Run
  title: string
  description?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open && (
          <RunForm
            key={initialRun?.id ?? 'new'}
            initialRun={initialRun}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
