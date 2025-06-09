import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Calendar, MapPin, User } from "lucide-react"
import Link from "next/link"

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/transactions">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Project {params.id}</h1>
        <div className="ml-auto">
          <Button variant="outline" className="ml-auto">
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Client Info</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <span>Apex Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>Marina Bay Tower</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Project Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-foreground">Status:</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Gondolas:</span>
                <span className="font-medium">2</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Dates</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div className="flex justify-between w-full">
                  <span className="text-foreground">Start Date:</span>
                  <span className="font-medium">25 Apr 2025</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div className="flex justify-between w-full">
                  <span className="text-foreground">Created:</span>
                  <span className="font-medium">23 Apr 2025</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList className="mb-6">
          <TabsTrigger value="delivery-orders">Delivery Orders</TabsTrigger>
          <TabsTrigger value="gondolas">Gondolas</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="delivery-orders">
          <DeliveryOrdersTab />
        </TabsContent>
        <TabsContent value="gondolas">
          <GondolasTab />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeliveryOrdersTab() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Orders</h2>
        <p className="text-foreground">No delivery orders found for this project.</p>
      </CardContent>
    </Card>
  )
}

function GondolasTab() {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Gondolas</h2>
        <p className="text-foreground">List of gondolas associated with this project</p>

        <div className="mt-4 border rounded-md overflow-hidden">
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center">
              <h3 className="text-lg font-medium">Gondola GND-001-2023</h3>
              <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                deployed
              </span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Location</h4>
              <p>Bay A, 15, Block 1</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Elevation</h4>
              <p>North</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Deployed Date</h4>
              <p>25 Apr 2025</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">Last Inspection</h4>
              <p>16 May 2025</p>
            </div>
          </div>
          <div className="p-6 border-t">
            <h4 className="font-medium mb-4">Documents</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-medium text-foreground">Type</th>
                  <th className="text-left pb-2 font-medium text-foreground">Name</th>
                  <th className="text-left pb-2 font-medium text-foreground">Uploaded</th>
                  <th className="text-left pb-2 font-medium text-foreground">Expiry</th>
                  <th className="text-left pb-2 font-medium text-foreground">Status</th>
                  <th className="text-left pb-2 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3">Deployment Document</td>
                  <td className="py-3">Deployment Document</td>
                  <td className="py-3">25 Apr 2025</td>
                  <td className="py-3">N/A</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Valid
                    </span>
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Safe Work Procedure</td>
                  <td className="py-3">Safe Work Procedure</td>
                  <td className="py-3">25 Apr 2025</td>
                  <td className="py-3">N/A</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Valid
                    </span>
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3">MOM Certificate</td>
                  <td className="py-3">MOM Certificate</td>
                  <td className="py-3">25 Apr 2025</td>
                  <td className="py-3">22 Jun 2025</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Expiring
                    </span>
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t">
            <h4 className="font-medium mb-4">Photos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border rounded-md overflow-hidden">
                <img
                  src="/placeholder.svg?height=200&width=300&query=gondola+installation"
                  alt="Gondola"
                  className="w-full h-48 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentsTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Deployment Documents</h2>
          <p className="text-foreground">List of all deployment documents attached to this project</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-foreground">DD Number</th>
                <th className="text-left p-4 font-medium text-foreground">Date</th>
                <th className="text-left p-4 font-medium text-foreground">Status</th>
                <th className="text-left p-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">DO-2023-0001</td>
                <td className="p-4">23 Apr 2025</td>
                <td className="p-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Active</span>
                </td>
                <td className="p-4">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
