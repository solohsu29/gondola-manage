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

function DocumentsTab({ gondolaId }: { gondolaId: string }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const documents = useAppStore((s) => s.documents);
  const fetchDocumentsByGondolaId = useAppStore((s) => s.fetchDocumentsByGondolaId);

  // Controlled form state for upload
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocumentsByGondolaId(gondolaId);
  }, [gondolaId]);

  console.log('doc',documents)

  // Define DataTable columns for documents
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
      cell: (info) => info.row.original.expiry ? new Date(info.row.original.expiry).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (info) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.row.original.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{info.row.original.status || '-'}</span>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: (info) => {
        const doc = info.row.original;
        const documentUrl = (doc as any).fileUrl || `/api/document/${doc.id}/serve`;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(documentUrl, '_blank')}
          >
            View
          </Button>
        );
      },
    },
  ];

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
        throw new Error(error.error || "Failed to upload document");
      }
   
      toast.success("Document uploaded", {
        description: `${uploadName} uploaded successfully.`,
        className: "bg-[#14A44D] text-white"
      });
      setIsUploadDialogOpen(false);
      setUploadType(""); setUploadFile(null); setUploadName(""); setUploadExpiry(""); setUploadNotes("");
      fetchDocumentsByGondolaId(gondolaId);
    } catch (err: any) {

      toast.error("Upload failed", {
        description: err.message || "Unknown error",
        className: "bg-destructive text-destructive-foreground"
      });
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
            <p className="text-gray-500">All documents associated with this gondola</p>
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
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentsTab;