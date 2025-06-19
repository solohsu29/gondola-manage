import { ExpiryStatusBadge } from '@/app/utils/statusUtils'
import { DataTable } from '@/components/common/data-table'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateDMY } from '@/app/utils/formatDate'

export type DocumentType = {
  id: string
  name: string
  type: string
  title?: string | null
  category?: string | null
  uploaded: string
  expiry?: string | null
  status?: string | null
  fileUrl?: string | null
  notes?: string
}
export default function DocumentsTab ({ projectId }: { projectId: string }) {
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<DocumentType | null>(null)
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<DocumentType | null>(null)
  const [editState, setEditState] = useState({
    title: '',
    category: '',
    expiry: '',
    notes: ''
  })

  // Open the edit dialog and populate state
  const handleEditDialogOpen = (doc: DocumentType) => {
    setEditDoc(doc)
    let expiryValue = ''
    if (typeof doc.expiry === 'string') {
      if (doc.expiry.length >= 10) {
        expiryValue = doc.expiry.slice(0, 10)
      } else if (doc.expiry.length > 0) {
        expiryValue = doc.expiry
      }
    } else if ((doc.expiry as any) instanceof Date) {
      if (doc.expiry != null) {
        const expiryDate: Date = doc.expiry as Date
        expiryValue = expiryDate.toISOString().slice(0, 10)
      } else {
        expiryValue = ''
      }
    } else if (doc.expiry !== null && doc.expiry !== undefined) {
      // Unexpected type, log for debugging
      // eslint-disable-next-line no-console
      console.warn(
        'Document expiry is not a string or Date:',
        doc.expiry,
        typeof doc.expiry
      )
      try {
        expiryValue = String(doc.expiry).slice(0, 10)
      } catch (e) {
        expiryValue = ''
      }
    }
    setEditState({
      title: doc.title || '',
      category: doc.category || '',
      expiry: expiryValue,
      notes: doc.notes || ''
    })
    setEditDialogOpen(true)
  }

  // Save changes to the document
  const handleEditSave = async () => {
    if (!editDoc) return
    try {
      setLoading(true)
      const payload = {
        title: editState.title,
        category: editState.category,
        expiry: editState.expiry,
        notes: editState.notes
      }
      const res = await fetch(
        `/api/project/${projectId}/document/${editDoc.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update document')
      }
      toast.success('Document updated', {
        description: `${editState.title || 'Document'} updated successfully.`,
        className: 'bg-[#14A44D] text-white'
      })
      setEditDialogOpen(false)
      setEditDoc(null)
      if (projectId) fetchDocuments(projectId)
      setLoading(false)
    } catch (err: any) {
      toast.error('Update failed', {
        description: err.message || 'Unknown error',
        className: 'bg-destructive text-white'
      })
      setLoading(false)
    }
  }
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [expiryDate, setExpiryDate] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const { fetchDocuments, documents, documentsLoading, documentsError } =
    useAppStore()

  // Custom columns for DataTable, with edit button in actions
  const columns: ColumnDef<DocumentType>[] = [
    {
      accessorKey: 'id',
      header: 'Document ID',
      cell: ({ row }) => {
        // Display user-provided title, fallback to actual filename if title is not set
        return (
          <div className='font-medium'>{row?.original?.id?.slice(0, 10)}</div>
        )
      }
    },
    {
      accessorKey: 'title', // Primarily sort/filter by title
      header: 'Document Name',
      cell: ({ row }) => {
        const document = row.original
        // Display user-provided title, fallback to actual filename if title is not set
        return (
          <div className='font-medium'>{document.title || document.name}</div>
        )
      }
    },
    {
      accessorKey: 'category', // Primarily sort/filter by category
      header: 'Type', // Keep header label as "Type"
      cell: ({ row }) => {
        const document = row.original
        // Display user-provided category, fallback to actual MIME type if category is not set
        return (
          <div className='font-medium'>
            {document.category || document.type}
          </div>
        )
      }
    },
    {
      accessorKey: 'uploaded',
      header: 'Uploaded Date',
      cell: ({ row }) => {
        const date = row.getValue('uploaded')
        return <div className='font-medium'>{formatDateDMY(row?.getValue('uploaded'))}</div>
      }
    },
    {
      accessorKey: 'expiry',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const expiryDate = row.getValue('expiry') as string | undefined | null
        if (!expiryDate) return <div className='text-foreground'>N/A</div>
        const date =expiryDate
        return <div className='font-medium'>{formatDateDMY(date)}</div>
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const expiry = row.getValue('expiry') as string | undefined | null
        return <ExpiryStatusBadge expiry={expiry} />
      }
    },

    {
      id: 'actions',
      cell: ({ row }: { row: any }) => {
        const doc = row.original
        const documentUrl =
          (doc as any).fileUrl || `/api/document/${doc.id}/serve`
        return (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.open(documentUrl, '_blank')}
            >
              View
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleEditDialogOpen(doc)}
            >
              Edit
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setDeleteDoc(doc)
                setDeleteDialogOpen(true)
              }}
            >
              Delete
            </Button>
          </div>
        )
      }
    }
  ]

  useEffect(() => {
    if (projectId) {
      // Ensure projectId is available
      fetchDocuments(projectId)
    }
  }, [projectId, fetchDocuments])

  const resetUploadForm = () => {
    setDocName('')
    setDocType('')
    setSelectedFile(null)
    setExpiryDate('')
    setStatus('')
    const fileInput = document.getElementById('file') as HTMLInputElement
    if (fileInput) fileInput.value = '' // Reset file input
  }

  const handleDialogChange = (open: boolean) => {
    setIsUploadDialogOpen(open)
    if (!open) {
      resetUploadForm()
    }
  }

  async function handleDocumentUploadSubmit () {
    if (!docName || !docType || !selectedFile) {
      toast.error('Error', {
        description: 'Please fill in all fields and select a file.',
        className: 'bg-destructive text-white'
      })
      return
    }

    const formData = new FormData()
    formData.append('docName', docName)
    formData.append('docType', docType)
    formData.append('projectId', projectId)
    formData.append('file', selectedFile)
    if (expiryDate) formData.append('expiryDate', expiryDate)
    if (status) formData.append('status', status)
    setLoading(true)
    try {
      const res = await fetch(`/api/project/${projectId}/document`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Failed to upload document.' }))
        setLoading(false)
        throw new Error(errorData.error || 'Server error during upload.')
      }

      toast.success('Success', {
        description: 'Document uploaded successfully!',
        className: 'bg-[#14A44d] text-white'
      })
      setLoading(false)
      handleDialogChange(false) // This will also reset the form
      if (projectId) fetchDocuments(projectId) // Refresh documents list
    } catch (err) {
      setLoading(false)
      let message = 'Failed to upload document.'
      if (err instanceof Error) message = err.message
      toast.error(" 'Upload Error'", {
        description: message,
        className: 'bg-destructive text-white'
      })
    }
  }

  const handleDeleteProjectDoc = async () => {
    if (!deleteDoc) return
    try {
      setLoading(true)
      const res = await fetch(
        `/api/project/${projectId}/document/${deleteDoc.id}`,
        {
          method: 'DELETE'
        }
      )
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete document')
      }
      toast.success('Document deleted', {
        description: `${
          deleteDoc.title || deleteDoc.name
        } deleted successfully.`,
        className: 'bg-[#14AA4d] text-white'
      })
      setDeleteDialogOpen(false)
      setDeleteDoc(null)
      if (projectId) fetchDocuments(projectId)
    } catch (err: any) {
      toast.error('Delete failed', {
        description: err.message || 'Unknown error',
        className: 'bg-destructive text-white'
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-semibold'>Deployment Documents</h2>
          <Dialog open={isUploadDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button>
                <Upload className='mr-2 h-4 w-4' /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
                <DialogDescription>
                  Fill in the details below and select a file to upload.
                </DialogDescription>
              </DialogHeader>
              <div className='flex flex-col gap-4 py-4'>
                <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <Label htmlFor='docName' className='text-right w-[120px]'>
                    Document Name
                  </Label>
                  <Input
                    id='docName'
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    className='col-span-3'
                    placeholder='e.g., Site Safety Plan'
                  />
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <Label htmlFor='docType' className='text-right w-[120px]'>
                    Document Type
                  </Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className='col-span-3'>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='SWP'>
                        Safe Work Procedure (SWP)
                      </SelectItem>
                      <SelectItem value='RiskAssessment'>
                        Risk Assessment
                      </SelectItem>
                      <SelectItem value='Permit'>Permit to Work</SelectItem>
                      <SelectItem value='Inspection'>
                        Inspection Report
                      </SelectItem>
                      <SelectItem value='Other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <Label htmlFor='file' className='text-right w-[120px]'>
                    File
                  </Label>
                  <Input
                    id='file'
                    type='file'
                    onChange={e =>
                      setSelectedFile(e.target.files ? e.target.files[0] : null)
                    }
                    className='col-span-3 py-[13px]'
                  />
                </div>
                <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <Label htmlFor='expiryDate' className='text-right w-[120px]'>
                    Expiry Date
                  </Label>
                  <Input
                    id='expiryDate'
                    type='date'
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className='col-span-3'
                  />
                </div>
                {/* <div className='flex flex-col md:flex-row md:items-center gap-4'>
                  <Label htmlFor='status' className='text-right w-[120px]'>
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className='col-span-3'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='valid'>Valid</SelectItem>
                      <SelectItem value='expired'>Expired</SelectItem>
                      <SelectItem value='pending'>Pending Review</SelectItem>
                      <SelectItem value='archived'>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
              </div>
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  onClick={handleDocumentUploadSubmit}
                  disabled={loading}
                >
                  {loading ? 'Uploading ...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {documentsLoading && <p>Loading documents...</p>}
        {documentsError && (
          <p className='text-red-500'>
            Error loading documents: {documentsError}
          </p>
        )}
        {!documentsLoading && !documentsError && (
          <DataTable
            columns={columns}
            data={documents as DocumentType[]}
            loading={documentsLoading}
          />
        )}
      </CardContent>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Edit document details</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='editDocTitle'>Document Name</Label>
              <Input
                id='editDocTitle'
                value={editState.title ?? ''}
                onChange={e =>
                  setEditState(s => ({ ...s, title: e.target.value ?? '' }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editDocType'>Document Type</Label>
              <Input
                id='editDocType'
                value={editState.category ?? ''}
                onChange={e =>
                  setEditState(s => ({ ...s, category: e.target.value ?? '' }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editDocExpiry'>Expiry Date</Label>
              <Input
                id='editDocExpiry'
                type='date'
                value={editState.expiry ?? ''}
                onChange={e =>
                  setEditState(s => ({ ...s, expiry: e.target.value ?? '' }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editDocNotes'>Notes</Label>
              <Input
                id='editDocNotes'
                value={editState.notes ?? ''}
                onChange={e =>
                  setEditState(s => ({ ...s, notes: e.target.value ?? '' }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' onClick={handleEditSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Document Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>
                {deleteDoc?.title || deleteDoc?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteProjectDoc}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
