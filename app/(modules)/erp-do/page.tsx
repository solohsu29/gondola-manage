"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Plus, Search, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Delivered</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Pending</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

interface DeliveryOrderRowProps {
  order: any
  linkedProject?: string
  onViewOrder: (order: any) => void
  onEditOrder: (order: any) => void
  onDeleteOrder: (order: any) => void
}

function DeliveryOrderRow({ order, linkedProject, onViewOrder, onEditOrder, onDeleteOrder }: DeliveryOrderRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <span className="text-blue-600 hover:underline cursor-pointer">{order.number}</span>
      </td>
      <td className="p-4">{order.client}</td>
      <td className="p-4">{order.site}</td>
      <td className="p-4">{order.orderDate}</td>
      <td className="p-4">{order.deliveryDate}</td>
      <td className="p-4">{order.poReference}</td>
      <td className="p-4">{order.amount}</td>
      <td className="p-4">
        {linkedProject ? (
          <Link href={`/projects/${linkedProject}`} className="text-blue-600 hover:underline">
            {linkedProject}
          </Link>
        ) : (
          <span className="text-gray-500">Not Linked</span>
        )}
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewOrder(order)}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditOrder(order)}>
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDeleteOrder(order)}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function ERPDOPage() {
  const { projects, deliveryOrders } = useAppStore()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isManualEntryDialogOpen, setIsManualEntryDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<any>(null)

  // Get all delivery orders (both linked and unlinked)
  const allDeliveryOrders = [
    ...deliveryOrders, // Unlinked DOs
    ...projects.flatMap((project) => project.deliveryOrders.map((do_) => ({ ...do_, linkedProject: project.id }))), // Linked DOs with project reference
  ]

  const filteredOrders = allDeliveryOrders.filter((order) => {
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

    // Filter by tab
    if (activeTab === "pending") return order.status === "pending"
    if (activeTab === "delivered") return order.status === "delivered"
    if (activeTab === "cancelled") return order.status === "cancelled"
    if (activeTab === "linked") return !!order.linkedProject
    if (activeTab === "unlinked") return !order.linkedProject

    // "all" tab
    return true
  })

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order)
    setViewDialogOpen(true)
  }

  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order)
    setEditDialogOpen(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ERP Delivery Orders</h1>
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Import from ERP</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Import Delivery Order from ERP</DialogTitle>
                <DialogDescription>Import delivery order data from your ERP system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="doNumber" className="text-right">
                    DO Number
                  </Label>
                  <Input id="doNumber" placeholder="DO-YYYY-XXXX" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Input id="client" placeholder="Client name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="site" className="text-right">
                    Site
                  </Label>
                  <Input id="site" placeholder="Site location" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="poRef" className="text-right">
                    PO Reference
                  </Label>
                  <Input id="poRef" placeholder="PO-YYYY-XXXX" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file" className="text-right">
                    ERP File
                  </Label>
                  <Input id="file" type="file" accept=".csv,.xlsx,.xml" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={() => {
                    const doNumberInput = document.getElementById("doNumber") as HTMLInputElement
                    const clientInput = document.getElementById("client") as HTMLInputElement
                    const fileInput = document.getElementById("file") as HTMLInputElement

                    if (doNumberInput.value && clientInput.value && fileInput.files && fileInput.files[0]) {
                      alert(`Delivery Order ${doNumberInput.value} imported successfully!`)
                      setIsUploadDialogOpen(false)
                    } else {
                      alert("Please fill in all required fields")
                    }
                  }}
                >
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsManualEntryDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Manual Entry</span>
          </Button>
          <Dialog open={isManualEntryDialogOpen} onOpenChange={setIsManualEntryDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Manual Delivery Order Entry</DialogTitle>
                <DialogDescription>Create a new delivery order manually.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manualDoNumber">DO Number *</Label>
                    <Input id="manualDoNumber" placeholder="DO-2025-001" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manualStatus">Status</Label>
                    <select
                      id="manualStatus"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manualClient">Client *</Label>
                    <Input id="manualClient" placeholder="Client name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manualSite">Site *</Label>
                    <Input id="manualSite" placeholder="Site location" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manualOrderDate">Order Date *</Label>
                    <Input id="manualOrderDate" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manualDeliveryDate">Delivery Date</Label>
                    <Input id="manualDeliveryDate" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manualPoRef">PO Reference *</Label>
                    <Input id="manualPoRef" placeholder="PO-2025-001" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="manualAmount">Amount</Label>
                    <Input id="manualAmount" placeholder="$0.00" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manualItems">Items Description</Label>
                  <Input id="manualItems" placeholder="Description of items" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manualDocuments">Documents</Label>
                  <Input
                    id="manualDocuments"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsManualEntryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={() => {
                    const doNumberInput = document.getElementById("manualDoNumber") as HTMLInputElement
                    const clientInput = document.getElementById("manualClient") as HTMLInputElement
                    const siteInput = document.getElementById("manualSite") as HTMLInputElement
                    const orderDateInput = document.getElementById("manualOrderDate") as HTMLInputElement
                    const poRefInput = document.getElementById("manualPoRef") as HTMLInputElement
                    const statusInput = document.getElementById("manualStatus") as HTMLSelectElement
                    const deliveryDateInput = document.getElementById("manualDeliveryDate") as HTMLInputElement
                    const amountInput = document.getElementById("manualAmount") as HTMLInputElement
                    const itemsInput = document.getElementById("manualItems") as HTMLInputElement

                    const documentsInput = document.getElementById("manualDocuments") as HTMLInputElement
                    const uploadedFiles = documentsInput.files
                      ? Array.from(documentsInput.files)
                          .map((file) => file.name)
                          .join(", ")
                      : "No files uploaded"

                    if (
                      doNumberInput.value &&
                      clientInput.value &&
                      siteInput.value &&
                      orderDateInput.value &&
                      poRefInput.value
                    ) {
                      alert(
                        `Delivery Order ${doNumberInput.value} created successfully!\n\nDetails:\nClient: ${clientInput.value}\nSite: ${siteInput.value}\nOrder Date: ${orderDateInput.value}\nDelivery Date: ${deliveryDateInput.value || "Not specified"}\nPO Reference: ${poRefInput.value}\nAmount: ${amountInput.value || "Not specified"}\nItems: ${itemsInput.value || "Not specified"}\nStatus: ${statusInput.value}\nUploaded Documents: ${uploadedFiles}`,
                      )
                      setIsManualEntryDialogOpen(false)
                    } else {
                      alert("Please fill in all required fields (marked with *)")
                    }
                  }}
                >
                  Create Delivery Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search delivery orders..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="px-4 pt-4">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="linked">
                  Linked ({projects.reduce((acc, p) => acc + p.deliveryOrders.length, 0)})
                </TabsTrigger>
                <TabsTrigger value="unlinked">Unlinked ({deliveryOrders.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <DeliveryOrdersTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            </TabsContent>
            <TabsContent value="linked" className="mt-0">
              <DeliveryOrdersTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            </TabsContent>
            <TabsContent value="unlinked" className="mt-0">
              <DeliveryOrdersTable
                orders={filteredOrders}
                onViewOrder={handleViewOrder}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Delivery Order Details</DialogTitle>
            <DialogDescription>View delivery order information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">DO Number</Label>
                  <p className="text-sm">{selectedOrder.number}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="text-sm">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Client</Label>
                  <p className="text-sm">{selectedOrder.client}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Site</Label>
                  <p className="text-sm">{selectedOrder.site}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Order Date</Label>
                  <p className="text-sm">{selectedOrder.orderDate}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Delivery Date</Label>
                  <p className="text-sm">{selectedOrder.deliveryDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">PO Reference</Label>
                  <p className="text-sm">{selectedOrder.poReference}</p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-gray-500">Amount</Label>
                  <p className="text-sm">{selectedOrder.amount}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-500">Linked Project</Label>
                <p className="text-sm">
                  {selectedOrder.linkedProject ? (
                    <Link href={`/projects/${selectedOrder.linkedProject}`} className="text-blue-600 hover:underline">
                      {selectedOrder.linkedProject}
                    </Link>
                  ) : (
                    <span className="text-gray-500">Not linked to any project</span>
                  )}
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-500">Documents</Label>
                <div className="text-sm">
                  {selectedOrder.documents && selectedOrder.documents.length > 0 ? (
                    <div className="space-y-1">
                      {selectedOrder.documents.map((doc: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-blue-600 hover:underline cursor-pointer">{doc}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No documents attached</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Delivery Order</DialogTitle>
            <DialogDescription>Update delivery order information</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editDoNumber">DO Number</Label>
                  <Input id="editDoNumber" defaultValue={selectedOrder.number} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <select
                    id="editStatus"
                    defaultValue={selectedOrder.status}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="pending">Pending</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editClient">Client</Label>
                  <Input id="editClient" defaultValue={selectedOrder.client} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editSite">Site</Label>
                  <Input id="editSite" defaultValue={selectedOrder.site} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editOrderDate">Order Date</Label>
                  <Input id="editOrderDate" type="date" defaultValue={selectedOrder.orderDate} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editDeliveryDate">Delivery Date</Label>
                  <Input id="editDeliveryDate" type="date" defaultValue={selectedOrder.deliveryDate} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editPoRef">PO Reference</Label>
                  <Input id="editPoRef" defaultValue={selectedOrder.poReference} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editAmount">Amount</Label>
                  <Input id="editAmount" defaultValue={selectedOrder.amount} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => {
                const doNumberInput = document.getElementById("editDoNumber") as HTMLInputElement
                const clientInput = document.getElementById("editClient") as HTMLInputElement
                const siteInput = document.getElementById("editSite") as HTMLInputElement
                const statusInput = document.getElementById("editStatus") as HTMLSelectElement

                if (doNumberInput.value && clientInput.value && siteInput.value) {
                  alert(`Delivery Order ${doNumberInput.value} updated successfully!`)
                  setEditDialogOpen(false)
                } else {
                  alert("Please fill in all required fields")
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Delivery Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete delivery order {orderToDelete?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                alert(`Delivery Order ${orderToDelete?.number} has been deleted successfully!`)
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

interface DeliveryOrdersTableProps {
  orders: any[]
  onViewOrder: (order: any) => void
  onEditOrder: (order: any) => void
  onDeleteOrder: (order: any) => void
}

function DeliveryOrdersTable({ orders, onViewOrder, onEditOrder, onDeleteOrder }: DeliveryOrdersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left p-4 font-medium text-gray-500">DO Number</th>
            <th className="text-left p-4 font-medium text-gray-500">Client</th>
            <th className="text-left p-4 font-medium text-gray-500">Site</th>
            <th className="text-left p-4 font-medium text-gray-500">Order Date</th>
            <th className="text-left p-4 font-medium text-gray-500">Delivery Date</th>
            <th className="text-left p-4 font-medium text-gray-500">PO Reference</th>
            <th className="text-left p-4 font-medium text-gray-500">Amount</th>
            <th className="text-left p-4 font-medium text-gray-500">Linked Project</th>
            <th className="text-left p-4 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <DeliveryOrderRow
                key={order.id}
                order={order}
                linkedProject={order.linkedProject}
                onViewOrder={onViewOrder}
                onEditOrder={onEditOrder}
                onDeleteOrder={onDeleteOrder}
              />
            ))
          ) : (
            <tr>
              <td colSpan={9} className="p-4 text-center text-gray-500">
                No delivery orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
