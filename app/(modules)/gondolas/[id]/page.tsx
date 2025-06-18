'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import InspectionsTab from '@/components/modules/gondolas/InspectionsTab'
import DocumentsTab from '@/components/modules/gondolas/DocumentsTab'
import PhotosTab from '@/components/modules/gondolas/PhotosTab'
import MaintenanceAdhocTab from '@/components/modules/gondolas/MaintenanceAdhocTab'
import RentalDetailsTab from '@/components/modules/gondolas/RentalDetailsTab'
import OrientationSessionTab from '@/components/modules/gondolas/OrientationSessionTab'
import ShiftHistoryTab from '@/components/modules/gondolas/ShiftHistoryTab'

import React, { useEffect, useState } from 'react'

export default function GondolaDetailPage () {
  const params = useParams()
  const id = params.id as string
  const fetchGondolaById = useAppStore(state => state.fetchGondolaById)
  const [gondola, setGondola] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    fetchGondolaById(id)
      .then(data => {
        if (!isMounted) return
        if (!data) throw new Error('Not found')
        setGondola(data)
      })
      .catch(err => {
        if (!isMounted) return
        setError(err.message || 'Failed to fetch')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [id, fetchGondolaById])

  return (
    <div className='p-6'>
      <div className='flex items-center gap-4 mb-6'>
        <Link href='/gondolas'>
          <Button variant='outline' size='icon' className='h-8 w-8'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
        </Link>
        <div className='flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold'>
              Gondola {gondola?.gondola?.serialNumber || id}
            </h1>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                gondola?.gondola?.status === 'deployed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {gondola?.gondola?.status || '-'}
            </span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div>
              <span className='text-foreground'>ID:</span>
              <span className='ml-2 font-medium'>
                {gondola?.gondola?.id?.slice(0, 10) || id}
              </span>
            </div>
            <div>
              <span className='text-foreground'>Serial Number:</span>
              <span className='ml-2 font-medium'>
                {gondola?.gondola?.serialNumber || '-'}
              </span>
            </div>
            <div>
              <span className='text-foreground'>Location:</span>
              <span className='ml-2 font-medium'>
                {gondola?.gondola?.location || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6'>
        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <MapPin className='h-5 w-5 text-blue-600' />
              </div>
              <h2 className='text-sm font-semibold text-foreground'>
                Location
              </h2>
            </div>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-foreground'>Current Location</p>
                <p className='font-semibold text-gray-900'>
                  {gondola?.gondola?.location || '-'}
                </p>
              </div>
              {/* <div>
                <p className='text-sm text-foreground'>Elevation</p>
                <p className='font-medium text-foreground'>North</p>
              </div> */}
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <Calendar className='h-5 w-5 text-green-600' />
              </div>
              <h2 className='text-sm font-semibold text-foreground'>
                Deployment
              </h2>
            </div>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-foreground'>Deployed Date</p>
                <p className='font-semibold text-gray-900'>
                  {gondola?.gondola?.createdAt
                    ? new Date(gondola.createdAt).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-sm text-foreground'>Duration</p>
                <p className='font-medium text-green-600'>
                  {/* Calculate duration if possible */}
                  {gondola?.createdAt
                    ? `${Math.floor(
                        (Date.now() -
                          new Date(gondola.gondola?.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )} days active`
                    : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <CheckCircle className='h-5 w-5 text-purple-600' />
              </div>
              <h2 className='text-sm font-semibold text-foreground'>
                Last Inspection
              </h2>
            </div>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-foreground'>Completed</p>
                <p className='font-semibold text-gray-900'>
                  {gondola?.gondola?.lastInspection
                    ? new Date(
                        gondola.gondola.lastInspection
                      ).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-sm text-foreground'>Status</p>
                <div className='flex items-center gap-1'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <p className='font-medium text-green-600'>Passed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Clock className='h-5 w-5 text-orange-600' />
              </div>
              <h2 className='text-sm font-semibold text-foreground'>
                Next Inspection
              </h2>
            </div>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-foreground'>Due Date</p>
                <p className='font-semibold text-gray-900'>
                  {gondola?.gondola?.nextInspection
                    ? new Date(
                        gondola.gondola.nextInspection
                      ).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-sm text-foreground'>Time Remaining</p>
                <div className='flex items-center gap-1'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                  <p className='font-medium text-orange-600'>
                    {(() => {
                      const now = new Date('2025-06-09T22:31:37+06:30')
                      const due = gondola?.gondola?.nextInspection
                        ? new Date(gondola.gondola.nextInspection)
                        : null
                      if (!due) return '-'
                      const diff = Math.ceil(
                        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                      )
                      if (isNaN(diff)) return '-'
                      if (diff < 0) return 'Due'
                      if (diff === 0) return 'Today'
                      return `${diff} day${diff === 1 ? '' : 's'}`
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='p-2 bg-indigo-100 rounded-lg'>
                <FileText className='h-5 w-5 text-indigo-600' />
              </div>
              <h2 className='text-sm font-semibold text-foreground'>
                Linked Project
              </h2>
            </div>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-foreground'>Project ID</p>
                {gondola?.projects[0]?.id ? (
                  <Link
                    href={`/projects/${gondola.projects[0]?.id}`}
                    className='font-semibold text-indigo-600 hover:text-indigo-800 hover:underline'
                  >
                    {gondola.projects[0]?.id}
                  </Link>
                ) : (
                  <span className='font-medium text-foreground'>-</span>
                )}
              </div>
              <div>
                <p className='text-sm text-foreground'>Project Manager</p>
                {gondola?.projectManagerName ? (
                  <>
                    <p className='font-medium text-foreground'>
                      {gondola.projects[0]?.managerName}
                    </p>
                    {gondola.projectManagerEmail && (
                      <p className='text-xs text-foreground'>
                        {gondola.projects[0]?.managerEmail}
                      </p>
                    )}
                  </>
                ) : (
                  <span className='font-medium text-foreground'>-</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='documents'>
        <TabsList className='mb-6'>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
          <TabsTrigger value='photos'>Photos</TabsTrigger>
          <TabsTrigger value='inspections'>Inspections</TabsTrigger>
          <TabsTrigger value='maintenance-adhoc'>Adhoc Deployment</TabsTrigger>
          <TabsTrigger value='shift-history'>Shift History</TabsTrigger>
          <TabsTrigger value='rental-details'>Rental Details</TabsTrigger>
          <TabsTrigger value='orientation-session'>
            Orientation Session
          </TabsTrigger>
        </TabsList>
        <TabsContent value='documents'>
          <DocumentsTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='photos'>
          <PhotosTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='inspections'>
          <InspectionsTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='maintenance-adhoc'>
          <MaintenanceAdhocTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='shift-history'>
          <ShiftHistoryTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='rental-details'>
          <RentalDetailsTab gondolaId={id} />
        </TabsContent>
        <TabsContent value='orientation-session'>
          <OrientationSessionTab gondolaId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
