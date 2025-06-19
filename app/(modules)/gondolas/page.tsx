'use client'

import { Button } from '@/components/ui/button'
import { GondolasDataTable } from '../../../components/modules/gondolas/GondolasDataTable'
import { Input } from '@/components/ui/input'
import { Filter, Download, Plus } from 'lucide-react'
import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { v4 as uuid } from 'uuid'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { GondolasStatus } from '@/types'

export default function GondolasPage () {
  const [isNewGondolaDialogOpen, setIsNewGondolaDialogOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const { gondolas, fetchGondolas } = useAppStore()
  const [createLoading, setCreateLoading] = useState(false)
  const [refresh, setRefresh] = useState('')

  // New Gondola state
  const [newGondola, setNewGondola] = useState({
    serialNumber: '',
    location: '',
    locationDetail: '',
    status: '',
    lastInspection: '',
    nextInspection: '',
    notes: '',
    image: null as File | null
  })

  // Handler for create gondola
  const handleCreateGondolaSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    if (
      !newGondola.serialNumber ||
      !newGondola.location ||
      !newGondola.status
    ) {
      alert(
        'Please fill in all required fields (Serial Number, Location, and Status)'
      )
      return
    }
    const formData = new FormData()
    formData.append('serialNumber', newGondola.serialNumber)
    formData.append('location', newGondola.location)
    formData.append('locationDetail', newGondola.locationDetail)
    formData.append('status', newGondola.status)
    formData.append('lastInspection', newGondola.lastInspection)
    formData.append('nextInspection', newGondola.nextInspection)
    formData.append('notes', newGondola.notes)
    if (newGondola.image) {
      formData.append('image', newGondola.image)
    }
    try {
      setCreateLoading(true)
      const res = await fetch('/api/gondola', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to create gondola')
      setIsNewGondolaDialogOpen(false)
      setNewGondola({
        serialNumber: '',
        location: '',
        locationDetail: '',
        status: '',
        lastInspection: '',
        nextInspection: '',
        notes: '',
        image: null
      })

      setCreateLoading(false)
      setRefresh(uuid())
    } catch (err: any) {
      setCreateLoading(false)

      toast.error('Create gondola failed', {
        description: err.msg || 'Error creating gondola. Please try again.',
        className: 'bg-destructive text-white'
      })
    }
  }

  // Export handler separated from button
  const handleExport = async () => {
    await fetchGondolas() // Ensure latest data
    const header = [
      'ID',
      'Serial Number',
      'Location',
      'Location Detail',
      'Last Inspection',
      'Next Inspection',
      'Status',
      'Linked Project'
    ]
    const rows = gondolas.map(gondola =>
      [
        gondola.id,
        gondola.serialNumber,
        `"${gondola.location}"`,
        `"${gondola.locationDetail}"`,
        gondola.lastInspection?.split('T')[0],
        gondola.nextInspection?.split('T')[0],
        gondola.status,
        gondola.projectId || ''
      ].join(',')
    )
    const csvContent = [header.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `gondolas-export-${new Date().toISOString().split('T')[0]}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = gondolas.filter(g => {
    // Status filter
    const statusMatch =
      selectedStatus === 'all' ||
      g.status?.trim().toLowerCase() === selectedStatus.trim().toLowerCase()
    // Search filter
    const query = search.trim().toLowerCase()
    const searchMatch =
      !query ||
      [g.serialNumber, g.location, g.locationDetail, g.status]
        .filter(Boolean)
        .some(field => field?.toLowerCase().includes(query))
    return statusMatch && searchMatch
  })
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Gondolas</h1>

      <div className='bg-background border rounded-lg overflow-hidden'>
        <div className='p-4 flex flex-col sm:flex-row gap-4 border-b'>
          <div className='relative flex-1'>
            <Input
              type='search'
              placeholder='Search gondolas...'
              className='pl-10'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='absolute left-3 top-3 h-4 w-4 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          <div className='flex gap-2'>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-[180px]'>
                <div className='flex items-center gap-2'>
                  <Filter className='h-4 w-4' />
                  <SelectValue placeholder='All Status' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                {GondolasStatus?.map(status => {
                  return (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={handleExport}
            >
              <Download className='h-4 w-4' />
              <span>Export</span>
            </Button>
            <Dialog
              open={isNewGondolaDialogOpen}
              onOpenChange={setIsNewGondolaDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className='flex items-center gap-2'>
                  <Plus className='h-4 w-4' />
                  <span>New Gondola</span>
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[500px] max-h-[90%] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle>Add New Gondola</DialogTitle>
                  <DialogDescription>
                    Create a new gondola entry in the system
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handleCreateGondolaSubmit}
                  encType='multipart/form-data'
                  className='py-4'
                >
                  <div className='space-y-4'>
                    {/* Basic Information */}
                    <div>
                      <Label htmlFor='serialNumber'>Serial Number *</Label>
                      <Input
                        id='serialNumber'
                        placeholder='e.g., SN-004-2023'
                        required
                        value={newGondola.serialNumber}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            serialNumber: e.target.value
                          })
                        }
                      />
                    </div>
                    {/* Location Information */}
                    <div>
                      <Label htmlFor='location'>Location *</Label>
                      <Input
                        id='location'
                        placeholder='e.g., Tower C, Bay 2'
                        required
                        value={newGondola.location}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            location: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='locationDetail'>Location Detail</Label>
                      <Input
                        id='locationDetail'
                        placeholder='e.g., 25th Floor, South'
                        value={newGondola.locationDetail}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            locationDetail: e.target.value
                          })
                        }
                      />
                    </div>
                    {/* Status */}
                    <div>
                      <Label htmlFor='status'>Initial Status *</Label>
                      <Select
                        value={newGondola.status}
                        onValueChange={value =>
                          setNewGondola({ ...newGondola, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select status' />
                        </SelectTrigger>
                        <SelectContent>
                          {GondolasStatus?.map(status => {
                            return (
                              <SelectItem value={status.value} key={status.value}>
                                {status.label}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Inspection Dates */}
                    <div>
                      <Label htmlFor='lastInspection'>
                        Last Inspection Date
                      </Label>
                      <Input
                        id='lastInspection'
                        type='date'
                        value={newGondola.lastInspection}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            lastInspection: e.target.value
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='nextInspection'>
                        Next Inspection Due
                      </Label>
                      <Input
                        id='nextInspection'
                        type='date'
                        value={newGondola.nextInspection}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            nextInspection: e.target.value
                          })
                        }
                      />
                    </div>
                    {/* Notes */}
                    <div>
                      <Label htmlFor='notes'>Notes</Label>
                      <Textarea
                        id='notes'
                        placeholder='Any additional notes about this gondola'
                        className='min-h-[80px]'
                        value={newGondola.notes}
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            notes: e.target.value
                          })
                        }
                      />
                    </div>
                    {/* Image Upload */}
                    <div>
                      <Label htmlFor='gondolaImage'>
                        Gondola Image (Optional)
                      </Label>
                      <Input
                        id='gondolaImage'
                        type='file'
                        accept='image/*'
                        className='py-[13px]'
                        onChange={e =>
                          setNewGondola({
                            ...newGondola,
                            image: e.target.files?.[0] || null
                          })
                        }
                        
                      />
                      <p className='text-xs text-foreground mt-1'>
                        Upload an image of the gondola (JPG, PNG, max 5MB)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <div className='flex items-center justify-between w-full py-3 mt-5'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setIsNewGondolaDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type='submit' disabled={createLoading}>
                      {createLoading ? 'Creating...' : 'Create Gondola'}
                    </Button>
                    </div>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='overflow-x-auto'>
          {/* DataTable for gondolas */}
          <GondolasDataTable refresh={refresh} gondolas={filteredData} />
        </div>
      </div>
    </div>
  )
}
