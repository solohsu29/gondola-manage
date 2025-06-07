
import { Card, CardContent } from "@/components/ui/card"
import { useEffect } from "react"
import { useAppStore } from "@/lib/store"

export default function ShiftHistoryTab({ gondolaId }: { gondolaId: string }) {
    const {
      shiftHistory,
      shiftHistoryLoading,
      shiftHistoryError,
      fetchShiftHistoryByGondolaId,
    } = useAppStore()

    useEffect(() => {
      fetchShiftHistoryByGondolaId(gondolaId)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gondolaId])

    const getReasonLabel = (reason: string) => {
      switch (reason) {
        case "maintenance":
          return "Maintenance Required"
        case "client_request":
          return "Client Request"
        case "safety":
          return "Safety Concerns"
        case "optimization":
          return "Location Optimization"
        case "other":
          return "Other"
        default:
          return reason
      }
    }
  
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Shift History</h2>
            <p className="text-gray-500">Complete history of location changes for this gondola</p>
          </div>

          {shiftHistoryLoading ? (
            <div className="p-6 text-center text-gray-500">Loading shift history...</div>
          ) : shiftHistoryError ? (
            <div className="p-6 text-center text-red-500">{shiftHistoryError}</div>
          ) : shiftHistory.length > 0 ? (
            <div className="divide-y">
              {shiftHistory
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((shift) => (
                  <div key={shift.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div>
                          <h3 className="font-medium">Location Shift</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(shift.createdAt).toLocaleDateString()} at{" "}
                            {new Date(shift.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getReasonLabel(shift.reason)}
                      </span>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">From Location</h4>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="font-medium text-red-900">{shift.fromLocation}</p>
                          <p className="text-sm text-red-700">{shift.fromLocationDetail}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">To Location</h4>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="font-medium text-green-900">{shift.toLocation}</p>
                          <p className="text-sm text-green-700">{shift.toLocationDetail}</p>
                        </div>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Shift Date:</span>
                        <span className="ml-2 font-medium">{shift.shiftDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Shifted By:</span>
                        <span className="ml-2 font-medium">{shift.shiftedBy}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-2 font-medium">{getReasonLabel(shift.reason)}</span>
                      </div>
                    </div>
  
                    {shift.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                        <p className="text-sm">{shift.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No shift history found for this gondola.</p>
              <p className="text-sm mt-1">Location changes will appear here when shifts are made.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }