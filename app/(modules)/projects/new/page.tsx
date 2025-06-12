'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ChevronLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DeliveryOrder, Gondola } from '@/types'
import { toast } from 'sonner'
interface Project {
  id: string
  client: string
  site: string
  created: Date
  startDate: Date
  endDate?: Date
  status: 'active' | 'completed' | 'cancelled'
  gondolas: Gondola[]
  deliveryOrders: DeliveryOrder[]
  projectName: string
  projectManager?: string
  description: string
  primaryGondolaId?: string
  primaryDOId?: string
}

export default function NewProjectPage () {
  const router = useRouter()
  const [gondolaDialogOpen, setGondolaDialogOpen] = useState(false)
  const [selectedGondola, setSelectedGondola] = useState<Gondola | null>(null)
  const [formData, setFormData] = useState<Partial<Project>>({
    id: `P-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, '0')}`,
    client: '',
    site: '',
    created: new Date(),
    startDate: new Date(),
    status: 'active',
    gondolas: [],
    deliveryOrders: [],
    projectName: '',
    projectManager: '',
    description: ''
  })

  const [primaryDOId, setPrimaryDOId] = useState<string | null>(null)
  const [primaryGondolaId, setPrimaryGondolaId] = useState<string | null>(null)
  const [gondolaSearch, setGondolaSearch] = useState<string>('')
  const {
    projectManagers,
    gondolas,
    fetchGondolas,
    fetchDeliveryOrders,
    deliveryOrders,
    fetchProjectManagers,
    projectsLoading,
    gondolasError,
    addProject
  } = useAppStore()

  useEffect(() => {
    fetchProjectManagers()
    fetchGondolas()
    fetchDeliveryOrders()
  }, [])

  const availableGondolas = gondolas
  const availableDOs = deliveryOrders?.filter(doItem => !doItem?.projectId)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleViewDocument = (documentId: string) => {
    // Open document in a new tab/window
    const documentUrl = `/api/document/${documentId}/serve`
    window.open(documentUrl, '_blank')
  }

  const handleViewGondolaDetails = (gondola: Gondola) => {
    setSelectedGondola(gondola)
    setGondolaDialogOpen(true)
  }

  const handleRemoveDeliveryOrder = (index: number) => {
    const doToRemove = formData.deliveryOrders?.[index]

    // If removing the primary DO, reset the primary DO ID
    if (doToRemove && doToRemove.id === primaryDOId) {
      setPrimaryDOId(null)
    }

    setFormData(prev => ({
      ...prev,
      deliveryOrders: prev.deliveryOrders?.filter((_, i) => i !== index) || []
    }))
  }

  const handleRemoveGondola = (index: number) => {
    const gondolaToRemove = formData.gondolas?.[index]

    // If removing the primary gondola, reset the primary gondola ID
    if (gondolaToRemove && gondolaToRemove.id === primaryGondolaId) {
      setPrimaryGondolaId(null)
    }

    setFormData(prev => ({
      ...prev,
      gondolas: prev.gondolas?.filter((_, i) => i !== index) || []
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.deliveryOrders || formData.deliveryOrders.length === 0) {
      toast.error('Missing Required Field', {
        description: 'Please add at least one delivery order',
        className: 'bg-destructive text-white'
      })
      return
    }
    if (!formData.projectName) {
      toast.error('Missing Required Field', {
        description: 'Please enter a project name',
        className: 'bg-destructive text-white'
      })
      return
    }

    if (
      !primaryDOId &&
      formData.deliveryOrders &&
      formData.deliveryOrders.length > 0
    ) {
      toast.error('Missing Required Field', {
        description: 'Please select a primary DO',
        className: 'bg-destructive text-white'
      })
      return
    }

    // Create a complete Project object
    const newProject: Project = {
      id: formData.id!,
      client: formData.client!,
      site: formData.site!,
      gondolas: formData.gondolas!,
      created: formData.created || new Date(),
      status: formData.status as 'active' | 'completed' | 'cancelled',
      endDate: formData.endDate,
      startDate: formData.startDate || new Date(),
      deliveryOrders: formData.deliveryOrders!,
      projectName: formData.projectName!,
      projectManager: formData.projectManager,
      description: formData.description || '',
      primaryGondolaId: primaryGondolaId || undefined,
      primaryDOId: primaryDOId || undefined
    }
    addProject(newProject)
    router.push('/projects')
  }

  const handleAvailableDOChange = (e: any, deliveryOrder: DeliveryOrder) => {
    {
      if (e.target.checked) {
        setFormData(prev => ({
          ...prev,
          deliveryOrders: [...(prev.deliveryOrders || []), deliveryOrder]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          deliveryOrders:
            prev.deliveryOrders?.filter(
              selected => selected.id !== deliveryOrder.id
            ) || []
        }))

        // If unchecking the primary DO, reset the primary DO ID
        if (primaryDOId === deliveryOrder.id) {
          setPrimaryDOId(null)
        }
      }
    }
  }
  return (
    <div className='p-6'>
      {/** Gondola Detail Dialog */}
      <Dialog open={gondolaDialogOpen} onOpenChange={setGondolaDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Gondola Details</DialogTitle>
          </DialogHeader>
          {selectedGondola && (
            <div className='space-y-2'>
              <div className='flex gap-4'>
                <span className='font-semibold'>ID:</span> {selectedGondola.id}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Serial Number:</span>{' '}
                {selectedGondola.serialNumber}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Location:</span>{' '}
                {selectedGondola.location}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Location Detail:</span>{' '}
                {selectedGondola.locationDetail}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Last Inspection:</span>{' '}
                {selectedGondola.lastInspection?.split('T')[0]}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Next Inspection:</span>{' '}
                {selectedGondola.nextInspection?.split('T')[0]}
              </div>
              <div className='flex gap-4'>
                <span className='font-semibold'>Status:</span>{' '}
                {selectedGondola.status}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setGondolaDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className='flex items-center gap-4 mb-6'>
        <Link href='/projects'>
          <Button variant='outline' size='icon' className='h-8 w-8'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
        </Link>
        <h1 className='text-2xl font-bold'>Create New Project</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='projectName'>Project Name</Label>
                <Input
                  id='projectName'
                  placeholder='Enter project name'
                  value={formData.projectName}
                  onChange={e => handleChange('projectName', e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='client'>Client Name</Label>
                <Input
                  id='client'
                  placeholder='Enter client name'
                  value={formData.client}
                  onChange={e => handleChange('client', e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='site'>Site Name</Label>
                <Input
                  id='site'
                  placeholder='Enter site location'
                  value={formData.site}
                  onChange={e => handleChange('site', e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='startDate'>Start Date</Label>
                <Input
                  id='startDate'
                  type='date'
                  value={
                    formData.startDate
                      ? formData.startDate.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    handleChange('startDate', new Date(e.target.value))
                  }
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='endDate'>End Date (Optional)</Label>
                <Input
                  id='endDate'
                  type='date'
                  value={
                    formData.endDate
                      ? formData.endDate.toISOString().split('T')[0]
                      : ''
                  }
                  onChange={e =>
                    handleChange(
                      'endDate',
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='cancelled'>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='projectManager'>Project Manager</Label>
                
                <Input
                  id='project-manager'
                  placeholder='Enter Project Manager Name'
                  value={formData.projectManager}
                  onChange={e => handleChange('projectManager', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description/Notes</Label>
              <Textarea
                id='description'
                placeholder='Enter description or notes'
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Delivery Orders</Label>
              <div className='border rounded-md p-4'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Available Delivery Orders Section */}
                  <div>
                    <h3 className='text-sm font-medium mb-4'>
                      Available Delivery Orders
                    </h3>
                    <div className='max-h-64 overflow-y-auto border rounded-md'>
                      {availableDOs?.map(deliveryOrder => (
                        <div
                          key={deliveryOrder.id}
                          className='flex items-start space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50'
                        >
                          <input
                            type='checkbox'
                            id={`do-${deliveryOrder.id}`}
                            checked={
                              formData.deliveryOrders?.some(
                                selected => selected.id === deliveryOrder.id
                              ) || false
                            }
                            onChange={e =>
                              handleAvailableDOChange(e, deliveryOrder)
                            }
                            className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                          />
                          <label
                            htmlFor={`do-${deliveryOrder.id}`}
                            className='flex-1 cursor-pointer'
                          >
                            <div className='font-medium'>
                              {deliveryOrder.number}
                            </div>
                            <div className='text-sm text-foreground'>
                              Date: {deliveryOrder.date?.split('T')[0]}
                            </div>
                            {deliveryOrder.documentId ? (
                              <button
                                type='button'
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleViewDocument(deliveryOrder?.documentId)
                                }}
                                className='text-sm text-blue-600 hover:underline'
                              >
                                Document attached - Click to view
                              </button>
                            ) : (
                              <span className='text-sm text-gray-400 italic'>
                                No document attached
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                      {availableDOs?.length === 0 && (
                        <div className='p-4 text-center text-foreground'>
                          No available delivery orders
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Delivery Orders Preview Section */}
                  <div>
                    <h3 className='text-sm font-medium mb-4'>
                      Selected Delivery Orders (
                      {formData.deliveryOrders?.length || 0})
                    </h3>
                    <div className='max-h-64 overflow-y-auto border rounded-md bg-gray-50'>
                      {formData.deliveryOrders &&
                      formData.deliveryOrders.length > 0 ? (
                        <div className='space-y-2 p-3'>
                          {formData.deliveryOrders.map(
                            (deliveryOrder, index) => (
                              <div
                                key={deliveryOrder.id}
                                className='flex items-center justify-between p-2 bg-background border rounded-md'
                              >
                                <div className='flex items-center gap-3 flex-1'>
                                  <input
                                    type='radio'
                                    id={`primary-do-${deliveryOrder.id}`}
                                    name='primaryDO'
                                    checked={primaryDOId === deliveryOrder.id}
                                    onChange={() => {
                                      setPrimaryDOId(deliveryOrder.id)
                                    }}
                                    className='h-4 w-4 text-blue-600 focus:ring-blue-500'
                                  />
                                  <div>
                                    <div className='font-medium'>
                                      {deliveryOrder.number}
                                    </div>
                                    <div className='text-sm text-foreground'>
                                      {deliveryOrder.date}
                                    </div>
                                    {primaryDOId === deliveryOrder.id && (
                                      <span className='text-xs text-green-600 font-medium'>
                                        Primary DO
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    handleRemoveDeliveryOrder(index)
                                  }
                                >
                                  <X className='h-4 w-4' />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className='p-4 text-center text-foreground'>
                          No delivery orders selected
                        </div>
                      )}
                    </div>

                    {formData.deliveryOrders &&
                      formData.deliveryOrders.length > 0 && (
                        <div className='mt-3 p-3 bg-blue-50 rounded-md'>
                          <h4 className='text-sm font-medium text-blue-900 mb-2'>
                            Selection Summary
                          </h4>
                          <ul className='text-sm text-blue-800 space-y-1'>
                            <li>
                              • Total DOs: {formData.deliveryOrders.length}
                            </li>
                            <li>
                              • Primary DO:{' '}
                              {primaryDOId
                                ? formData.deliveryOrders.find(
                                    d => d.id === primaryDOId
                                  )?.number || 'Not set'
                                : 'Not set'}
                            </li>
                            <li>
                              • Additional DOs:{' '}
                              {primaryDOId
                                ? formData.deliveryOrders.length - 1
                                : formData.deliveryOrders.length}
                            </li>
                          </ul>
                          {!primaryDOId && (
                            <div className='mt-2 text-sm text-orange-600 font-medium'>
                              Please select a primary DO using the radio buttons
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Gondolas</Label>
              <div className='border rounded-md p-4'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Available Gondolas Section */}
                  <div>
                    <div className='space-y-4'>
                      <h3 className='text-sm font-medium'>
                        Available Gondolas
                      </h3>
                      <Input
                        type='search'
                        placeholder='Search by ID, serial number, or location...'
                        value={gondolaSearch}
                        onChange={e => setGondolaSearch(e.target.value)}
                        className='text-sm'
                      />
                    </div>
                    <div className='max-h-64 overflow-y-auto border rounded-md'>
                      {(() => {
                        const filteredGondolas = availableGondolas
                          .filter(gondola => {
                            const matchesSearch =
                              gondola.id
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase()) ||
                              gondola.serialNumber
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase()) ||
                              gondola.location
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase())

                            return matchesSearch
                          })
                          .filter(
                            gondola =>
                              gondola.status?.toLowerCase() === 'deployed' ||
                              gondola.status?.toLowerCase() === 'in use'
                          )
                        return filteredGondolas.map(gondola => (
                          <div
                            key={gondola.id}
                            className='flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50'
                          >
                            <input
                              type='checkbox'
                              id={`gondola-${gondola.id}`}
                              checked={
                                formData.gondolas?.some(
                                  selected => selected.id === gondola.id
                                ) || false
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    gondolas: [
                                      ...(prev.gondolas || []),
                                      gondola
                                    ]
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    gondolas:
                                      prev.gondolas?.filter(
                                        selected => selected.id !== gondola.id
                                      ) || []
                                  }))

                                  // If unchecking the primary gondola, reset the primary gondola ID
                                  if (primaryGondolaId === gondola.id) {
                                    setPrimaryGondolaId(null)
                                  }
                                }
                              }}
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                            <label
                              htmlFor={`gondola-${gondola.id}`}
                              className='flex-1 cursor-pointer'
                            >
                              <div className='font-medium'>
                                {gondola.id?.slice(0, 10)}
                              </div>
                              <div className='text-sm text-foreground'>
                                Serial: {gondola.serialNumber}
                              </div>
                              <div className='text-sm text-foreground'>
                                Location: {gondola.location}
                              </div>
                              <div className='flex justify-between items-center'>
                                <span className='text-xs text-blue-600'>
                                  Status: Available
                                </span>
                                <button
                                  type='button'
                                  onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleViewGondolaDetails(gondola)
                                  }}
                                  className='text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                >
                                  View Details
                                </button>
                              </div>
                            </label>
                          </div>
                        ))
                      })()}
                      {(() => {
                        const filteredGondolas = availableGondolas
                          .filter(gondola => {
                            const matchesSearch =
                              gondola.id
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase()) ||
                              gondola.serialNumber
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase()) ||
                              gondola.location
                                .toLowerCase()
                                .includes(gondolaSearch.toLowerCase())

                            return matchesSearch
                          })
                          .filter(
                            gondola =>
                              gondola.status === 'deployed' ||
                              gondola.status === 'in use'
                          )
                        return (
                          filteredGondolas.length === 0 && (
                            <div className='p-4 text-center text-foreground'>
                              {gondolaSearch
                                ? 'No gondolas match your search criteria'
                                : 'No gondolas available'}
                            </div>
                          )
                        )
                      })()}

                      {availableGondolas?.length === 0 && (
                        <div className='p-4 text-center text-foreground'>
                          No available gondolas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Gondolas Preview Section */}
                  <div>
                    <h3 className='text-sm font-medium mb-4'>
                      Selected Gondolas ({formData.gondolas?.length || 0})
                    </h3>
                    <div className='max-h-64 overflow-y-auto border rounded-md bg-gray-50'>
                      {formData.gondolas && formData.gondolas.length > 0 ? (
                        <div className='space-y-2 p-3'>
                          {formData.gondolas.map((gondola, index) => (
                            <div
                              key={gondola.id}
                              className='flex items-center justify-between p-2 bg-background border rounded-md'
                            >
                              <div className='flex items-center gap-3 flex-1'>
                                <input
                                  type='radio'
                                  id={`primary-gondola-${gondola.id}`}
                                  name='primaryGondola'
                                  checked={primaryGondolaId === gondola.id}
                                  onChange={() => {
                                    setPrimaryGondolaId(gondola.id)
                                  }}
                                  className='h-4 w-4 text-blue-600 focus:ring-blue-500'
                                />
                                <div>
                                  <div className='font-medium'>
                                    {gondola.id}
                                  </div>
                                  <div className='text-sm text-foreground'>
                                    {gondola.location}
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <span className='text-xs text-blue-600'>
                                      Available
                                    </span>
                                    {primaryGondolaId === gondola.id && (
                                      <span className='text-xs text-green-600 font-medium'>
                                        Primary Gondola
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => handleRemoveGondola(index)}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='p-4 text-center text-foreground'>
                          No gondolas selected
                        </div>
                      )}
                    </div>

                    {formData.gondolas && formData.gondolas.length > 0 && (
                      <div className='mt-3 p-3 bg-green-50 rounded-md'>
                        <h4 className='text-sm font-medium text-green-900 mb-2'>
                          Gondola Summary
                        </h4>
                        <ul className='text-sm text-green-800 space-y-1'>
                          <li>• Total Gondolas: {formData.gondolas.length}</li>
                          <li>
                            • Primary Gondola:{' '}
                            {primaryGondolaId
                              ? formData.gondolas.find(
                                  g => g.id === primaryGondolaId
                                )?.id || 'Not set'
                              : 'Not set'}
                          </li>
                          <li>
                            • Additional Gondolas:{' '}
                            {primaryGondolaId
                              ? formData.gondolas.length - 1
                              : formData.gondolas.length}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='flex gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push('/projects')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={projectsLoading}>
                {projectsLoading ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
