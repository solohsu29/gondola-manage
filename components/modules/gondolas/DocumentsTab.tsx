import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,DialogFooter,DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store";
import { toast } from "sonner"
import { DataTable } from '@/components/common/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { Document } from '@/types/document';
import { ExpiryStatusBadge } from "@/app/utils/statusUtils"


  // Define DataTable columns for documents
 

function DocumentsTab({ gondolaId }: { gondolaId: string }) {
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [editState, setEditState] = useState({
    title: '',
    category: '',
    expiry: '',
    notes: '',
    status: ''
  });
const [loading,setLoading] = useState(false)
const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
const {documents,fetchDocumentsByGondolaId,documentsLoading} = useAppStore()

// Controlled form state for upload
const [uploadType, setUploadType] = useState("");
const [uploadFile, setUploadFile] = useState<File | null>(null);
const [uploadName, setUploadName] = useState("");
const [uploadExpiry, setUploadExpiry] = useState("");
const [uploadNotes, setUploadNotes] = useState("");
const [uploading, setUploading] = useState(false);
  const handleEditDialogOpen = (doc: Document) => {
    setEditDoc(doc);
    let expiryValue = '';
    if (typeof doc.expiry === 'string' && doc.expiry.length >= 10) {
      expiryValue = doc.expiry.slice(0, 10);
    }
    setEditState({
      title: doc.title || '',
      category: doc.category || '',
      expiry: expiryValue,
      notes: doc.notes || '',
      status: doc.status || ''
    });
    setEditDialogOpen(true);
  };
  const columns: ColumnDef<Document>[] = [
    {
      header: 'Type',
      accessorKey: 'category',
      cell: (info) => info.getValue() || '-',
    },
    {
      header: 'Name',
      accessorKey: 'title',
      cell: (info) => info.getValue() || '-',
    },
    {
      header: 'Uploaded',
      accessorKey: 'uploaded',
      cell: (info) => info.row.original.uploaded ? new Date(info.row.original.uploaded).toLocaleDateString() : '-',
    },
    {
      header: 'Expiry',
      accessorKey: 'expiry',
      cell: (info) => {
        const expiry = info.row.original.expiry;
        if (!expiry) return 'N/A';
        const [y, m, d] = expiry.split('-');
        if (y && m && d){
          return `${d}-${m}-${y}`;
        } 
        return expiry;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
     
        cell: ({ row }) => {
            const expiry = row.getValue("expiry") as string | undefined | null;
            return <ExpiryStatusBadge expiry={expiry} />;
          },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (info) => {
        const doc = info.row.original;
        const documentUrl = (doc as any).fileUrl || `/api/document/${doc.id}/serve`;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(documentUrl, '_blank')}
            >
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditDialogOpen(doc)}
            >
              Edit
            </Button>
          </div>
        );
      },
    },

  ];
 

  const handleEditSave = async () => {
    if (!editDoc) return;
    try {
      setLoading(true)
      const payload = {
        title: editState.title,
        category: editState.category,
        expiry: editState.expiry,
        notes: editState.notes,
        status: editState.status
      };
      const res = await fetch(`/api/gondola/${gondolaId}/documents/${editDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update document');
        setLoading(false)
      }
      toast.success('Document updated', {
        description: `${editState.title || 'Document'} updated successfully.`,
        className: 'bg-[#14A44D] text-white'
      });
      setEditDialogOpen(false);
      setEditDoc(null);
      fetchDocumentsByGondolaId(gondolaId);
      setLoading(false)
    } catch (err: any) {
      toast.error('Update failed', {
        description: err.message || 'Unknown error',
        className: 'bg-destructive text-destructive-foreground'
      });
      setLoading(false)
    }
  };


  useEffect(() => {
    fetchDocumentsByGondolaId(gondolaId);
  }, [gondolaId]);



  const handleUploadDocument = async () => {
    if (!uploadType || !uploadFile) {
      
      toast.error("Missing fields", {
        description: "Please select a document type and file.",
        className: "bg-destructive text-destructive-foreground"
      });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("type", uploadType);
    formData.append("file", uploadFile);
    formData.append("name", uploadName);
    formData.append("expiry", uploadExpiry);
    formData.append("notes", uploadNotes);
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/documents`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        setUploading(false)
        throw new Error(error.error || "Failed to upload document");
       
      }
   
      toast.success("Document uploaded", {
        description: `${uploadName} uploaded successfully.`,
        className: "bg-[#14A44D] text-white"
      });
      setIsUploadDialogOpen(false);
      setUploadType(""); setUploadFile(null); setUploadName(""); setUploadExpiry(""); setUploadNotes("");
      fetchDocumentsByGondolaId(gondolaId);
      setUploading(false)
    } catch (err: any) {

      toast.error("Upload failed", {
        description: err.message || "Unknown error",
        className: "bg-destructive text-destructive-foreground"
      });
      setUploading(false)
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Documents</h2>
            <p className="text-foreground">All documents associated with this gondola</p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>Upload Document</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Upload a new document for this gondola</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select name="documentType" value={uploadType} onValueChange={setUploadType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deployment Document">Deployment Document</SelectItem>
                      <SelectItem value="Safe Work Procedure">Safe Work Procedure</SelectItem>
                      <SelectItem value="MOM Certificate">MOM Certificate</SelectItem>
                      <SelectItem value="Inspection Report">Inspection Report</SelectItem>
                      <SelectItem value="Maintenance Record">Maintenance Record</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentFile">Select File *</Label>
                  <Input id="documentFile" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentName">Document Name</Label>
                  <Input id="documentName" placeholder="Enter document name (optional)" value={uploadName} onChange={e => setUploadName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
                  <Input id="expiryDate" type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentNotes">Notes</Label>
                  <Textarea id="documentNotes" placeholder="Any additional notes about this document" value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleUploadDocument}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto">
          {/* DataTable for documents */}
          <DataTable
            columns={columns}
            data={documents}
            loading={documentsLoading}
          />
        </div>

        {/* Edit Document Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Document</DialogTitle>
              <DialogDescription>Edit document details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editDocTitle">Document Name</Label>
                <Input id="editDocTitle" value={editState.title} onChange={e => setEditState(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDocType">Document Type</Label>
                <Select value={editState.category} onValueChange={val => setEditState(s => ({ ...s, category: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deployment Document">Deployment Document</SelectItem>
                    <SelectItem value="Safe Work Procedure">Safe Work Procedure</SelectItem>
                    <SelectItem value="MOM Certificate">MOM Certificate</SelectItem>
                    <SelectItem value="Inspection Report">Inspection Report</SelectItem>
                    <SelectItem value="Maintenance Record">Maintenance Record</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDocExpiry">Expiry Date</Label>
                <Input id="editDocExpiry" type="date" value={editState.expiry} onChange={e => setEditState(s => ({ ...s, expiry: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDocStatus">Status</Label>
                <Input id="editDocStatus" value={editState.status} onChange={e => setEditState(s => ({ ...s, status: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDocNotes">Notes</Label>
                <Textarea id="editDocNotes" value={editState.notes} onChange={e => setEditState(s => ({ ...s, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEditSave} disabled={loading}>
               {loading ? "Saving...":"Save Changes"} 
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default DocumentsTab;