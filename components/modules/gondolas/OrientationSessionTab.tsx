import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
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
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { formatDateDMY } from '@/app/utils/formatDate'

export default function OrientationSessionTab ({
  gondolaId
}: {
  gondolaId: string
}) {
  // Handler for editing session (Step 2)
  const { updateOrientationSession } = useAppStore()

  const handleEditSessionSave = async () => {
    if (
      editData.session_type &&
      editData.date &&
      editData.time &&
      editData.duration &&
      editData.instructor &&
      editData.location
    ) {
      if (!selectedSession?.id) {
        toast.error('No session selected for editing.')
        return
      }
      const updatedSession = {
        session_type: editData.session_type,
        date: editData.date,
        time: editData.time,
        duration: Number(editData.duration),
        instructor: editData.instructor,
        location: editData.location,
        max_participants: editData.max_participants
          ? Number(editData.max_participants)
          : undefined,
        notes: editData.notes || undefined
      }
      const success = await updateOrientationSession(
        gondolaId,
        selectedSession.id,
        updatedSession
      )
      if (success) {
        toast.success('Session updated successfully!')
        setIsEditSessionDialogOpen(false)
        setSelectedSession(null)
      } else {
        toast.error('Failed to update session. Please try again.')
      }
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  // Controlled state for form fields
  const [sessionType, setSessionType] = useState('')
  const [sessionDate, setSessionDate] = useState('')
  const [sessionTime, setSessionTime] = useState('09:00')
  const [duration, setDuration] = useState('')
  const [instructor, setInstructor] = useState('')
  const [max_participants, setMaxParticipants] = useState('6')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const [isViewSessionDialogOpen, setIsViewSessionDialogOpen] = useState(false)
  const [isEditSessionDialogOpen, setIsEditSessionDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [editData, setEditData] = useState<any>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    orientationSessions,
    orientationSessionsLoading,
    createOrientationSession,
    fetchOrientationSessionsByGondolaId
  } = useAppStore()
  // Compute isCompleted for use in JSX
  let isCompleted = false
  if (selectedSession?.date) {
    const sessionDate = new Date(selectedSession.date)
    const now = new Date('2025-06-06T20:38:46+06:30') // Use fixed or real-time as needed
    isCompleted = sessionDate < now
  }

  // Bind real data from store

  // Handler for scheduling session
  const handleScheduleSession = async () => {
    if (sessionType && sessionDate && sessionTime && duration && instructor) {
      const date = `${sessionDate}T${sessionTime}`
      const success = await createOrientationSession(gondolaId, {
        session_type: sessionType,
        date,
        time: sessionTime,
        notes: notes || undefined,
        instructor,
        max_participants: Number(max_participants),
        duration: Number(duration),
        location: location || undefined
      })
      if (success) {
        setSessionType('')
        setSessionDate('')
        setSessionTime('09:00')
        setDuration('')
        setInstructor('')
        setMaxParticipants('6')
        setNotes('')
        setLocation('')
        setDialogOpen(false)
        toast.success('Session scheduled!', {
          description: `Orientation session scheduled for ${sessionDate} at ${sessionTime}.`,
          className: 'bg-[#14A44D] text-white'
        })
      } else {
        toast.error('Failed to schedule session', {
          description: 'Please try again.',
          className: 'bg-destructive text-destructive-foreground'
        })
      }
    } else {
      toast.error('Missing required fields', {
        description:
          'Please fill in all required fields to schedule a session.',
        className: 'bg-destructive text-destructive-foreground'
      })
    }
  }

  // Handler for Edit button in Actions column
  const handleEditSessionClick = (session: any) => {
    setSelectedSession(session)
    setEditData({
      session_type: session.session_type || session.type || '',
      date: session.date
        ? new Date(session.date).toISOString().slice(0, 10)
        : '',
      time: session.date
        ? new Date(session.date)
            .toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
            .slice(0, 5)
        : '',
      duration: session.duration ? String(session.duration) : '',
      instructor: session.instructor || '',
      location: session.location || '',
      max_participants: session.max_participants
        ? String(session.max_participants)
        : '',
      notes: session.notes || ''
    })
    setIsEditSessionDialogOpen(true)
  }

  useEffect(() => {
    if (gondolaId) fetchOrientationSessionsByGondolaId(gondolaId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gondolaId])

  // Split sessions into completed and upcoming
  const now = new Date()
  const completedSessions = orientationSessions.filter(
    s => new Date(s.date) < now
  )
  const upcomingSessions = orientationSessions.filter(
    s => new Date(s.date) >= now
  )
  const sessionHistory = [...orientationSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // DataTable columns definition
  const columns: ColumnDef<any>[] = [
    {
      header: 'Session ID',
      cell: ({ row, table }) => {
        const idx = row.index
        const session = row.original
        const sessionDate = new Date(session.date)
        return (
          session.id?.slice(0, 10) ||
          `OS-${sessionDate.getFullYear()}-${String(idx + 1).padStart(3, '0')}`
        )
      }
    },
    {
      header: 'Type',
      accessorKey: 'session_type',
      cell: info => info.getValue() || '-'
    },
    {
      header: 'Date & Time',
      cell: ({ row }) => {
        const session = row.original
        const sessionDate = new Date(session.date)
        const dateStr = sessionDate.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
        const timeStr = sessionDate.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        })
        return (
          <div>
            <p className='font-medium'>{dateStr}</p>
            <p className='text-sm text-foreground'>{timeStr}</p>
          </div>
        )
      }
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: ({ row }) => row.original.location || '-'
    },
    {
      header: 'Instructor',
      accessorKey: 'instructor',

      cell: ({ row }) => {
        return (
          <p className='font-medium'>
            {row.original.instructor?.split('_').join(' ')}
          </p>
        )
      }
    },
    {
      header: 'Participants',
      cell: ({ row }) => {
        const s = row.original
        return typeof s.currentParticipants === 'number' &&
          typeof s.max_participants === 'number'
          ? `${s.currentParticipants}/${s.max_participants}`
          : `${s.max_participants || '-'}`
      }
    },
    {
      header: 'Status',
      cell: ({ row }) => {
        const session = row.original
        const sessionDate = new Date(session.date)
        const isCompleted = sessionDate < now
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              isCompleted
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isCompleted ? 'Completed' : 'Upcoming'}
          </span>
        )
      }
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const session = row.original
        const sessionDate = new Date(session.date)
        const isCompleted = sessionDate < now

        return (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setSelectedSession(session)
                setIsViewSessionDialogOpen(true)
              }}
            >
              View
            </Button>
            {!isCompleted && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleEditSessionClick(session)}
                >
                  Edit
                </Button>
               
              </>
            )}
             <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setSelectedSession(session);
                    setDeleteDialogOpen(true);
                  }}
                >
                  Delete
                </Button>
          </div>
        )
      }
    }
  ]



  const handleDeleteSession = async () => {
    console.log('Attempting to delete session:', { gondolaId, selectedSession });
    if (!gondolaId || !selectedSession?.id) {
      toast.error('Missing gondola or session ID');
      setDeleteLoading(false);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/orientation-sessions/${selectedSession.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete session');
      setDeleteDialogOpen(false);
      setSelectedSession(null);
      setDeleteLoading(false);
      await fetchOrientationSessionsByGondolaId(gondolaId);
      toast.success('Session deleted successfully!');
    } catch (err: any) {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSelectedSession(null);
      toast.error(err.message || 'Failed to delete session');
    }
  };

  return (
    <Card>
      <CardContent className='p-0'>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Orientation Session</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this orientation session? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                onClick={handleDeleteSession}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className='p-6 border-b flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-semibold'>Orientation Session</h2>
            <p className='text-foreground'>
              Manage orientation sessions for gondola operators
            </p>
          </div>
          {/** Create Schedule Session */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px] max-h-[90%] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Schedule Orientation Session</DialogTitle>
                <DialogDescription>
                  Schedule a new orientation session for {gondolaId}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='sessionType'>Session Type *</Label>
                  <Select
                    name='sessionType'
                    value={sessionType}
                    onValueChange={setSessionType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select session type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Initial Orientation'>
                        Initial Orientation
                      </SelectItem>
                      <SelectItem value='Refresher Training'>
                        Refresher Training
                      </SelectItem>
                      <SelectItem value='Safety Briefing'>
                        Safety Briefing
                      </SelectItem>
                      <SelectItem value='Equipment Training'>
                        Equipment Training
                      </SelectItem>
                      <SelectItem value='Emergency Procedures'>
                        Emergency Procedures
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    name='location'
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder='Enter session location'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sessionDate'>Session Date *</Label>
                  <Input
                    id='sessionDate'
                    type='date'
                    min={new Date().toISOString().split('T')[0]}
                    required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sessionTime'>Session Time *</Label>
                  <Input
                    id='sessionTime'
                    type='time'
                    required
                    value={sessionTime}
                    onChange={e => setSessionTime(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='duration'>Duration (hours) *</Label>
                  <Select
                    name='duration'
                    value={duration}
                    onValueChange={setDuration}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select duration' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>1 hour</SelectItem>
                      <SelectItem value='2'>2 hours</SelectItem>
                      <SelectItem value='4'>4 hours</SelectItem>
                      <SelectItem value='8'>Full day (8 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='instructor'>Instructor *</Label>

                  <Input
                    id='instructor'
                    type='text'
                    required
                    value={instructor}
                    onChange={e => setInstructor(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='maxParticipants'>Max Participants</Label>
                  <Input
                    id='maxParticipants'
                    type='number'
                    min='1'
                    max='12'
                    value={max_participants}
                    onChange={e => setMaxParticipants(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='sessionNotes'>Session Notes</Label>
                  <Textarea
                    id='sessionNotes'
                    placeholder='Any special requirements or focus areas for this session'
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  onClick={handleScheduleSession}
                  disabled={orientationSessionsLoading}
                >
                  {orientationSessionsLoading
                    ? 'Scheduling...'
                    : 'Schedule Session'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className='p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card className='border-l-4 border-l-blue-500'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    <CheckCircle className='h-5 w-5 text-blue-600' />
                  </div>
                  <h3 className='font-semibold text-gray-900'>
                    Completed Sessions
                  </h3>
                </div>
                <div className='text-2xl font-bold text-blue-600'>
                  {completedSessions.length}
                </div>
                <p className='text-sm text-foreground'>
                  Total completed orientations
                </p>
              </CardContent>
            </Card>

            <Card className='border-l-4 border-l-green-500'>
              <CardContent className='p-4'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='p-2 bg-green-100 rounded-lg'>
                    <Calendar className='h-5 w-5 text-green-600' />
                  </div>
                  <h3 className='font-semibold text-gray-900'>
                    Upcoming Sessions
                  </h3>
                </div>
                <div className='text-2xl font-bold text-green-600'>
                  {upcomingSessions.length}
                </div>
                <p className='text-sm text-foreground'>
                  Scheduled for next 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <h3 className='text-lg font-semibold mb-4'>Session History</h3>
          <div className='overflow-x-auto'>
            <DataTable
              columns={columns}
              data={sessionHistory}
              loading={orientationSessionsLoading}
            />
          </div>

          {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Orientation Requirements</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All operators must complete initial orientation before gondola operation</li>
              <li>• Safety briefings are required every 6 months</li>
              <li>• Equipment training must be renewed annually</li>
              <li>• Emergency procedure training is mandatory for all operators</li>
            </ul>
          </div> */}
        </div>
        {/* View Session Dialog */}
        <Dialog
          open={isViewSessionDialogOpen}
          onOpenChange={setIsViewSessionDialogOpen}
        >
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
              <DialogDescription>
                View complete session information for {selectedSession?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedSession && (
              <div className='grid gap-6 py-4 max-h-[60vh] overflow-y-auto'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Session ID
                    </Label>
                    <p className='font-medium'>
                      {selectedSession.id?.slice(0, 10)}
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
                      Session Type
                    </Label>
                    <p className='font-medium'>
                      {selectedSession.session_type || '-'}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Status
                    </Label>
                    {(() => {
                      const sessionDate = new Date(selectedSession.date)
                      const now = new Date('2025-06-06T20:38:46+06:30') // Use latest known time
                      const isCompleted = sessionDate < now
                      return (
                        <p
                          className={`px-2 py-1 text-xs font-medium w-fit rounded-full ${
                            isCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'Upcoming'}
                        </p>
                      )
                    })()}
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Date
                    </Label>
                    <p className='font-medium'>
                      {formatDateDMY(selectedSession.date?.split('T')[0])}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Time
                    </Label>
                    <p className='font-medium'>
                      {selectedSession.date
                        ? new Date(selectedSession.date).toLocaleTimeString(
                            undefined,
                            { hour: '2-digit', minute: '2-digit' }
                          )
                        : '-'}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Duration
                    </Label>
                    <p className='font-medium'>
                      {selectedSession.duration} hours
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Instructor
                    </Label>
                    <p className='font-medium'>{selectedSession?.instructor}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Location
                    </Label>
                    <p className='font-medium'>{selectedSession.location}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      Participants
                    </Label>
                    <p className='font-medium'>
                      {selectedSession.max_participants}
                    </p>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Notes
                  </Label>
                  {selectedSession.notes && (
                    <div className='p-3 bg-background border rounded-md'>
                      <p className='text-sm'>{selectedSession.notes}</p>
                    </div>
                  )}
                </div>

                {(() => {
                  const sessionDate = new Date(selectedSession.date)
                  const now = new Date('2025-06-06T20:38:46+06:30')
                  const isCompleted = sessionDate < now
                  if (!isCompleted) return null
                  return (
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-foreground'>
                        Completion Date
                      </Label>
                      <p className='font-medium'>
                        {selectedSession.date?.split('T')[0]}
                      </p>
                    </div>
                  )
                })()}
                {(() => {
                  const sessionDate = new Date(selectedSession.date)
                  const now = new Date('2025-06-06T20:38:46+06:30')
                  const isCompleted = sessionDate < now
                  if (!isCompleted) return null
                  return (
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium text-foreground'>
                        Instructor Feedback
                      </Label>
                      <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
                        <p className='text-sm text-green-900'>
                          {selectedSession.feedback}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsViewSessionDialogOpen(false)
                  setSelectedSession(null)
                }}
              >
                Close
              </Button>
           
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Session Dialog */}
        <Dialog
          open={isEditSessionDialogOpen}
          onOpenChange={setIsEditSessionDialogOpen}
        >
          <DialogContent className='sm:max-w-[500px] max-h-[90%] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Edit Orientation Session</DialogTitle>
              <DialogDescription>
                Edit session details for {selectedSession?.id}
              </DialogDescription>
            </DialogHeader>
            {selectedSession && (
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='editSessionType'>Session Type *</Label>
                  <Select
                    name='editSessionType'
                    value={editData.session_type || ''}
                    onValueChange={v =>
                      setEditData((prev: any) => ({ ...prev, session_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select session type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Initial Orientation'>
                        Initial Orientation
                      </SelectItem>
                      <SelectItem value='Refresher Training'>
                        Refresher Training
                      </SelectItem>
                      <SelectItem value='Safety Briefing'>
                        Safety Briefing
                      </SelectItem>
                      <SelectItem value='Equipment Training'>
                        Equipment Training
                      </SelectItem>
                      <SelectItem value='Emergency Procedures'>
                        Emergency Procedures
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editSessionDate'>Session Date *</Label>
                  <Input
                    id='editSessionDate'
                    type='date'
                    value={editData.date || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        date: e.target.value
                      }))
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editSessionTime'>Session Time *</Label>
                  <Input
                    id='editSessionTime'
                    type='time'
                    value={editData.time || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        time: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editDuration'>Duration (hours) *</Label>
                  <Select
                    name='editDuration'
                    value={editData.duration || ''}
                    onValueChange={v =>
                      setEditData((prev: any) => ({ ...prev, duration: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select duration' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1'>1 hour</SelectItem>
                      <SelectItem value='2'>2 hours</SelectItem>
                      <SelectItem value='4'>4 hours</SelectItem>
                      <SelectItem value='8'>Full day (8 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editInstructor'>Instructor *</Label>
                  <Input
                    id='editInstructor'
                    type='text'
                    value={editData.instructor || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        instructor: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editLocation'>Location *</Label>
                  <Input
                    id='editLocation'
                    placeholder='Enter session location'
                    value={editData.location || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        location: e.target.value
                      }))
                    }
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editMaxParticipants'>Max Participants</Label>
                  <Input
                    id='editMaxParticipants'
                    type='number'
                    value={editData.max_participants || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        max_participants: e.target.value
                      }))
                    }
                    min='1'
                    max='12'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editSessionNotes'>Session Notes</Label>
                  <Textarea
                    id='editSessionNotes'
                    placeholder='Any special requirements or focus areas for this session'
                    value={editData.notes || ''}
                    onChange={e =>
                      setEditData((prev: any) => ({
                        ...prev,
                        notes: e.target.value
                      }))
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsEditSessionDialogOpen(false)
                  setSelectedSession(null)
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                onClick={handleEditSessionSave}
                disabled={orientationSessionsLoading}
              >
                {orientationSessionsLoading ? 'Saving ...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
