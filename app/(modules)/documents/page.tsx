'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function DocumentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">All Documents</h1>

      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">All Documents</h2>
            <p className="text-foreground">Complete list of all documents across all gondolas</p>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input type="search" placeholder="Search documents..." className="pl-10" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-background">
                  <th className="text-left p-4 font-medium text-foreground">Gondola</th>
                  <th className="text-left p-4 font-medium text-foreground">Type</th>
                  <th className="text-left p-4 font-medium text-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-foreground">Uploaded</th>
                  <th className="text-left p-4 font-medium text-foreground">Expiry</th>
                  <th className="text-left p-4 font-medium text-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <DocumentRow
                  gondola="GND-001-2023"
                  type="Deployment Document"
                  name="Deployment Document"
                  uploaded="25 Apr 2025"
                  expiry="N/A"
                  status="Valid"
                />
                <DocumentRow
                  gondola="GND-001-2023"
                  type="Safe Work Procedure"
                  name="Safe Work Procedure"
                  uploaded="25 Apr 2025"
                  expiry="N/A"
                  status="Valid"
                />
                <DocumentRow
                  gondola="GND-001-2023"
                  type="MOM Certificate"
                  name="MOM Certificate"
                  uploaded="25 Apr 2025"
                  expiry="22 Jun 2025"
                  status="Expiring"
                />
                <DocumentRow
                  gondola="GND-002-2023"
                  type="Deployment Document"
                  name="Deployment Document"
                  uploaded="28 Apr 2025"
                  expiry="N/A"
                  status="Valid"
                />
                <DocumentRow
                  gondola="GND-002-2023"
                  type="Certificate of Serviceability"
                  name="Certificate of Serviceability"
                  uploaded="28 Apr 2025"
                  expiry="22 Jul 2025"
                  status="Valid"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface DocumentRowProps {
  gondola: string
  type: string
  name: string
  uploaded: string
  expiry: string
  status: "Valid" | "Expiring" | "Expired"
}

function DocumentRow({ gondola, type, name, uploaded, expiry, status }: DocumentRowProps) {
  return (
    <tr className="border-b hover:bg-background">
      <td className="p-4">{gondola}</td>
      <td className="p-4">{type}</td>
      <td className="p-4">{name}</td>
      <td className="p-4">{uploaded}</td>
      <td className="p-4">{expiry}</td>
      <td className="p-4">
        <StatusBadge status={status} />
      </td>
      <td className="p-4">
        <Button variant="outline" size="sm">
          View
        </Button>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Valid":
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Valid</span>
    case "Expiring":
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Expiring</span>
    case "Expired":
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Expired</span>
    default:
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
  }
}
