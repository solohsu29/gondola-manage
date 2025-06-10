import {  useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link";
import {v4 as uuid} from 'uuid'

export default function GondolasTab({ gondolas }: { gondolas: any[] }) {
    const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)
    const [selectedGondola, setSelectedGondola] = useState<any>(null)
    const [isScheduleInspectionDialogOpen, setIsScheduleInspectionDialogOpen] = useState(false)
    const [selectedGondolaForInspection, setSelectedGondolaForInspection] = useState<any>(null)
  const [success,setSuccess] = useState('')
  const [loading,setLoading] = useState(false)
    // Schedule Inspection Form State
    const [scheduleInspectionData, setScheduleInspectionData] = useState({
      inspectionType: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionTime: '',
      inspector: '',
      priority: '',
      notes: '',
      notifyClient: '',
    });
  
    
    const { shiftHistory,fetchShiftHistory,shiftHistoryLoading } = useAppStore()
    useEffect(()=>{
      fetchShiftHistory()
    },[success])

  
    const [shiftData, setShiftData] = useState({
      newLocation: '',
      newLocationDetail: '',
      shiftDate: new Date().toISOString().split("T")[0],
      shiftReason: '',
      notes: '',
    });

    async function handleScheduleInspectionSubmit() {
      const { inspectionType, inspectionDate, inspectionTime, inspector } = scheduleInspectionData;
      if (!(inspectionType && inspectionDate && inspectionTime && inspector)) {
        alert('Please fill in all required fields');
        return;
      }
      try {
        setLoading(true)
        const res = await fetch(`/api/gondola/${selectedGondolaForInspection?.id}/schedule-inspection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleInspectionData),
        });
        if (!res.ok) {
          let errorMsg = 'Failed to schedule inspection.';
          try {
            const errorData = await res.json();
            if (errorData && errorData.error) errorMsg = errorData.error + (errorData.details ? `: ${errorData.details}` : '');
          } catch {}
      setLoading(false)
          toast.error( 'Error',{description: errorMsg, className: 'bg-destructive text-white' });
          return;
        }
     setLoading(false)
        toast.success( 'Success',{description: 'Inspection scheduled successfully!', className: 'bg-[#14AA4d] text-white' });
        setIsScheduleInspectionDialogOpen(false);
        setSelectedGondolaForInspection(null);
        setSuccess(uuid())
      } catch (err) {
        setLoading(false)
        let message = 'Failed to schedule inspection.';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }
     
        toast.error( 'Error',{description: message, className: 'bg-destructive text-white' });
      }
    }
  
  
    async function handleShiftGondolaSubmit() {
      const payload = {
        ...shiftData,
        currentLocation: selectedGondola?.location || '',
        currentLocationDetail: selectedGondola?.locationDetail || '',
      };
      try {
        setLoading(true)
        const res = await fetch(`/api/gondola/${selectedGondola?.id}/shift`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let errorMsg = 'Failed to shift gondola.';
          try {
            const errorData = await res.json();
            if (errorData && errorData.error) errorMsg = errorData.error + (errorData.details ? `: ${errorData.details}` : '');
          } catch {}
       

          toast.error( 'Error',{description: errorMsg, className: 'bg-destructive text-white' });
          return;
        }
     
        toast.success( 'Success',{description: 'Gondola location updated and shift recorded.', className: 'bg-[#14AA4d] text-white' });

        setLoading(false)
        setIsShiftDialogOpen(false);
     setSuccess(uuid())
      } catch (err) {
        setLoading(false)
        let message = 'Failed to shift gondola.';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }
      
        toast.error( 'Error',{description: message, className: 'bg-destructive text-white' });
      }
    }
  
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gondolas ({gondolas?.length || 0})</h2>
          <p className="text-foreground mb-4">List of gondolas associated with this project</p>
  
          {gondolas.length > 0 ? (
            <div className="space-y-6">
              {gondolas.map((gondola) => (
                <div key={gondola.id} className="border rounded-md overflow-hidden">
                  <div className="p-6 border-b bg-gray-50">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">Gondola {gondola.serialNumber}</h3>
                      <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {gondola.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Location</h4>
                      <p>{gondola.location}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Serial Number</h4>
                      <p>{gondola.serialNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Last Inspection</h4>
                      <p>{gondola.lastInspection?.split("T")[0]}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Next Inspection</h4>
                      <p>{gondola.nextInspection?.split("T")[0]}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1">Location Detail</h4>
                      <p>{gondola.locationDetail}</p>
                    </div>
                  </div>
                  <div className="p-6 border-t">
                    <h4 className="font-medium mb-4">Recent Shifts</h4>
                    {(() => {
                    
                      const gondolaShifts = shiftHistory
                        .filter((shift) => shift.gondolaId === gondola.id)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 3) // Show only last 3 shifts
  
                      return gondolaShifts.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {gondolaShifts.map((shift) => (
                            <div key={shift.id} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium">
                                    {shift.fromLocation} → {shift.toLocation}
                                  </span>
                                  <div className="text-foreground">
                                    {new Date(shift.createdAt).toLocaleDateString()} • {shift.reason?.split('_').join(' ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                            <Link href={`/gondolas/${gondola.id}?tab=shift-history`}>View all shifts</Link>
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground mb-4">No recent shifts</p>
                      )
                    })()}
  
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/gondolas/${gondola.id}`}>View Details</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGondola(gondola)
                          setIsShiftDialogOpen(true)
                        }}
                      >
                        Shift Location
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGondolaForInspection(gondola)
                          setIsScheduleInspectionDialogOpen(true)
                        }}
                      >
                        Schedule Inspection
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : shiftHistoryLoading ? <div className="text-center py-8 text-foreground"> Loading...</div> :  <div className="text-center py-8 text-foreground">
          <p>No gondolas linked to this project.</p>
         
        </div>}
        <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Shift Gondola Location</DialogTitle>
            <DialogDescription>Update the location details for {selectedGondola?.serialNumber}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Input id="currentLocation" value={selectedGondola?.location || ""} disabled readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocation">New Location *</Label>
              <Input placeholder="e.g., Tower C, Bay 2" required value={shiftData.newLocation} onChange={e => setShiftData(sd => ({ ...sd, newLocation: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocationDetail">New Location Detail *</Label>
              <Input placeholder="e.g., 25th Floor, South" required value={shiftData.newLocationDetail} onChange={e => setShiftData(sd => ({ ...sd, newLocationDetail: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftReason">Reason for Shift</Label>
              <Select name="shiftReason" value={shiftData.shiftReason} onValueChange={val => setShiftData(sd => ({ ...sd, shiftReason: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance Required</SelectItem>
                  <SelectItem value="client_request">Client Request</SelectItem>
                  <SelectItem value="safety">Safety Concerns</SelectItem>
                  <SelectItem value="optimization">Location Optimization</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftDate">Shift Date *</Label>
              <Input type="date" value={shiftData.shiftDate} onChange={e => setShiftData(sd => ({ ...sd, shiftDate: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Input placeholder="Any additional information about the shift" value={shiftData.notes} onChange={e => setShiftData(sd => ({ ...sd, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleShiftGondolaSubmit}
              disabled={loading}
               
            >
             {loading?"Confirming ...": "Confirm Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isScheduleInspectionDialogOpen} onOpenChange={setIsScheduleInspectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
            <DialogDescription>Schedule an inspection for {selectedGondolaForInspection?.serialNumber}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionType">Inspection Type *</Label>
              <Select name="inspectionType" value={scheduleInspectionData.inspectionType} onValueChange={val => setScheduleInspectionData(sd => ({ ...sd, inspectionType: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Inspection</SelectItem>
                  <SelectItem value="safety">Safety Inspection</SelectItem>
                  <SelectItem value="maintenance">Maintenance Inspection</SelectItem>
                  <SelectItem value="compliance">Compliance Inspection</SelectItem>
                  <SelectItem value="pre_deployment">Pre-Deployment Inspection</SelectItem>
                  <SelectItem value="post_incident">Post-Incident Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">Inspection Date *</Label>
              <Input id="inspectionDate" type="date" min={new Date().toISOString().split("T")[0]} required value={scheduleInspectionData.inspectionDate} onChange={e => setScheduleInspectionData(sd => ({ ...sd, inspectionDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionTime">Inspection Time *</Label>
              <Input id="inspectionTime" type="time" required value={scheduleInspectionData.inspectionTime} onChange={e => setScheduleInspectionData(sd => ({ ...sd, inspectionTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector">Inspector *</Label>
              <Select name="inspector" value={scheduleInspectionData.inspector} onValueChange={val => setScheduleInspectionData(sd => ({ ...sd, inspector: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select inspector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john_smith">John Smith - Senior Inspector</SelectItem>
                  <SelectItem value="sarah_jones">Sarah Jones - Safety Inspector</SelectItem>
                  <SelectItem value="mike_chen">Mike Chen - Maintenance Inspector</SelectItem>
                  <SelectItem value="lisa_wong">Lisa Wong - Compliance Inspector</SelectItem>
                  <SelectItem value="external">External Inspector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select name="priority" value={scheduleInspectionData.priority} onValueChange={val => setScheduleInspectionData(sd => ({ ...sd, priority: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Routine</SelectItem>
                  <SelectItem value="normal">Normal - Standard</SelectItem>
                  <SelectItem value="high">High - Important</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspectionNotes">Notes</Label>
              <Input id="inspectionNotes" placeholder="Any specific requirements or notes for the inspection" value={scheduleInspectionData.notes} onChange={e => setScheduleInspectionData(sd => ({ ...sd, notes: e.target.value }))} />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="notifyClient">Notify Client</Label>
              <Select name="notifyClient" value={scheduleInspectionData.notifyClient} onValueChange={val => setScheduleInspectionData(sd => ({ ...sd, notifyClient: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Client notification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Send notification</SelectItem>
                  <SelectItem value="no">No - Internal only</SelectItem>
                  <SelectItem value="after">After inspection completion</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsScheduleInspectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={handleScheduleInspectionSubmit}
            >
          {loading?"Scheduling ... ":"Schedule Inspection"}    
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </CardContent>
      </Card>
    )
  }
  