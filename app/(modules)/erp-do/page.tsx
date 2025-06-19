'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Plus, Search, Upload } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { DataTable } from '@/components/common/data-table'

import { ColumnDef } from '@tanstack/react-table'
import { formatDateDMY } from '@/app/utils/formatDate'

export default function ERPDOPage () {
  const {
    projects,
    deliveryOrders,
    fetchDeliveryOrders,
    addDeliveryOrder,
    deliveryOrdersLoading
  } = useAppStore()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isManualEntryDialogOpen, setIsManualEntryDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
const [editOrderState, setEditOrderState] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<any>(null)
  const [manualEntry, setManualEntry] = useState<any>({
    number: '',
    client: '',
    site: '',
    orderDate: '',
    deliveryDate: '',
    poReference: '',
    amount: ''
  })
  const [erpFile, setErpFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [deletedOrder, setDeletedOrder] = useState<any>()
  const [open, setOpen] = React.useState(false)
  // Export handler for CSV/Excel
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleImportFromERP () {
    if (!manualEntry.number || !manualEntry.client || !erpFile) {
      toast.error('Please fill in all required fields', {
        className: 'bg-destructive text-white'
      })
      return
    }
    setImporting(true)
    const formData = new FormData()
    formData.append('file', erpFile)
    formData.append('manualEntry', JSON.stringify(manualEntry))
    try {
      const res = await fetch('/api/delivery-order/import', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        toast.success('Delivery Order imported successfully!', {
          className: 'bg-[#14AA4d] text-white',
          duration: 6000
        })
        setIsUploadDialogOpen(false)
        setManualEntry({
          number: '',
          client: '',
          site: '',
          orderDate: '',
          deliveryDate: '',
          poReference: '',
          amount: ''
        })
        setErpFile(null)
        fetchDeliveryOrders()
      } else {
        const errMsg = await res.text()
        toast.error(`Backend error: ${errMsg}`, {
          className: 'bg-destructive text-white'
        })
      }
    } catch (err: any) {
      toast.error('Failed to upload to backend.', {
        className: 'bg-destructive text-white'
      })
    } finally {
      setImporting(false)
    }
  }
  // Fetch delivery orders on mount
  useEffect(() => {
    fetchDeliveryOrders()
  }, [])

  // Get all delivery orders (both linked and unlinked)
  const allDeliveryOrders = [
    ...deliveryOrders, // Unlinked DOs
    ...projects.flatMap(project =>
      (project.deliveryOrders || []).map((do_: any) => ({
        ...do_,
        linkedProject: project.id
      }))
    ) // Linked DOs with project reference
  ]

  const filteredOrders = allDeliveryOrders.filter(order => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.number.toLowerCase().includes(query) ||
        order.client.toLowerCase().includes(query) ||
        order.site.toLowerCase().includes(query) ||
        order.poReference.toLowerCase().includes(query)
      )
    }
    if (activeTab === 'linked') return !!order.projectId
    if (activeTab === 'unlinked') return !order.projectId

    // "all" tab
    return true
  })

  // Handle confirm delete from Actions dialog
  async function handleDeleteOrderConfirm (
    orderId: string,
    closeDialog: () => void
  ) {
    try {
      const res = await fetch(`/api/delivery-order/${orderId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchDeliveryOrders()
      toast.success('Order deleted', { className: 'bg-[#14AA4d] text-white' })
      closeDialog()
    } catch (err) {
      toast.error('Failed to delete order', {
        className: 'bg-destructive text-white'
      })
    }
  }

  function handleExport () {
    if (!filteredOrders.length) {
      toast.error('No data to export', {
        className: 'bg-destructive text-white'
      })
      return
    }
    setExportDialogOpen(true)
  }

  function doExport (format: 'csv' | 'excel') {
    const exportData = filteredOrders.map(
      ({
        id,
        number,
        client,
        site,
        orderDate,
        deliveryDate,
        poReference,
        status,
        amount,
        items,
        projectId
      }) => ({
        id,
        number,
        client,
        site,
        orderDate,
        deliveryDate,
        poReference,
        status,
        amount,
        items,
        projectId
      })
    )
    if (format === 'csv') {
      const csv = Papa.unparse(exportData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `delivery_orders_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'DeliveryOrders')
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
      })
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `delivery_orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    toast.success(
      `Exported ${filteredOrders.length} records as ${format.toUpperCase()}.`,
      { className: 'bg-[#14AA4d] text-white' }
    )
    setExportDialogOpen(false)
  }

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setViewDialogOpen(true)
  }

const handleEditOrder = (order: any) => {
  setSelectedOrder(order)
  setEditOrderState({
    number: order.number || '',
    client: order.client || '',
    site: order.site || '',
    status: order.status || 'pending',
    orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
    deliveryDate: order.deliveryDate ? order.deliveryDate.split('T')[0] : '',
    poReference: order.poReference || '',
    amount: order.amount || ''
  })
  setEditDialogOpen(true)
}

const handleEditOrderSave = async () => {
  if (!selectedOrder) return
  const {
    number,
    client,
    site,
    status,
    orderDate,
    deliveryDate,
    poReference,
    amount
  } = editOrderState || {}
  if (!number || !client || !site) {
    toast.error('Please fill in all required fields', {
      className: 'bg-destructive text-white'
    })
    return
  }
  try {
    const payload = {
      number,
      client,
      site,
      status,
      orderDate: orderDate || null,
      deliveryDate: deliveryDate || null,
      poReference,
      amount
    }
    const res = await fetch(`/api/delivery-order/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to update delivery order')
    await fetchDeliveryOrders()
    setEditDialogOpen(false)
    setSelectedOrder(null)
    setEditOrderState(null)
    toast.success('Delivery Order updated', { className: 'bg-[#14AA4d] text-white' })
  } catch (err) {
    toast.error('Failed to update delivery order', { className: 'bg-destructive text-white' })
  }
}



  const handleCreateManualDD = async (e: any) => {
    e.preventDefault()
    if (
      !manualEntry.number ||
      !manualEntry.client ||
      !manualEntry.site ||
      !manualEntry.orderDate ||
      !manualEntry.poReference
    ) {
      toast.error('Please fill in all required fields (marked with *)', {
        className: 'bg-destructive text-white'
      })
      return
    }
    // Prepare form data
    const formData = new FormData()
    // Sanitize amount to ensure it's a valid integer
    let safeAmount = parseInt(manualEntry.amount, 10)
    if (isNaN(safeAmount)) safeAmount = 0
    formData.append(
      'manualEntry',
      JSON.stringify({
        ...manualEntry,
        items: manualEntry.items || '',
        status: manualEntry.status || 'pending',
        amount: String(safeAmount)
      })
    )
    if (manualEntry.documents && manualEntry.documents.length > 0) {
      // Only upload the first file for now (backend expects one file)
      formData.append('file', manualEntry.documents[0])
    }
    setLoading(true)
    try {
      const res = await fetch('/api/delivery-order/import', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        toast.success(
          `Delivery Order ${manualEntry.number} created successfully!`,
          { className: 'bg-[#14AA4d] text-white' }
        )
        setIsManualEntryDialogOpen(false)
        setManualEntry({
          number: '',
          client: '',
          site: '',
          orderDate: '',
          deliveryDate: '',
          poReference: '',
          amount: '',
          items: '',
          status: 'pending',
          documents: []
        })
        fetchDeliveryOrders()
        setLoading(false)
      } else {
        const errMsg = await res.text()
        toast.error(`Backend error: ${errMsg}`, {
          className: 'bg-destructive text-white'
        })
        setLoading(false)
      }
    } catch (err: any) {
      toast.error('Failed to create delivery order.', {
        className: 'bg-destructive text-white'
      })
      setLoading(false)
    }
  }
  const deliveryOrderColumns: ColumnDef<any>[] = [
    {
      header: 'DO Number',
      accessorKey: 'number',
      cell: ({ row }) => (
        <span className='text-blue-600 hover:underline cursor-pointer'>
          {row.original.number}
        </span>
      )
    },
    { header: 'Client', accessorKey: 'client' },
    { header: 'Site', accessorKey: 'site' },
    {
      header: 'Order Date',
      accessorKey: 'orderDate',
      cell: ({ row }) =>formatDateDMY(row?.original?.orderDate?.split("T")[0])
    },
    {
      header: 'Delivery Date',
      accessorKey: 'deliveryDate',
      cell: ({ row }) =>formatDateDMY(row?.original?.deliveryDate?.split("T")[0])
    },
    { header: 'PO Reference', accessorKey: 'poReference' },
    { header: 'Amount', accessorKey: 'amount' },
    {
      header: 'Linked Project',
      accessorKey: 'projectId',
      cell: ({ row }) =>
        row.original.projectId ? (
          <Link
            href={`/projects/${row.original.projectId}`}
            className='text-blue-600 hover:underline'
          >
            {row.original.projectId?.slice(0, 10)}
          </Link>
        ) : (
          <span className='text-foreground'>Not Linked</span>
        )
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row, table }) => {
        const order = row.original

        return (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleViewOrder(order)}
            >
              View
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleEditOrder(order)}
            >
              Edit
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setOpen(true)
                setDeletedOrder(order)
              }}
            >
              Delete
            </Button>
          </div>
        )
      }
    }
  ]

  console.log("allDeliveryOrders",allDeliveryOrders)
  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>ERP Delivery Orders</h1>
        <div className='flex gap-2'>
          {/* <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button> */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Delivery Orders</DialogTitle>
                <DialogDescription>Export as Excel or CSV?</DialogDescription>
              </DialogHeader>
              <div className='flex gap-4 justify-end'>
                <Button variant='outline' onClick={() => doExport('csv')}>
                  CSV
                </Button>
                <Button onClick={() => doExport('excel')}>Excel</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className='flex items-center gap-2'>
                <Upload className='h-4 w-4' />
                <span>Import from ERP</span>
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Import Delivery Order from ERP</DialogTitle>
                <DialogDescription>
                  Import delivery order data from your ERP system.
                </DialogDescription>
              </DialogHeader>
              <div className='flex flex-col gap-4 py-4'>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='doNumber' className='text-right w-[120px]'>
                    DO Number
                  </Label>
                  <Input
                    id='doNumber'
                    placeholder='DO-YYYY-XXXX'
                    className='col-span-3'
                    value={manualEntry.number}
                    onChange={e =>
                      setManualEntry({ ...manualEntry, number: e.target.value })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='client' className='text-right w-[120px]'>
                    Client
                  </Label>
                  <Input
                    id='client'
                    placeholder='Client name'
                    className='col-span-3'
                    value={manualEntry.client}
                    onChange={e =>
                      setManualEntry({ ...manualEntry, client: e.target.value })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='site' className='text-right w-[120px]'>
                    Site
                  </Label>
                  <Input
                    id='site'
                    placeholder='Site location'
                    className='col-span-3'
                    value={manualEntry.site}
                    onChange={e =>
                      setManualEntry({ ...manualEntry, site: e.target.value })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='orderDate' className='text-right w-[120px]'>
                    Order Date
                  </Label>
                  <Input
                    id='orderDate'
                    type='date'
                    className='col-span-3'
                    value={manualEntry.orderDate}
                    onChange={e =>
                      setManualEntry({
                        ...manualEntry,
                        orderDate: e.target.value
                      })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label
                    htmlFor='deliveryDate'
                    className='text-right w-[120px]'
                  >
                    Delivery Date
                  </Label>
                  <Input
                    id='deliveryDate'
                    type='date'
                    className='col-span-3'
                    value={manualEntry.deliveryDate}
                    onChange={e =>
                      setManualEntry({
                        ...manualEntry,
                        deliveryDate: e.target.value
                      })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='poReference' className='text-right w-[120px]'>
                    PO Reference
                  </Label>
                  <Input
                    id='poReference'
                    placeholder='PO Reference'
                    className='col-span-3'
                    value={manualEntry.poReference}
                    onChange={e =>
                      setManualEntry({
                        ...manualEntry,
                        poReference: e.target.value
                      })
                    }
                  />
                </div>
                <div className='flex items-center gap-4'>
                  <Label htmlFor='file' className='text-right w-[120px]'>
                    ERP File
                  </Label>
                  <Input
                    id='file'
                    type='file'
                    accept='.csv,.xlsx,.xml'
                    className='col-span-3 py-[13px]'

                    onChange={e => setErpFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='button' onClick={handleImportFromERP}>
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={() => setIsManualEntryDialogOpen(true)}
          >
            <Plus className='h-4 w-4' />
            <span>Manual Entry</span>
          </Button>

          {/** Manual Entry Dialog */}
          <Dialog
            open={isManualEntryDialogOpen}
            onOpenChange={setIsManualEntryDialogOpen}
          >
            <DialogContent className='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Manual Delivery Order Entry</DialogTitle>
                <DialogDescription>
                  Create a new delivery order manually.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualDoNumber'>DO Number *</Label>
                    <Input
                      id='manualDoNumber'
                      placeholder='DO-2025-001'
                      value={manualEntry.number}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          number: e.target.value
                        })
                      }
                    />
                  </div>
                  {/* <div className="grid gap-2">
                    <Label htmlFor="manualStatus">Status</Label>
                    <select
                      id="manualStatus"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={manualEntry.status || 'pending'}
                      onChange={e => setManualEntry({ ...manualEntry, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div> */}
                  <div className='grid gap-2'>
                    <Label htmlFor='manualItems'>Items Description</Label>
                    <Input
                      type='text'
                      id='manualItems'
                      placeholder='Description of items'
                      value={manualEntry.items || ''}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          items: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualClient'>Client *</Label>
                    <Input
                      id='manualClient'
                      placeholder='Client name'
                      value={manualEntry.client}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          client: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualSite'>Site *</Label>
                    <Input
                      id='manualSite'
                      placeholder='Site location'
                      value={manualEntry.site}
                      onChange={e =>
                        setManualEntry({ ...manualEntry, site: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualOrderDate'>Order Date *</Label>
                    <Input
                      id='manualOrderDate'
                      type='date'
                      value={manualEntry.orderDate}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          orderDate: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualDeliveryDate'>Delivery Date</Label>
                    <Input
                      id='manualDeliveryDate'
                      type='date'
                      value={manualEntry.deliveryDate}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          deliveryDate: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualPoRef'>PO Reference *</Label>
                    <Input
                      id='manualPoRef'
                      placeholder='PO-2025-001'
                      value={manualEntry.poReference}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          poReference: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='manualAmount'>Amount</Label>
                    <Input
                      id='manualAmount'
                      placeholder='$0.00'
                      value={manualEntry.amount}
                      onChange={e =>
                        setManualEntry({
                          ...manualEntry,
                          amount: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='manualDocuments'>Documents</Label>
                  <Input
                    id='manualDocuments'
                    type='file'
                    multiple
                    className='py-[13px]'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv'
                    onChange={e =>
                      setManualEntry({
                        ...manualEntry,
                        documents: e.target.files
                          ? Array.from(e.target.files)
                          : []
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsManualEntryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  onClick={handleCreateManualDD}
                  disabled={loading}
                >
                  {loading ? 'Creating ...' : 'Create Delivery Order'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Delete Delivery Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete delivery order{' '}
              {deletedOrder?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() =>
                handleDeleteOrderConfirm(deletedOrder?.id, () => setOpen(false))
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardContent className='p-0'>
          <div className='p-4 flex flex-col sm:flex-row gap-4 border-b'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                type='search'
                placeholder='Search delivery orders...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='flex items-center gap-2'
                onClick={handleExport}
              >
                <Download className='h-4 w-4' />
                <span>Export</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue='all' onValueChange={setActiveTab}>
            <div className='px-4 pt-4'>
              <TabsList>
                <TabsTrigger value='all'>All Orders</TabsTrigger>
                <TabsTrigger value='linked'>
                  Linked (
                  {deliveryOrders.filter(order => !!order.projectId)?.length})
                </TabsTrigger>
                <TabsTrigger value='unlinked'>
                  Unlinked (
                  {deliveryOrders.filter(order => !order.projectId)?.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='all' className='mt-0'>
              <DataTable
                data={filteredOrders}
                columns={deliveryOrderColumns}
                pageSize={10}
                loading={deliveryOrdersLoading}
              />
            </TabsContent>
            <TabsContent value='linked' className='mt-0'>
              <DataTable
                data={filteredOrders}
                columns={deliveryOrderColumns}
                pageSize={10}
                loading={deliveryOrdersLoading}
              />
            </TabsContent>
            <TabsContent value='unlinked' className='mt-0'>
              <DataTable
                data={filteredOrders}
                columns={deliveryOrderColumns}
                pageSize={10}
                loading={deliveryOrdersLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Delivery Order Details</DialogTitle>
            <DialogDescription>
              View delivery order information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    DO Number
                  </Label>
                  <p className='text-sm'>{selectedOrder.number}</p>
                </div>
                {/* <div className="grid gap-2">
                  <Label className="text-sm font-medium text-foreground">Status</Label>
                  <div className="text-sm">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div> */}
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Linked Project
                  </Label>
                  <p className='text-sm'>
                    {selectedOrder.projectId ? (
                      <Link
                        href={`/projects/${selectedOrder.projectId}`}
                        className='text-blue-600 hover:underline'
                      >
                        {selectedOrder.projectId}
                      </Link>
                    ) : (
                      <span className='text-foreground'>
                        Not linked to any project
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Client
                  </Label>
                  <p className='text-sm'>{selectedOrder.client}</p>
                </div>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Site
                  </Label>
                  <p className='text-sm'>{selectedOrder.site}</p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Order Date
                  </Label>
                  <p className='text-sm'>
                    {formatDateDMY(selectedOrder.orderDate?.split('T')[0])}
                  </p>
                </div>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Delivery Date
                  </Label>
                  <p className='text-sm'>
                    {formatDateDMY(selectedOrder.deliveryDate?.split('T')[0])}
                  </p>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    PO Reference
                  </Label>
                  <p className='text-sm'>{selectedOrder.poReference}</p>
                </div>
                <div className='grid gap-2'>
                  <Label className='text-sm font-medium text-foreground'>
                    Amount
                  </Label>
                  <p className='text-sm'>{selectedOrder.amount}</p>
                </div>
              </div>

              <div className='grid gap-2'>
                <Label className='text-sm font-medium text-foreground'>
                  Documents
                </Label>
                <div className='text-sm'>
                  {selectedOrder.documentId ? (
                    <div className='space-y-1'>
                      <Link
                        href={`/api/document/${selectedOrder.documentId}/serve`}
                        className='flex items-center gap-2 underline'
                        target='_blank'
                      >
                        <span className='text-blue-600 hover:underline cursor-pointer'>
                          {selectedOrder.documentTitle}
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <span className='text-foreground'>
                      No documents attached
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent className='sm:max-w-[600px]'>
    <DialogHeader>
      <DialogTitle>Edit Delivery Order</DialogTitle>
      <DialogDescription>
        Update delivery order information
      </DialogDescription>
    </DialogHeader>
    {editOrderState && (
      <div className='grid gap-4 py-4'>
        <div className='grid grid-cols-1 gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='editDoNumber'>DO Number</Label>
            <Input
              id='editDoNumber'
              value={editOrderState.number}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, number: e.target.value }))}
            />
          </div>
          {/* <div className="grid gap-2">
            <Label htmlFor="editStatus">Status</Label>
            <select
              id="editStatus"
              value={editOrderState.status}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div> */}
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='editClient'>Client</Label>
            <Input
              id='editClient'
              value={editOrderState.client}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, client: e.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='editSite'>Site</Label>
            <Input
              id='editSite'
              value={editOrderState.site}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, site: e.target.value }))}
            />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='editOrderDate'>Order Date</Label>
            <Input
              id='editOrderDate'
              type='date'
              value={editOrderState.orderDate}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, orderDate: e.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='editDeliveryDate'>Delivery Date</Label>
            <Input
              id='editDeliveryDate'
              type='date'
              value={editOrderState.deliveryDate}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, deliveryDate: e.target.value }))}
            />
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='editPoRef'>PO Reference</Label>
            <Input
              id='editPoRef'
              value={editOrderState.poReference}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, poReference: e.target.value }))}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='editAmount'>Amount</Label>
            <Input
              id='editAmount'
              value={editOrderState.amount}
              onChange={e => setEditOrderState((prev: any) => ({ ...prev, amount: e.target.value }))}
            />
          </div>
        </div>
      </div>
    )}
    <DialogFooter>
      <Button
        type='button'
        variant='outline'
        onClick={() => {
          setEditDialogOpen(false)
          setEditOrderState(null)
        }}
      >
        Cancel
      </Button>
      <Button
        type='submit'
        onClick={handleEditOrderSave}
      >
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Delete Delivery Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete delivery order{' '}
              {orderToDelete?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={() => {
                toast.success(
                  `Delivery Order ${orderToDelete?.number} has been deleted successfully!`,
                  {
                    className: 'bg-[#14aa4d] text-white'
                  }
                )
                setDeleteDialogOpen(false)
                setOrderToDelete(null)
                // In a real app, you would call an API to delete the order
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
