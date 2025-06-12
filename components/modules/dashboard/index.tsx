'use client'

import React from 'react'
import jsPDF from 'jspdf'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Package, FileWarning, ClipboardCheck, FileText } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { DataTable } from '@/components/common/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Project } from '@/types/project'
import { useAppStore } from '@/lib/store'
import StatCard from './StatCard'
import CertificateItem from './CertificateItem'
import { useMemo } from 'react'
import { downloadPDF } from './downloadPDF'
export interface DeliveryOrder {
  id: string
  number: string
  date: Date
  fileUrl?: string
}

const projectColumns: ColumnDef<Project>[] = [
  {
    accessorKey: 'id',
    header: 'Project ID',
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}`}
        className='text-blue-600 hover:underline underline'
      >
        {row.original.id?.slice(0, 10)}
      </Link>
    )
  },
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'site', header: 'Site' },
  {
    accessorKey: 'gondolas',
    header: 'Gondolas',
    cell: ({ row }) => row?.original?.gondolas?.length || 0
  },
  {
    accessorKey: 'deliveryOrders',
    header: 'DOs',
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}?tab=delivery-orders`}
        className='text-blue-600 hover:underline'
      >
        {row.original.deliveryOrders.length}
      </Link>
    )
  },
  { accessorKey: 'created', header: 'Created' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as string
      return (
        <Badge
          variant={
            status === 'active'
              ? 'default'
              : status === 'completed'
              ? 'secondary'
              : 'outline'
          }
        >
          {status}
        </Badge>
      )
    }
  }
]

type CertificateStatus = {
  title: string
  serialNumber: string
  status: string
  expiry?: string
}

export default function Dashboard () {
  const {
    fetchProjects,
    fetchGondolas,
    fetchCertificates,
    projects,
    certificates,
    certificatesLoading,
    gondolas,
    projectsLoading,
    gondolasLoading,
    fetchInspectionsByGondolaId
  } = useAppStore()
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [pendingInspectionsCount, setPendingInspectionsCount] = useState(0)
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  //const loading = projectsLoading || gondolasLoading || documentsLoading || shiftHistoryLoading || deliveryOrdersLoading || certificatesLoading;

  const fetchPendingInspections = async () => {
    setInspectionsLoading(true)
    try {
      let allInspections: any[] = []
      for (const gondola of gondolas) {
        const inspections = await fetchInspectionsByGondolaId(gondola.id)
        if (inspections && Array.isArray(inspections)) {
          allInspections = allInspections.concat(inspections)
        }
      }
      const now = new Date('2025-06-10T10:32:07+06:30')
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const pending = allInspections.filter(
        insp =>
          (!insp.status || insp.status.toLowerCase() !== 'completed') &&
          insp.date &&
          new Date(insp.date) >= now &&
          new Date(insp.date) <= in7Days
      )
      setPendingInspectionsCount(pending.length)
    } catch (err) {
      setPendingInspectionsCount(0)
    } finally {
      setInspectionsLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates(), fetchProjects(), fetchGondolas()
  }, [])

  useEffect(() => {
    if (gondolas.length > 0) {
      fetchPendingInspections()
    }
  }, [])


  const expiringCertificatesCount = useMemo(() => {
    if (!certificates || certificates.length === 0) return 0
    const now = Date.now()
    const in30Days = now + 30 * 24 * 60 * 60 * 1000
    return certificates.reduce((count, cert) => {
      if (!cert.expiry) return count
      const expiryTime = new Date(cert.expiry).getTime()
      return expiryTime >= now && expiryTime <= in30Days ? count + 1 : count
    }, 0)
  }, [certificates])

  const totalDeliveryOrders = projects.reduce(
    (acc: number, project: Project) =>
      acc + (project.deliveryOrders ? project.deliveryOrders.length : 0),
    0
  )
  const activeGondolas = gondolas.filter(
    (g: any) => g.status?.toLowerCase() === 'deployed'
  ).length

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Dashboard</h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setReportDialogOpen(true)}>
            Generate Report
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <StatCard
          title='Active Gondolas'
          value={
            gondolasLoading ? <Spinner size={20} /> : activeGondolas.toString()
          }
          description='Currently deployed equipment'
          icon={<Package className='h-6 w-6 text-blue-600' />}
        />
        <StatCard
          title='Expiring Certificates'
          value={
            certificatesLoading ? (
              <Spinner size={20} />
            ) : (
              expiringCertificatesCount.toString()
            )
          }
          description='Requiring attention within 30 days'
          icon={<FileWarning className='h-6 w-6 text-orange-500' />}
          accentColor='border-l-orange-500'
        />
        <StatCard
          title='Pending Inspections'
          value={
            inspectionsLoading ? (
              <Spinner size={20} />
            ) : (
              pendingInspectionsCount.toString()
            )
          }
          description='Due within the next 7 days'
          icon={<ClipboardCheck className='h-6 w-6 text-purple-600' />}
        />
        <StatCard
          title='Total Projects'
          value={
            projectsLoading ? <Spinner size={20} /> : projects.length.toString()
          }
          description={`Active and completed deployments (${totalDeliveryOrders} DOs)`}
          icon={<FileText className='h-6 w-6 text-blue-600' />}
        />
      </div>
      {/* Recent Projects Table */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <Card>
            <CardContent className='p-0'>
              <div className='p-4 border-b flex justify-between items-center'>
                <h2 className='text-lg font-semibold'>Recent Projects</h2>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/projects'>View all</Link>
                </Button>
              </div>
              <div className='overflow-x-auto'>
                {projectsLoading ? (
                  <div className='flex items-center justify-center h-12'>
                    <Spinner size={20} />
                  </div>
                ) : (
                  <DataTable
                    columns={projectColumns}
                    data={projects}
                    pageSize={5}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Certificate Expiry Table */}
        <div>
          <Card>
            <CardContent className='p-0'>
              <div className='p-4 border-b'>
                <h2 className='text-lg font-semibold'>
                  Certificate Expiry Status
                </h2>
              </div>
              <div className='p-4 space-y-4'>
                {certificatesLoading ? (
                  <Spinner size={20} />
                ) : certificates?.length === 0 ? (
                  <div className='text-foreground text-center'>
                    No Certificates Found
                  </div>
                ) : (
                  certificates.map((cert: CertificateStatus, idx: number) => (
                    <CertificateItem
                      key={idx}
                      title={cert.title}
                      serialNumber={cert.serialNumber}
                      expiry={cert.expiry}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent
          id='dashboard-report-dialog'
          className='max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto'
        >
          <DialogHeader>
            <DialogTitle>Dashboard Report</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <div className='border-b pb-4 mb-4'>
              <h3 className='font-semibold text-lg mb-2'>Summary Statistics</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='border p-3 rounded-md'>
                  <p className='text-sm text-foreground'>Active Gondolas</p>
                  <p className='text-xl font-bold'>{activeGondolas}</p>
                </div>
                <div className='border p-3 rounded-md'>
                  <p className='text-sm text-foreground'>
                    Expiring Certificates
                  </p>
                  <p className='text-xl font-bold'>
                    {
                      certificates.filter(cert =>
                        cert.status.toLowerCase().includes('expire')
                      ).length
                    }
                  </p>
                </div>
                <div className='border p-3 rounded-md'>
                  <p className='text-sm text-foreground'>Pending Inspections</p>
                  <p className='text-xl font-bold'>
                    {inspectionsLoading ? (
                      <Spinner size={20} />
                    ) : (
                      pendingInspectionsCount
                    )}
                  </p>
                </div>
                <div className='border p-3 rounded-md'>
                  <p className='text-sm text-foreground'>Total Projects</p>
                  <p className='text-xl font-bold'>{projects.length}</p>
                </div>
              </div>
            </div>

            <div className='border-b pb-4 mb-4'>
              <h3 className='font-semibold text-lg mb-2'>Projects Overview</h3>
              <div className='overflow-x-auto'>
                <DataTable
                  columns={[
                    { accessorKey: 'id', header: 'Project ID' },
                    { accessorKey: 'client', header: 'Client' },
                    { accessorKey: 'site', header: 'Site' },
                    { accessorKey: 'status', header: 'Status' }
                  ]}
                  data={projects.slice(0, 5)}
                  pageSize={5}
                />
              </div>
            </div>

            <div>
              <h3 className='font-semibold text-lg mb-2'>Certificate Status</h3>
              <div className='space-y-2'>
                {certificates.length === 0 ? (
                  <div className='text-foreground'>No certificates found.</div>
                ) : (
                  certificates.map((cert, idx) => (
                    <div
                      className='flex justify-between border-b pb-2'
                      key={idx}
                    >
                      <span>
                        {cert.title}{' '}
                        {cert.serialNumber ? `${cert.serialNumber}` : ''}
                      </span>
                      <span
                        className={
                          cert?.status?.toLowerCase().includes('expired')
                            ? 'text-red-600 font-medium'
                            : cert?.status?.toLowerCase().includes('expire')
                            ? 'text-yellow-600 font-medium'
                            : 'text-green-600 font-medium'
                        }
                      >
                        {cert?.status ? cert.status : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setReportDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() =>
                downloadPDF({
                  gondolas,
                  certificates,
                  pendingInspectionsCount,
                  projects
                })
              }
            >
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
