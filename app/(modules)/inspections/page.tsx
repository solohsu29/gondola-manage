import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, ChevronDown } from "lucide-react"
import Link from "next/link"

export default function InspectionsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inspections</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Schedule Inspection</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col sm:flex-row gap-4 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input type="search" placeholder="Search inspections..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>All Status</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-500">Inspection ID</th>
                  <th className="text-left p-4 font-medium text-gray-500">Gondola</th>
                  <th className="text-left p-4 font-medium text-gray-500">Type</th>
                  <th className="text-left p-4 font-medium text-gray-500">Date</th>
                  <th className="text-left p-4 font-medium text-gray-500">Inspector</th>
                  <th className="text-left p-4 font-medium text-gray-500">Status</th>
                  <th className="text-left p-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                <InspectionRow
                  id="INS-2023-001"
                  gondola="GND-001-2023"
                  type="Monthly"
                  date="16 May 2025"
                  inspector="John Smith"
                  status="Completed"
                />
                <InspectionRow
                  id="INS-2023-002"
                  gondola="GND-002-2023"
                  type="Monthly"
                  date="30 Apr 2025"
                  inspector="Jane Doe"
                  status="Completed"
                />
                <InspectionRow
                  id="INS-2023-003"
                  gondola="GND-003-2023"
                  type="Repair"
                  date="21 Mar 2025"
                  inspector="Mike Johnson"
                  status="Completed"
                />
                <InspectionRow
                  id="INS-2023-004"
                  gondola="GND-001-2023"
                  type="Monthly"
                  date="14 Jul 2025"
                  inspector="Not Assigned"
                  status="Scheduled"
                />
                <InspectionRow
                  id="INS-2023-005"
                  gondola="GND-002-2023"
                  type="Monthly"
                  date="31 Jul 2025"
                  inspector="Not Assigned"
                  status="Scheduled"
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface InspectionRowProps {
  id: string
  gondola: string
  type: string
  date: string
  inspector: string
  status: "Completed" | "Scheduled" | "Overdue" | "In Progress"
}

function InspectionRow({ id, gondola, type, date, inspector, status }: InspectionRowProps) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <Link href={`/inspections/${id}`} className="text-blue-600 hover:underline">
          {id}
        </Link>
      </td>
      <td className="p-4">
        <Link href={`/gondolas/${gondola}`} className="text-blue-600 hover:underline">
          {gondola}
        </Link>
      </td>
      <td className="p-4">{type}</td>
      <td className="p-4">{date}</td>
      <td className="p-4">{inspector}</td>
      <td className="p-4">
        <StatusBadge status={status} />
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            View
          </Button>
          {status === "Scheduled" && (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Completed":
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
    case "Scheduled":
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Scheduled</span>
    case "Overdue":
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Overdue</span>
    case "In Progress":
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">In Progress</span>
      )
    default:
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>
  }
}
