'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, Calendar, MapPin, User, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import DocumentsTab from '@/components/modules/projects/DocumentsTab'
import { DeliveryOrdersTab } from '@/components/modules/projects/DeliveryOrdersTab'
import GondolasTab from '@/components/modules/projects/GondolasTab'
import { formatDateDMY } from '@/app/utils/formatDate'

export default function ProjectDetailPage ({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/project/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch project')
        return res.json()
      })
      .then(data => setProject(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])


  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'delivery-orders'

  if (loading) {
    return <div className='p-6'>Loading project...</div>
  }
  if (error || !project) {
    return (
      <div className='p-6'>
        <div className='flex items-center gap-4 mb-6'>
          <Link href='/projects'>
            <Button variant='outline' size='icon' className='h-8 w-8'>
              <ChevronLeft className='h-4 w-4' />
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Project not found</h1>
        </div>
        <Card>
          <CardContent className='p-6 text-center'>
            <p className='text-foreground'>
              The project you're looking for doesn't exist or has been removed.
            </p>
            <Button className='mt-4' asChild>
              <Link href='/projects'>Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <div className='flex items-center gap-4 mb-6'>
        <Link href='/projects'>
          <Button variant='outline' size='icon' className='h-8 w-8'>
            <ChevronLeft className='h-4 w-4' />
          </Button>
        </Link>
        <h1 className='text-2xl font-bold'>Project {id?.slice(0, 10)}</h1>
        <div className='ml-auto'></div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <Card>
          <CardContent className='p-6'>
            <h2 className='text-lg font-semibold mb-4'>Client Info</h2>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <User className='h-5 w-5 text-gray-400' />
                <span>{project.client}</span>
              </div>
              <div className='flex items-center gap-2'>
                <MapPin className='h-5 w-5 text-gray-400' />
                <span>{project.site}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <h2 className='text-lg font-semibold mb-4'>Project Status</h2>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-foreground'>Status:</span>
                <span className='font-medium capitalize'>{project.status}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-foreground'>Gondolas:</span>
                <span className='font-medium'>
                  {Array.isArray(project.gondolas)
                    ? project.gondolas.length
                    : 0}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-foreground'>Delivery Orders:</span>
                <span className='font-medium'>
                  {project.deliveryOrders.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <h2 className='text-lg font-semibold mb-4'>Dates</h2>
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-gray-400' />
                <div className='flex justify-between w-full'>
                  <span className='text-foreground'>Start Date:</span>
                  <span className='font-medium'>
                    {formatDateDMY(project.startDate?.split('T')[0]) || ''}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-gray-400' />
                <div className='flex justify-between w-full'>
                  <span className='text-foreground'>End Date:</span>
                  <span className='font-medium'>
                    {formatDateDMY(project.endDate?.split('T')[0]) || 'Not set'}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Calendar className='h-5 w-5 text-gray-400' />
                <div className='flex justify-between w-full'>
                  <span className='text-foreground'>Created:</span>
                  <span className='font-medium'>
                    {formatDateDMY(project?.created?.split('T')[0]) || ''}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className='mb-6'>
          <TabsTrigger value='delivery-orders'>
            Delivery Orders ({project.deliveryOrders.length})
          </TabsTrigger>
          <TabsTrigger value='gondolas'>Gondolas</TabsTrigger>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
        </TabsList>
        <TabsContent value='delivery-orders'>
          <DeliveryOrdersTab id={id} />
        </TabsContent>
        <TabsContent value='gondolas'>
          <GondolasTab
            gondolas={Array.isArray(project.gondolas) ? project.gondolas : []}
          />
        </TabsContent>
        <TabsContent value='documents'>
          <DocumentsTab projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
