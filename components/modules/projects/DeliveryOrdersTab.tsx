import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
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
import { v4 as uuid } from 'uuid'

export function DeliveryOrdersTab ({ id }: { id: string }) {
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState<string | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDeliveryOrders, setSelectedDeliveryOrders] = useState<any[]>(
    []
  )
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false)
  const [selectedDeliveryOrderForView, setSelectedDeliveryOrderForView] =
    useState<any>(null)
  const [success, setSuccess] = useState('')
  const { deliveryOrders, fetchDeliveryOrders, deliveryOrdersLoading } =
    useAppStore()
  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchProjectById = async () => {
    await fetch(`/api/project/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch project')
        return res.json()
      })
      .then(data => setProject(data))
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    setIsLoading(true)
    fetchDeliveryOrders()
    fetchProjectById()
  }, [success])

  const pjLoading = isLoading || deliveryOrdersLoading
  async function handleLinkSelectedDOs ({
    selectedDeliveryOrders,
    setSelectedDeliveryOrders
  }: any) {
    if (selectedDeliveryOrders.length === 0) {
      toast.error('No delivery orders selected', {
        description: 'Please select at least one delivery order to link.',
        className: 'bg-destructive text-white'
      })
      return
    }
    try {
      setLoading(true)
      // Use new endpoint to link delivery orders
      const res = await fetch(
        `/api/project/${project.id}/link-delivery-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryOrderIds: Array.from(
              new Set([
                ...project.deliveryOrders.map((d: any) => d.id),
                ...selectedDeliveryOrders.map((d: any) => d.id)
              ])
            )
          })
        }
      )
      if (!res.ok) {
        let errorMsg = 'Failed to link delivery orders.'
        try {
          const errorData = await res.json()
          if (errorData && errorData.error)
            errorMsg =
              errorData.error +
              (errorData.details ? `: ${errorData.details}` : '')
        } catch {}
        setLoading(false)

        toast.error('Error', {
          description: errorMsg,
          className: 'bg-destructive text-white'
        })
        return
      }

      toast.success('Success', {
        description: `${selectedDeliveryOrders.length} Delivery Order(s) linked successfully.`,
        className: 'bg-[#14AA4d] text-white'
      })
      setSelectedDeliveryOrders([])
      setIsUploadDialogOpen(false)
      setSuccess(uuid())
      setLoading(false)
    } catch (err: any) {
      toast.error('Error', {
        description: err.message || 'Failed to link delivery orders.',
        className: 'bg-destructive text-white'
      })
    }

    // Unlink delivery order from project
  }

  async function handleUnlinkDeliveryOrder (deliveryOrderId: string) {
    try {
      setLoading(true)
      // Prepare new list of linked DOs (excluding the one to unlink)
      const remainingDOIds = project?.deliveryOrders
        .filter((d: any) => d.id !== deliveryOrderId)
        .map((d: any) => d.id)

      const res = await fetch(
        `/api/project/${project?.id}/link-delivery-orders`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deliveryOrderIds: remainingDOIds })
        }
      )
      if (!res.ok) {
        let errorMsg = 'Failed to unlink delivery order.'
        try {
          const errorData = await res.json()
          if (errorData && errorData.error)
            errorMsg =
              errorData.error +
              (errorData.details ? `: ${errorData.details}` : '')
        } catch {}

        toast.error('Error', {
          description: errorMsg,
          className: 'bg-destructive text-white'
        })
        return
      }
      toast.success('Unlinked', {
        description: 'Delivery order has been unlinked from this project.',
        className: 'bg-[#14AA4d] text-white'
      })
      setUnlinkDialogOpen(null)
      setSuccess(uuid())

      setLoading(false)
      // Refresh project data
    } catch (err: any) {
      toast.error('Error', {
        description: err.message || 'Failed to unlink delivery orders.',
        className: 'bg-destructive text-white'
      })
      setUnlinkDialogOpen(null)
      setLoading(false)
    }
  }
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h2 className='text-xl font-semibold'>
              Delivery Orders ({project?.deliveryOrders?.length || 0})
            </h2>
            <p className='text-foreground'>
              Delivery orders assigned to this project
            </p>
          </div>
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Upload className='h-4 w-4 mr-2' />
                Link DO
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[800px]'>
              <DialogHeader>
                <DialogTitle>Link Delivery Orders</DialogTitle>
                <DialogDescription>
                  Select delivery orders to link to this project.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* Available Delivery Orders Section */}
                  <div>
                    <h3 className='text-sm font-medium mb-4'>
                      Available Delivery Orders
                    </h3>
                    <div className='max-h-64 overflow-y-auto border rounded-md'>
                      {deliveryOrders
                        ?.filter(doItem => !doItem.projectId)
                        .map((deliveryOrder: any) => (
                          <div
                            key={deliveryOrder.id}
                            className='flex items-start space-x-3 p-3 border-b last:border-b-0 hover:bg-gray-50'
                          >
                            <input
                              type='checkbox'
                              id={`select-do-${deliveryOrder.id}`}
                              checked={selectedDeliveryOrders.some(
                                selected => selected.id === deliveryOrder.id
                              )}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedDeliveryOrders(prev => [
                                    ...prev,
                                    deliveryOrder
                                  ])
                                } else {
                                  setSelectedDeliveryOrders(prev =>
                                    prev.filter(
                                      selected =>
                                        selected.id !== deliveryOrder.id
                                    )
                                  )
                                }
                              }}
                              className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                            <label
                              htmlFor={`select-do-${deliveryOrder.id}`}
                              className='flex-1 cursor-pointer'
                            >
                              <div className='font-medium'>
                                {deliveryOrder.number}
                              </div>
                              <div className='text-sm text-foreground'>
                                Client: {deliveryOrder.client}
                              </div>
                              <div className='text-sm text-foreground'>
                                Site: {deliveryOrder.site}
                              </div>
                              <div className='text-sm text-foreground'>
                                Amount: {deliveryOrder.amount} | Items:{' '}
                                {deliveryOrder.items}
                              </div>
                              <div className='text-sm text-foreground'>
                                Delivery:{' '}
                                {deliveryOrder.deliveryDate?.split('T')[0]}
                              </div>
                              <button
                                type='button'
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  window.open(
                                    `/api/document/${deliveryOrder.documentId}/serve`,
                                    '_blank'
                                  )
                                }}
                                className='text-sm text-blue-600 hover:underline'
                              >
                                Document attached - Click to view
                              </button>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Selected Delivery Orders Preview Section */}
                  <div>
                    <h3 className='text-sm font-medium mb-4'>
                      Selected Delivery Orders ({selectedDeliveryOrders.length})
                    </h3>
                    <div className='max-h-64 overflow-y-auto border rounded-md bg-background'>
                      {selectedDeliveryOrders.length > 0 ? (
                        <div className='space-y-2 p-3'>
                          {selectedDeliveryOrders.map(
                            (deliveryOrder, index) => (
                              <div
                                key={deliveryOrder.id}
                                className='flex items-center justify-between p-2 bg-background border rounded-md'
                              >
                                <div className='flex-1'>
                                  <div className='font-medium'>
                                    {deliveryOrder.number}
                                  </div>
                                  <div className='text-sm text-foreground'>
                                    {deliveryOrder.client}
                                  </div>
                                  <div className='text-sm text-foreground'>
                                    {deliveryOrder.site}
                                  </div>
                                </div>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => {
                                    setSelectedDeliveryOrders(prev =>
                                      prev.filter(
                                        selected =>
                                          selected.id !== deliveryOrder.id
                                      )
                                    )
                                  }}
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

                    <div className='mt-3 p-3 bg-blue-50 rounded-md'>
                      <h4 className='text-sm font-medium text-blue-900 mb-2'>
                        Selection Summary
                      </h4>
                      <ul className='text-sm text-blue-800 space-y-1'>
                        <li>• Total DOs: {selectedDeliveryOrders.length}</li>
                        <li>
                          • Ready to link: {selectedDeliveryOrders.length}
                        </li>
                      </ul>
                    </div>
                  </div>
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
                <Button
                  type='submit'
                  disabled={loading}
                  onClick={() =>
                    handleLinkSelectedDOs({
                      selectedDeliveryOrders,
                      setSelectedDeliveryOrders
                    })
                  }
                >
                  {loading ? 'Linking ...' : 'Link Selected DOs'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className='space-y-4'>
          {pjLoading ? (
            <div className='text-center py-8 text-foreground'>Loading ...</div>
          ) : project?.deliveryOrders?.length === 0 ? (
            <div className='text-center py-8 text-foreground'>
              <p>No delivery orders linked to this project.</p>
              <p className='text-sm mt-2'>
                Click "Link DO" to add delivery orders from the ERP system.
              </p>
            </div>
          ) : (
            project?.deliveryOrders?.map(
              (deliveryOrder: any, index: number) => (
                <div
                  key={deliveryOrder.id}
                  className='border rounded-md overflow-hidden'
                >
                  <div className='p-4 bg-background border-b'>
                    <div className='flex justify-between items-center'>
                      <h3 className='font-medium'>{deliveryOrder?.number}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          deliveryOrder?.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : deliveryOrder?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {deliveryOrder?.status}
                      </span>
                    </div>
                  </div>
                  <div className='p-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          Order Date
                        </h4>
                        <p>{deliveryOrder?.orderDate?.split('T')[0]}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          Delivery Date
                        </h4>
                        <p>{deliveryOrder?.deliveryDate?.split('T')[0]}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          PO Reference
                        </h4>
                        <p>{deliveryOrder?.poReference}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          Amount
                        </h4>
                        <p>{deliveryOrder?.amount}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          Items
                        </h4>
                        <p>{deliveryOrder?.items}</p>
                      </div>
                      <div>
                        <h4 className='text-sm font-medium text-foreground mb-1'>
                          Document
                        </h4>
                        {deliveryOrder?.documentId ? (
                          <button
                            onClick={() =>
                              window.open(
                                `/api/document/${deliveryOrder?.documentId}/serve`,
                                '_blank'
                              )
                            }
                            className='text-blue-600 hover:underline text-sm'
                          >
                            View Document
                          </button>
                        ) : (
                          <span className='text-gray-400 text-sm'>
                            No document attached
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='mt-4 flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setSelectedDeliveryOrderForView(deliveryOrder)
                          setIsViewDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Dialog
                        open={unlinkDialogOpen === deliveryOrder?.id}
                        onOpenChange={open =>
                          setUnlinkDialogOpen(open ? deliveryOrder.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className='text-red-600 hover:text-red-700'
                            onClick={() =>
                              setUnlinkDialogOpen(deliveryOrder?.id)
                            }
                          >
                            Unlink
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unlink Delivery Order</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to unlink delivery order{' '}
                              <b>{deliveryOrder?.number}</b> from this project?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant='outline'
                              onClick={() => setUnlinkDialogOpen(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant='destructive'
                              disabled={loading}
                              onClick={() =>
                                handleUnlinkDeliveryOrder(deliveryOrder?.id)
                              }
                            >
                              {loading ? 'Unlinking ...' : 'Unlink'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
        {/* View Details Dialog */}
        <Dialog
          open={isViewDetailsDialogOpen}
          onOpenChange={setIsViewDetailsDialogOpen}
        >
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Delivery Order Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedDeliveryOrderForView?.number}
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              {selectedDeliveryOrderForView && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        DO Number
                      </Label>
                      <p className='mt-1'>
                        {selectedDeliveryOrderForView.number}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Status
                      </Label>
                      <p className='mt-1'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedDeliveryOrderForView.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : selectedDeliveryOrderForView.status ===
                                'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedDeliveryOrderForView.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Order Date
                      </Label>
                      <p className='mt-1'>
                        {selectedDeliveryOrderForView.orderDate?.split('T')[0]}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Delivery Date
                      </Label>
                      <p className='mt-1'>
                        {
                          selectedDeliveryOrderForView.deliveryDate?.split(
                            'T'
                          )[0]
                        }
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        PO Reference
                      </Label>
                      <p className='mt-1'>
                        {selectedDeliveryOrderForView.poReference}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Amount
                      </Label>
                      <p className='mt-1 font-semibold'>
                        {selectedDeliveryOrderForView.amount}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Items Count
                      </Label>
                      <p className='mt-1'>
                        {selectedDeliveryOrderForView.items}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-foreground'>
                        Document
                      </Label>
                      <p className='mt-1'>
                        {selectedDeliveryOrderForView.documentId ? (
                          <button
                            onClick={() =>
                              window.open(
                                `/api/document/${selectedDeliveryOrderForView.documentId}/serve`,
                                '_blank'
                              )
                            }
                            className='text-blue-600 hover:underline text-sm'
                          >
                            View Document
                          </button>
                        ) : (
                          <span className='text-gray-400 text-sm'>
                            No document attached
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className='border-t pt-4'>
                    <Label className='text-sm font-medium text-foreground'>
                      Additional Information
                    </Label>
                    <div className='mt-2 p-3 bg-background rounded-md'>
                      <p className='text-sm text-foreground'>
                        This delivery order is linked to the current project and
                        contains {selectedDeliveryOrderForView.items} item(s)
                        with a total value of{' '}
                        {selectedDeliveryOrderForView.amount}.
                      </p>
                      {selectedDeliveryOrderForView.status === 'pending' && (
                        <p className='text-sm text-yellow-600 mt-2'>
                          ⚠️ This delivery order is still pending. Please
                          coordinate with the client for delivery scheduling.
                        </p>
                      )}
                      {selectedDeliveryOrderForView.status === 'delivered' && (
                        <p className='text-sm text-green-600 mt-2'>
                          ✅ This delivery order has been successfully delivered
                          and completed.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsViewDetailsDialogOpen(false)}
              >
                Close
              </Button>
              {selectedDeliveryOrderForView?.documentId && (
                <Button
                  type='button'
                  onClick={() =>
                    window.open(
                      `/api/document/${selectedDeliveryOrderForView.documentId}/serve`,
                      '_blank'
                    )
                  }
                >
                  Open Document
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
