import { DialogTrigger } from '@/components/ui/dialog'
import { DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import RepairLogForm from './RepairLogForm'
import { DataTable } from '@/components/common/data-table'
import type { ColumnDef } from '@tanstack/react-table'

export default function MaintenanceAdhocTab ({
  gondolaId
}: {
  gondolaId: string
}) {
  const [isRepairDialogOpen, setIsRepairDialogOpen] = useState(false)
  const [isViewRepairDialogOpen, setIsViewRepairDialogOpen] = useState(false)
  const [selectedRepairLog, setSelectedRepairLog] = useState<any>(null)
  const [repairLogs, setRepairLogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // DataTable columns for repair logs
  const columns: ColumnDef<any>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      cell: ({ row }) => row.original.id?.slice(0, 10)
    },
    {
      header: 'Date',
      accessorKey: 'date'
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.original.type === 'Repair'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {row.original.type}
        </span>
      )
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <div>
          <p className='font-medium'>{row.original.description}</p>
          <p className='text-sm text-foreground'>{row.original.partName}</p>
        </div>
      )
    },
    {
      header: 'Cost',
      accessorKey: 'cost',
      cell: ({ row }) => `$${row.original.cost}`
    },
    {
      header: 'Chargeable',
      accessorKey: 'isChargeable',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.original.isChargeable
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.original.isChargeable ? 'Chargeable' : 'Non-Chargeable'}
        </span>
      )
    },
    {
      header: 'Technician',
      accessorKey: 'technician'
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setSelectedRepairLog(row.original)
            setIsViewRepairDialogOpen(true)
          }}
        >
          View Details
        </Button>
      )
    }
  ]

  // Fetch repair logs from backend
  const fetchRepairLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/repair-logs`)
      if (!res.ok)
        throw new Error(
          (await res.json()).error || 'Failed to fetch repair logs'
        )
      const data = await res.json()
      setRepairLogs(data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repair logs')
      setRepairLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (gondolaId) fetchRepairLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gondolaId])

  // Add repair log to backend
  const handleAddRepairLog = async (newRepair: any) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/repair-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepair)
      })
      if (!res.ok)
        throw new Error((await res.json()).error || 'Failed to add repair log')
      await fetchRepairLogs()
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add repair log')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-6 border-b flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-semibold'>Adhoc Deployment</h2>
            <p className='text-foreground'>
              Log repairs, part replacements, and manage chargeable costs for{' '}
              {gondolaId}
            </p>
          </div>
          <div className='flex gap-2'>
            <Dialog
              open={isRepairDialogOpen}
              onOpenChange={setIsRepairDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>Log Repair</Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px]'>
                <DialogHeader>
                  <DialogTitle>Log Repair or Part Replacement</DialogTitle>
                  <DialogDescription>
                    Record repair work or part replacement for {gondolaId}
                  </DialogDescription>
                </DialogHeader>
                <RepairLogForm
                  gondolaId={gondolaId}
                  onClose={() => setIsRepairDialogOpen(false)}
                  onSubmit={handleAddRepairLog}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>
            Repair & Part Replacement Log
          </h3>
          {repairLogs.length > 0 ? (
            <div className='overflow-x-auto mb-8'>
              <DataTable
                columns={columns}
                data={repairLogs}
                loading={loading}
              />
            </div>
          ) : loading ? (
            <div className='text-center'>Loading ...</div>
          ) : (
            <div className='text-center py-8 text-foreground mb-8'>
              <p>No repair logs found for this gondola.</p>
              <p className='text-sm mt-2'>
                Click "Log Repair/Part" to record repair work or part
                replacements.
              </p>
            </div>
          )}
        </div>

        {/* View Repair Log Dialog */}
        <Dialog
          open={isViewRepairDialogOpen}
          onOpenChange={setIsViewRepairDialogOpen}
        >
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Repair Log Details</DialogTitle>
              <DialogDescription>
                View complete repair information for {selectedRepairLog?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedRepairLog && (
              <div className='grid gap-6 py-4 max-h-[60vh] overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Repair ID
                    </Label>
                    <p className='font-medium'>
                      {selectedRepairLog.id?.slice(0, 10)}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Gondola ID
                    </Label>
                    <p className='font-medium'>{gondolaId?.slice(0, 10)}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Repair Type
                    </Label>
                    <p
                      className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                        selectedRepairLog.type === 'Repair'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {selectedRepairLog.type}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Date
                    </Label>
                    <p className='font-medium'>{selectedRepairLog.date}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Cost
                    </Label>
                    <p className='font-medium'>${selectedRepairLog.cost}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Chargeable
                    </Label>
                    <p
                      className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                        selectedRepairLog.isChargeable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedRepairLog.isChargeable
                        ? 'Chargeable'
                        : 'Non-Chargeable'}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Technician
                    </Label>
                    <p className='font-medium'>
                      {selectedRepairLog.technician}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Status
                    </Label>
                    <p className='font-medium capitalize'>
                      {selectedRepairLog.status}
                    </p>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Description
                  </Label>
                  {selectedRepairLog?.description && (
                    <div className='p-3 bg-background border rounded-md'>
                      <p className='text-sm'>{selectedRepairLog.description}</p>
                    </div>
                  )}
                </div>

                {selectedRepairLog.partName &&
                  selectedRepairLog.partName !== 'N/A' && (
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-foreground'>
                        Part Details
                      </Label>
                      <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
                        <p className='text-sm text-blue-900'>
                          {selectedRepairLog.partName}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                onClick={() => {
                  setIsViewRepairDialogOpen(false)
                  setSelectedRepairLog(null)
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
