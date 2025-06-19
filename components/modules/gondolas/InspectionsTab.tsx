import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { Inspection } from '@/types/inspection'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateDMY } from '@/app/utils/formatDate'

export default function InspectionsTab ({ gondolaId }: { gondolaId: string }) {


  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] =
    useState<Inspection | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewInspection, setViewInspection] = useState<Inspection | null>(null)
  const [form, setForm] = useState({
    inspectionType: '',
    inspectionDate: '',
    inspectionTime: '09:00',
    inspector: '',
    priority: '',
    notes: ''
  })

  // Dedicated edit form state for editing
  const [editForm, setEditForm] = useState({
    type: '',
    date: '',
    time: '',
    inspector: '',
    priority: '',
    notes: '',
    notifyClient: 'false' // must be string for Inspection type
  })
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const {
    inspections,
    inspectionsLoading,
    inspectionsError,
    fetchInspectionsByGondolaId,
    updateInspection
  } = useAppStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (gondolaId) fetchInspectionsByGondolaId(gondolaId)
  }, [gondolaId])

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleScheduleInspection = async () => {
    if (!form.inspectionType || !form.inspectionDate || !form.inspectionTime) {
      toast.error('Missing required fields', {
        description:
          'Please fill in all required fields to schedule an inspection.',
        className: 'bg-destructive text-destructive-foreground'
      })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/schedule-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionType: form.inspectionType,
          inspectionDate: form.inspectionDate,
          inspectionTime: form.inspectionTime,
          time: form.inspectionTime, // send time field
          inspector: form.inspector,
          priority: form.priority,
          notes: form.notes
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to schedule inspection')
      }

      toast.success(`Inspection scheduled!`, {
        description: `Inspection scheduled for ${form.inspectionDate} at ${form.inspectionTime}.`,
        className: 'bg-[#14A44D] text-white'
      })

      setForm({
        inspectionType: '',
        inspectionDate: '',
        inspectionTime: '09:00',
        inspector: '',
        priority: '',
        notes: ''
      })
      setUploadDialogOpen(false)
      fetchInspectionsByGondolaId(gondolaId)
      setLoading(false)
    } catch (err: any) {
      toast.error('Failed to schedule inspection', {
        description: err.message,
        className: 'bg-destructive text-destructive-foreground'
      })
      setLoading(false)
    }
  }
  const handleViewInspection = (inspection: Inspection) => {
    setViewInspection(inspection)
    setIsViewDialogOpen(true)
  }

  const columns: ColumnDef<Inspection>[] = [
    {
      header: 'Inspection ID',
      accessorKey: 'id',
      cell: ({ row }) => row.original.id?.slice(0, 10)
    },
    {
      header: 'Type',
      accessorKey: 'type'
    },
    {
      header: 'Date',
      accessorKey: 'date',
      cell: ({ row }) =>
        row.original.date
          ? formatDateDMY(new Date(row.original.date).toLocaleDateString())
          : ''
    },
    {
      header: 'Inspector',
      accessorKey: 'inspector',
      cell: ({ row }) => row.original.inspector || 'Not Assigned'
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.original.priority === 'urgent'
              ? 'bg-red-100 text-red-800'
              : row.original.priority === 'high'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {row.original.priority
            ? row.original.priority.charAt(0).toUpperCase() +
              row.original.priority.slice(1)
            : 'Normal'}
        </span>
      )
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => {
        const now = new Date()
        const inspDate = row.original.date ? new Date(row.original.date) : null
        if (inspDate && inspDate > now) {
          return (
            <span className='text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full'>
              Scheduled
            </span>
          )
        } else {
          return (
            <span className='text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full'>
              Completed
            </span>
          )
        }
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const insp = row.original
        const now = new Date()
        const inspDate = insp.date ? new Date(insp.date) : null
        return (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleViewInspection(insp)}
            >
              View
            </Button>
            {inspDate && inspDate > now && (
              <Button
                onClick={() => {
                  setSelectedInspection(insp)
                  setEditForm({
                    type: insp.type || '',
                    date: insp.date ? insp.date.split('T')[0] : '',
                    time:
                      insp.time ||
                      (insp.date && insp.date.includes('T')
                        ? insp.date.split('T')[1].slice(0, 5)
                        : ''),
                    inspector: insp.inspector || '',
                    priority: insp.priority || '',
                    notes: insp.notes || '',
                    notifyClient:
                      typeof insp.notifyClient === 'string'
                        ? insp.notifyClient
                        : insp.notifyClient
                        ? 'true'
                        : 'false'
                  })
                  setIsEditDialogOpen(true)
                }}
                variant='outline'
                size='sm'
              >
                Edit
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleDeleteInspection(insp)}
            >
              Delete
            </Button>
          </div>
        )
      }
    }
  ]
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<any>(null);

  const handleDeleteInspection = (inspection: any) => {
    setInspectionToDelete(inspection);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteInspection = async () => {
    if (!inspectionToDelete) return;
    try {
      const res = await fetch(`/api/gondola/${inspectionToDelete.gondolaId}/inspections/${inspectionToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete inspection');
      toast.success('Inspection deleted successfully');
      setDeleteDialogOpen(false);
      setInspectionToDelete(null);
      if (typeof fetchInspectionsByGondolaId === 'function') fetchInspectionsByGondolaId(inspectionToDelete.gondolaId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete inspection');
    }
  }
  const handleEditInspection = async () => {
    // Compose ISO string for date+time

    // Only send allowed fields
    const payload = {
      type: editForm.type,
      date: editForm.date,
      time: editForm.time, // send time field
      inspector: editForm.inspector,
      priority: editForm.priority,
      notes: editForm.notes,
      notifyClient: editForm.notifyClient || 'false'
    }
    try {
      const ok = await updateInspection({
        id: selectedInspection?.id ?? '',
        gondolaId: selectedInspection?.gondolaId ?? '',
        createdAt: selectedInspection?.createdAt ?? '',
        ...payload
      })
      if (ok) {
        toast.success('Inspection updated!', {
          className: 'bg-[#14A44D] text-white'
        })
        setIsEditDialogOpen(false)
        setSelectedInspection(null)
      } else {
        toast.error('Failed to update inspection', {
          className: 'bg-destructive text-destructive-foreground'
        })
      }
    } catch (err: any) {
      toast.error('Failed to update inspection', {
        description: err.message,
        className: 'bg-destructive text-destructive-foreground'
      })
    }
  }

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-6 border-b flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-semibold'>Inspections</h2>
            <p className='text-foreground'>
              Inspection history and upcoming inspections
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Schedule Inspection</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Schedule Inspection</DialogTitle>
                <DialogDescription>
                  Schedule a new inspection for {gondolaId}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='inspectionType'>Inspection Type *</Label>
                  <Select
                    name='inspectionType'
                    value={form.inspectionType}
                    onValueChange={v => handleFormChange('inspectionType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select inspection type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Monthly'>
                        Monthly Inspection
                      </SelectItem>
                      <SelectItem value='Quarterly'>
                        Quarterly Inspection
                      </SelectItem>
                      <SelectItem value='Annual'>Annual Inspection</SelectItem>
                      <SelectItem value='Maintenance'>
                        Maintenance Inspection
                      </SelectItem>
                      <SelectItem value='Safety'>Safety Inspection</SelectItem>
                      <SelectItem value='Pre Deployment'>
                        Pre-Deployment Inspection
                      </SelectItem>
                      <SelectItem value='Post Deployment'>
                        Post-Deployment Inspection
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='inspectionDate'>Inspection Date *</Label>
                  <Input
                    id='inspectionDate'
                    type='date'
                    min={new Date().toISOString().split('T')[0]}
                    required
                    value={form.inspectionDate}
                    onChange={e =>
                      handleFormChange('inspectionDate', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='inspectionTime'>Inspection Time *</Label>
                  <Input
                    id='inspectionTime'
                    type='time'
                    required
                    value={form.inspectionTime}
                    onChange={e =>
                      handleFormChange('inspectionTime', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='inspector'>Inspector</Label>
                 
                  <Input
                    name='inspector'
                    required
                    value={form.inspector}
                    onChange={e =>
                      handleFormChange('inspector', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='priority'>Priority</Label>
                  <Select
                    name='priority'
                    value={form.priority}
                    onValueChange={v => handleFormChange('priority', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='low'>Low</SelectItem>
                      <SelectItem value='normal'>Normal</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='urgent'>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='inspectionNotes'>Notes</Label>
                  <Input
                    id='inspectionNotes'
                    placeholder='Any special requirements or notes for this inspection'
                    value={form.notes}
                    onChange={e => handleFormChange('notes', e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={()=>setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={handleScheduleInspection}
                  disabled={loading}
                >
                  {loading ? 'Scheduling' : 'Schedule Inspection'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className='overflow-x-auto'>
          {/* DataTable columns definition */}
          {(() => {
            if (inspectionsLoading) {
              return <div className='p-4 text-center'>Loading inspections…</div>
            }
            if (inspectionsError) {
              return (
                <div className='p-4 text-center text-red-600'>
                  {inspectionsError}
                </div>
              )
            }
            if (inspections.length === 0) {
              return (
                <div className='p-4 text-center'>No inspections found.</div>
              )
            }
            return <DataTable columns={columns} data={inspections} />
                      })()}
                    </div>

        {/* Edit Inspection Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Edit Inspection</DialogTitle>
              <DialogDescription>
                Edit inspection details for {selectedInspection?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedInspection && (
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='editInspectionType'>Inspection Type *</Label>
                  <Select
                    name='editInspectionType'
                    value={editForm.type}
                    onValueChange={v => setEditForm(f => ({ ...f, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select inspection type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Monthly'>
                        Monthly Inspection
                      </SelectItem>
                      <SelectItem value='Quarterly'>
                        Quarterly Inspection
                      </SelectItem>
                      <SelectItem value='Annual'>Annual Inspection</SelectItem>
                      <SelectItem value='Maintenance'>
                        Maintenance Inspection
                      </SelectItem>
                      <SelectItem value='Safety'>Safety Inspection</SelectItem>
                      <SelectItem value='Pre Deployment'>
                        Pre-Deployment Inspection
                      </SelectItem>
                      <SelectItem value='Post Deployment'>
                        Post-Deployment Inspection
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editInspectionDate'>Inspection Date *</Label>
                  <Input
                    id='editInspectionDate'
                    type='date'
                    value={editForm.date}
                    onChange={e =>
                      setEditForm(f => ({ ...f, date: e.target.value }))
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='time'>Inspection Time *</Label>
                  <Input
                    id='time'
                    type='time'
                    value={editForm.time}
                    onChange={e =>
                      setEditForm(f => ({ ...f, time: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editInspector'>Inspector</Label>
                  <Input
                    name='inspector'
                    required
                    value={editForm.inspector}
                    onChange={e =>
                      setEditForm(f => ({ ...f, inspector: e.target.value }))
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editPriority'>Priority</Label>
                  <Select
                    name='editPriority'
                    value={editForm.priority}
                    onValueChange={v =>
                      setEditForm(f => ({ ...f, priority: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='low'>Low</SelectItem>
                      <SelectItem value='normal'>Normal</SelectItem>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='urgent'>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editInspectionNotes'>Notes</Label>
                  <Input
                    id='editInspectionNotes'
                    placeholder='Any special requirements or notes for this inspection'
                    defaultValue={selectedInspection.notes}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedInspection(null)
                }}
              >
                Cancel
              </Button>
              <Button type='submit' onClick={handleEditInspection}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Inspection Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Inspection Details</DialogTitle>
              <DialogDescription>
                View complete inspection information for {viewInspection?.id}
              </DialogDescription>
            </DialogHeader>
            {viewInspection && (
              <div className='grid gap-6 py-4 max-h-[60vh] overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Inspection ID
                    </Label>
                    <p className='font-medium'>
                      {viewInspection.id?.slice(0, 10)}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Gondola ID
                    </Label>
                    <p className='font-medium'>
                      {viewInspection.gondolaId?.slice(0, 10)}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Inspection Type
                    </Label>
                    <p className='font-medium capitalize'>
                      {viewInspection.type}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Status
                    </Label>
                    {(() => {
                      const now = new Date('2025-06-05T22:42:55+06:30')
                      const inspDate = viewInspection.date
                        ? new Date(viewInspection.date)
                        : null
                      if (inspDate && inspDate > now) {
                        return (
                          <p className='px-2 py-1 text-xs w-fit font-medium rounded-full bg-blue-100 text-blue-800'>
                            Scheduled
                          </p>
                        )
                      } else {
                        return (
                          <p className='px-2 py-1 text-xs w-fit font-medium rounded-full bg-green-100 text-green-800'>
                            Completed
                          </p>
                        )
                      }
                    })()}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Scheduled Date
                    </Label>
                    <p className='font-medium'>
                      {formatDateDMY(viewInspection.date?.split('T')[0])}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Scheduled Time
                    </Label>
                    <p className='font-medium'>
                      {viewInspection?.time ||
                        (viewInspection?.date &&
                        viewInspection.date.includes('T')
                          ? viewInspection.date.split('T')[1].slice(0, 5)
                          : '-')}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Inspector
                    </Label>
                    <p className='font-medium'>{viewInspection.inspector}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Priority
                    </Label>
                    <p className='font-medium'>{viewInspection.priority}</p>
                  </div>
                  {viewInspection.status === 'Completed' && (
                    <>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-foreground'>
                          Completed Date
                        </Label>
                        <p className='font-medium'>
                          {viewInspection.completedDate}
                        </p>
                      </div>
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium text-foreground'>
                          Duration
                        </Label>
                        <p className='font-medium'>{viewInspection.duration}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Notes
                  </Label>
                  {viewInspection?.notes ? (
                    <div className='p-3 bg-background border rounded-md'>
                      <p className='text-sm'>{viewInspection.notes}</p>
                    </div>
                  ) : (
                    <div>-</div>
                  )}
                </div>
                {(() => {
                  // Use same logic as status display for determining if editable
                  const now = new Date('2025-06-06T09:45:00+06:30') // use current local time
                  const inspDate = viewInspection?.date
                    ? new Date(viewInspection.date)
                    : null
                  if (inspDate && inspDate < now) {
                    return (
                      <>
                        <div className='space-y-2'>
                          <Label className='text-sm font-medium text-foreground'>
                            Inspection Findings
                          </Label>
                          <div className='p-3 bg-blue-50 border border-blue-200 rounded-md'>
                            <p className='text-sm text-blue-900'>
                              {viewInspection.findings}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-2'>
                          <Label className='text-sm font-medium text-foreground'>
                            Recommendations
                          </Label>
                          <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                            <p className='text-sm text-yellow-900'>
                              {viewInspection.recommendations}
                            </p>
                          </div>
                        </div>
                      </>
                    )
                  }
                  return null
                })()}
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsViewDialogOpen(false)
                  setViewInspection(null)
                }}
              >
                Close
              </Button>
              {/* {(() => {
                // Use same logic as status display for determining if editable
                const now = new Date("2025-06-06T09:45:00+06:30"); // use current local time
                const inspDate = viewInspection?.date ? new Date(viewInspection.date) : null;
                if (inspDate && inspDate > now) {
                  return (
                    <Button onClick={handleEditInspection}>
                      Edit Inspection
                    </Button>
                  );
                }
                return null;
              })()} */}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Delete Inspection</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete <span className="font-semibold">{inspectionToDelete?.type}</span>? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmDeleteInspection}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
      </CardContent>
    </Card>
  )
}
