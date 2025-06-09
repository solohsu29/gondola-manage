import * as React from "react";
import { useEffect,useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { useAppStore } from "@/lib/store";
import { Gondola } from "@/types/gondola";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "deployed":
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">deployed</Badge>
    case "in use":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">in use</Badge>
    case "maintenance":
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">maintenance</Badge>
    case "off-hired":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">off-hired</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}
export function GondolasDataTable({refresh}:{refresh:string}) {
  const { gondolas, gondolasLoading, gondolasError, fetchGondolas, projects } = useAppStore();
   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editData,setEditData] = useState({})
    const [deleteData,setDeleteData] = useState({})
    const [loading,setLoading] = useState(false)
    
    const columns: ColumnDef<Gondola & { projectId?: string; image?: string }, any>[] = [
      {
        id: "image",
        header: "Image",
        cell: ({ row }) => (
          <img
            src={row.original.photoDataBase64 ? `data:image/jpeg;base64,${row.original.photoDataBase64}` : "/placeholder.svg?height=50&width=50"}
            alt={row.original.photoName || row.original.serialNumber || "Gondola"}
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ),
      },
      {
        accessorKey: "id",
        header: "Gondola ID",
        cell: ({ row }) => {
          return(
            <Link href={`/gondolas/${row?.original?.id}`} className="text-blue-600 hover:underline">{row.original.id?.slice(0, 10)}</Link>
          )
        },
      },
      {
        accessorKey: "serialNumber",
        header: "Serial Number",
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "locationDetail",
        header: "Location Detail",
      },
      {
        accessorKey: "lastInspection",
        header: "Last Inspection",
        cell: ({ row }) => row.original.lastInspection?.split("T")[0] || "-",
      },
      {
        accessorKey: "nextInspection",
        header: "Next Inspection",
        cell: ({ row }) => row.original.nextInspection?.split("T")[0] || "-",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row?.original?.status}/>,
      },
      {
        accessorKey: "projects",
        header: "Linked Project",
        cell: ({ row }) => {
          const projects = row?.original?.projects;
          if (Array.isArray(projects) && projects.length > 0) {
            return (
              <div>
                {projects.map((project: any, idx: number) =>
                  <span key={project.id}>
                    <Link href={`/projects/${project.id}`} className="text-blue-600 underline">
                      { project.id?.slice(0,8)}
                    </Link>
                    {idx < projects.length - 1 && ', '}
                  </span>
                )}
              </div>
            );
          } else {
            return <span>Not Linked</span>;
          }
        },
      },
      // Actions column placeholder
      {
        header: "Actions",
        id: "actions",
        cell: ({row}) =>  <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => handleEditClick(row?.original)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() =>{
          setDeleteData(row?.original)
          setIsDeleteDialogOpen(true)
        }}>
          Delete
        </Button>
      </div>,
      },
    ];
  useEffect(() => {
    fetchGondolas();
  }, [refresh]);


  const { updateGondolaAsync, deleteGondolaAsync } = useAppStore();

  // Controlled state for edit dialog
  const [editFields, setEditFields] = useState<any>({});


  const handleEditClick = (rowData: any) => {
    setEditData(rowData);
    setEditFields(rowData);
    setIsEditDialogOpen(true);
  };

  // Separate handlers for dialog actions
  const onUpdateGondola = async () => {
    if (!updateGondolaAsync) {
      toast.error("Update function not available.")
      return;
    }
    if (editFields?.serialNumber && editFields?.location && editFields?.status) {
      setLoading(true)
      await updateGondolaAsync(editFields?.id, {
        serialNumber: editFields.serialNumber,
        location: editFields.location,
        locationDetail: editFields.locationDetail,
        status: editFields.status,
        lastInspection: editFields.lastInspection,
        nextInspection: editFields.nextInspection,
  //       ...(editFields.photoName ? { photoName: editFields.photoName } : {}),
  // ...(editFields.photoData ? { photoData: editFields.photoData } : {}),
      });
      setIsEditDialogOpen(false);
      setLoading(false)
    } else {
      toast.error("Please fill in all required fields")
    }
  };


  const onDeleteGondola = async () => {
    if (!deleteGondolaAsync) {
      alert('Delete function not available.');
      return;
    }
    await deleteGondolaAsync((deleteData as any)?.id);
    setIsDeleteDialogOpen(false);
    fetchGondolas();
  };


  return (
    <>
    <DataTable columns={columns} data={gondolas} pageSize={10} loading={gondolasLoading}/>
    {/* Edit Gondola Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Gondola</DialogTitle>
          <DialogDescription>Update gondola information</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSerialNumber">Serial Number *</Label>
              <Input id="editSerialNumber" value={editFields?.serialNumber || ''} required onChange={e => setEditFields((prev: any) => ({ ...prev, serialNumber: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="editLocation">Location *</Label>
              <Input id="editLocation" value={editFields?.location || ''} required onChange={e => setEditFields((prev: any) => ({ ...prev, location: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="editLocationDetail">Location Detail</Label>
              <Input id="editLocationDetail" value={editFields?.locationDetail || ''} onChange={e => setEditFields((prev: any) => ({ ...prev, locationDetail: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="editStatus">Status *</Label>
              <Select name="editStatus" value={editFields?.status || ''} onValueChange={val => setEditFields((prev: any) => ({ ...prev, status: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deployed">Deployed</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Off-Hired">Off-Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editLastInspection">Last Inspection Date</Label>
              <Input id="editLastInspection" type="date"  value={editFields?.lastInspection ? editFields.lastInspection.split('T')[0] : ''}
                onChange={e => setEditFields((prev: any) => ({ ...prev, lastInspection: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="editNextInspection">Next Inspection Due</Label>
              <Input id="editNextInspection" type="date" value={editFields?.nextInspection ? editFields.nextInspection.split('T')[0] : ''}
                onChange={e => setEditFields((prev: any) => ({ ...prev, nextInspection: e.target.value }))} />
            </div>

         
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={onUpdateGondola}
          >
           {loading ? "Updating...":"Update Gondola"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Delete Gondola Dialog */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete gondola {(deleteData as any)?.id}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-destructive font-semibold">Warning: All associated data will be permanently deleted.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            onClick={onDeleteGondola}
          >
            Delete Gondola
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
