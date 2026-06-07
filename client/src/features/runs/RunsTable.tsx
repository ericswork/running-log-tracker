import { useMemo } from 'react'
import {
  type Column,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Run } from '@/api/runs'

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

// Compact date for narrow screens, e.g. "6/6/26, 5:05 PM".
function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function SortHeader({ column, label }: { column: Column<Run, unknown>; label: string }) {
  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

export function RunsTable({
  runs,
  sorting,
  onSortingChange,
  onEdit,
  onDelete,
}: {
  runs: Run[]
  // Sorting is controlled by the parent and applied server-side; the column ids
  // (date, distanceKm, durationSec, type) map to the API sort field.
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  onEdit: (run: Run) => void
  onDelete: (run: Run) => void
}) {
  const columns = useMemo<ColumnDef<Run>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortHeader column={column} label="Date" />,
        cell: ({ row }) => (
          <>
            <span className="md:hidden">{formatDateShort(row.original.date)}</span>
            <span className="hidden md:inline">{formatDateTime(row.original.date)}</span>
          </>
        ),
      },
      {
        accessorKey: 'distanceKm',
        header: ({ column }) => <SortHeader column={column} label="Distance (km)" />,
        cell: ({ row }) => row.original.distanceKm,
      },
      {
        accessorKey: 'durationSec',
        header: ({ column }) => <SortHeader column={column} label="Duration" />,
        cell: ({ row }) => formatDuration(row.original.durationSec),
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <SortHeader column={column} label="Type" />,
        cell: ({ row }) => row.original.type,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {/* Icon-only on mobile (to fit the width), icon + label at md+. */}
            <Button
              variant="outline"
              size="sm"
              aria-label="Edit"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="size-4" />
              <span className="hidden md:inline">Edit</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              aria-label="Delete"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="size-4" />
              <span className="hidden md:inline">Delete</span>
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  )

  const table = useReactTable({
    data: runs,
    columns,
    state: { sorting },
    onSortingChange,
    // Server sorts/pages the data; the table renders the page as-is. Removal is
    // disabled so a column always has a direction (asc/desc, never "unsorted").
    manualSorting: true,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
