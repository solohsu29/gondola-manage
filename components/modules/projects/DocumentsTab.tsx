
import { columns as documentColumns, Document as DocumentType } from "@/components/ui/document-columns";
import { DataTable } from "@/components/common/data-table"
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"
import {  Upload} from "lucide-react"
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

export default function DocumentsTab({ projectId }: { projectId: string }) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState('');
const {fetchDocuments,documents,documentsLoading,documentsError} = useAppStore()

useEffect(()=>{
  if (projectId) { // Ensure projectId is available
    fetchDocuments(projectId);
  }
},[projectId, fetchDocuments])
console.log('documents',documents)
  const resetUploadForm = () => {
    setDocName('');
    setDocType('');
    setSelectedFile(null);
    setExpiryDate('');
    setStatus('');
    const fileInput = document.getElementById("file") as HTMLInputElement;
    if (fileInput) fileInput.value = ''; // Reset file input
  };

  const handleDialogChange = (open: boolean) => {
    setIsUploadDialogOpen(open);
    if (!open) {
      resetUploadForm();
    }
  };

  async function handleDocumentUploadSubmit() {
    if (!docName || !docType || !selectedFile) {
      toast.error("Error",{description: 'Please fill in all fields and select a file.', className: 'bg-destructive text-white' });
      return;
    }

    const formData = new FormData();
    formData.append('docName', docName);
    formData.append('docType', docType);
    formData.append('projectId', projectId);
    formData.append('file', selectedFile);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (status) formData.append('status', status);

    try {
      const res = await fetch(`/api/project/${projectId}/document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to upload document.' }));
        throw new Error(errorData.error || 'Server error during upload.');
      }

      toast.success("Success",{description: 'Document uploaded successfully!',className:"bg-[#14A44d] text-white"})
      handleDialogChange(false); // This will also reset the form
      if (projectId) fetchDocuments(projectId); // Refresh documents list
    } catch (err) {
      let message = 'Failed to upload document.';
      if (err instanceof Error) message = err.message;
      toast.error(" 'Upload Error'",{description:message, className: 'bg-destructive text-white' });
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Deployment Documents</h2>
          <Dialog open={isUploadDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Fill in the details below and select a file to upload.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Label htmlFor="docName" className="text-right w-[120px]">
                    Document Name
                  </Label>
                  <Input id="docName" value={docName} onChange={(e) => setDocName(e.target.value)} className="col-span-3" placeholder="e.g., Site Safety Plan" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Label htmlFor="docType" className="text-right w-[120px]">
                    Document Type
                  </Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SWP">Safe Work Procedure (SWP)</SelectItem>
                      <SelectItem value="RiskAssessment">Risk Assessment</SelectItem>
                      <SelectItem value="Permit">Permit to Work</SelectItem>
                      <SelectItem value="Inspection">Inspection Report</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Label htmlFor="file" className="text-right w-[120px]">
                    File
                  </Label>
                  <Input id="file" type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="col-span-3" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Label htmlFor="expiryDate" className="text-right w-[120px]">
                    Expiry Date
                  </Label>
                  <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="col-span-3" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Label htmlFor="status" className="text-right w-[120px]">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleDocumentUploadSubmit}
                  disabled={documentsLoading}
                >
                 {documentsLoading ? "Uploading ...":"Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {documentsLoading && <p>Loading documents...</p>}
        {documentsError && <p className="text-red-500">Error loading documents: {documentsError}</p>}
        {!documentsLoading && !documentsError && (
          <DataTable columns={documentColumns} data={documents as DocumentType[]} loading={documentsLoading}/>
        )}
      </CardContent>
    </Card>
  )
}
