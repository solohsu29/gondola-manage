import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/common/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import {

  Upload,
  AlertTriangle,
  Phone
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { v4 as uuid } from 'uuid'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { ExpiryStatusBadge } from '@/app/utils/statusUtils'
import { formatDateDMY } from '@/app/utils/formatDate'

export default function RentalDetailsTab ({ gondolaId }: { gondolaId: string }) {
  // --- Generate DD Dialog state and handlers ---
  const [ddForm, setDdForm] = useState({
    ddId: `DD-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, '0')}`,
    deploymentDate: " ",
    projectSiteName: '',
    clientCompany: '',
    leadTechnicianName: '',
    leadTechnicianId: '',
    siteAddress: '',
    siteContactName: '',
    siteContactPhone: '',
    siteContactEmail: '',
    certificates: null as FileList | null,
    additionalNotes: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isGenerateDDDialogOpen, setIsGenerateDDDialogOpen] = useState(false)
  const [isUploadCOSDialogOpen, setIsUploadCOSDialogOpen] = useState(false)
  const [isCertAlertsDialogOpen, setIsCertAlertsDialogOpen] = useState(false)
  // Certificate Alerts State
  const [alertEmail, setAlertEmail] = useState('')
  const [alertFrequency, setAlertFrequency] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('')
  const [certAlertLoading, setCertAlertLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [uploadExpiry, setUploadExpiry] = useState("");
  const [cosNotes, setCosNotes] = useState('')
  const {
    documents,
    documentsLoading,
    documentsError,
    fetchDocumentsByGondolaId,
    rentalDetails,
    rentalDetailsLoading,
    rentalDetailsError,
    fetchRentalDetailsByGondolaId
  } = useAppStore()

  const handleDdFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, files } = e.target as HTMLInputElement
    if (id === 'certificates') {
      setDdForm(prev => ({ ...prev, certificates: files }))
    } else {
      setDdForm(prev => ({ ...prev, [id]: value }))
    }
  }

  const onGenerateDD = () => {
    // Validate required fields
    const requiredFields = [
      { value: ddForm.deploymentDate, name: 'Deployment Date' },
      { value: ddForm.projectSiteName, name: 'Project/Site Name' },
      { value: ddForm.clientCompany, name: 'Client Company Name' },
      { value: ddForm.leadTechnicianName, name: 'Lead Technician Name' },
      { value: ddForm.leadTechnicianId, name: 'Lead Technician ID' },
      { value: ddForm.siteAddress, name: 'Site Address' },
      { value: ddForm.siteContactName, name: 'Site Contact Name' },
      { value: ddForm.siteContactPhone, name: 'Site Contact Phone' },
      { value: ddForm.siteContactEmail, name: 'Site Contact Email' }
    ]
    const missingFields = requiredFields.filter(field => !field.value.trim())
    if (missingFields.length > 0) {
      toast.error('Missing Required Fields!', {
        description: `Please fill in the following required fields:\n${missingFields
          .map(field => `- ${field.name}`)
          .join('\n')}`,
        className: 'bg-destructive text-white'
      })
      return
    }
    setCertAlertLoading(true)
    // Generate PDF using jsPDF
    try {
      // Dynamically import jsPDF and template utility (for SSR compatibility)
      import('./ddPdfTemplate').then(({ generateDDPdf }) => {
        const doc = generateDDPdf(ddForm)
        doc.save('DeploymentDetails.pdf')
        toast.success('Deployment Details PDF generated!')
        setCertAlertLoading(false)
        setIsGenerateDDDialogOpen(false)
      })
    } catch (err: any) {
      toast.error('Failed to generate PDF', { description: err.message })
      setCertAlertLoading(false)
      setIsGenerateDDDialogOpen(false)
    }
  }

  // --- End Generate DD Dialog state and handlers ---

  // Upload COS Handler
  const handleUploadCOS = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select a file to upload')
      return
    }
    const file = selectedFiles[0] // Support single file upload for now
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'COS') // Document type/category
    formData.append('name', file.name) // Use file name as title
    formData.append('notes', cosNotes)
    formData.append("expiry", uploadExpiry);
    // Optional: add expiry if needed (formData.append('expiry', ...))
    setCertAlertLoading(true)
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/documents`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload COS')
      toast.success('Certificate of Serviceability uploaded successfully!')
      setIsUploadCOSDialogOpen(false)
      setSelectedFiles(null)
      setCosNotes('')
      setCertAlertLoading(false)
      setSuccess(uuid())
    } catch (err: any) {
      toast.error('Failed to upload COS', { description: err.message })
      setCertAlertLoading(false)
    }
  }

  // Cert Alert Submit Handler (API)
  const handleCertAlertSave = async () => {
    if (!alertEmail) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!alertFrequency) {
      toast.error('Please select an alert frequency.')
      return
    }
    if (!alertThreshold || isNaN(Number(alertThreshold)) || Number(alertThreshold) <= 0) {
      toast.error('Please enter a valid alert threshold (days).')
      return
    }
    setCertAlertLoading(true)
    try {
      // 1. Save subscription
      const subRes = await fetch('/api/cert-alert-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gondolaId,
          email: alertEmail,
          frequency: alertFrequency,
          threshold: alertThreshold
        })
      })
      if (!subRes.ok) {
        throw new Error('Failed to save alert subscription')
      }
      // 2. Send test alert email
      const res = await fetch('/api/send-cert-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gondolaId,
          email: alertEmail,
          frequency: alertFrequency,
          threshold: alertThreshold
        })
      })
      if (!res.ok) throw new Error('Failed to send alert email')
      toast.success('Alert subscription saved and test email sent to ' + alertEmail)
      setIsCertAlertsDialogOpen(false)
      setAlertEmail('')
      setAlertFrequency('')
      setAlertThreshold('')
    } catch (err: any) {
      toast.error('Failed to save alert subscription or send test email', { description: err.message })
    } finally {
      setCertAlertLoading(false)
    }
  }

  useEffect(() => {
    if (gondolaId) {
      fetchRentalDetailsByGondolaId(gondolaId)
    }
  }, [gondolaId])

  useEffect(() => {
    if (gondolaId) fetchDocumentsByGondolaId(gondolaId)
  }, [gondolaId, success])

  if (rentalDetailsLoading) {
    return <div className='p-6'>Loading rental details...</div>
  }
  if (rentalDetailsError) {
    return <div className='p-6 text-red-600'>Error: {rentalDetailsError}</div>
  }

  const projects = rentalDetails?.projects || []

  const certificates = (documents || []).map((doc: any) => {
    let status = doc.status?.toLowerCase() || 'valid'
    let daysToExpiry = null
    let expiryDate = doc.expiry
    if (expiryDate) {
      const today = new Date()
      const expiry = new Date(expiryDate)
      daysToExpiry = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 3600 * 24)
      )
      if (daysToExpiry < 0) status = 'expired'
      else if (daysToExpiry <= 30) status = 'expiring'
      else status = 'valid'
    }
    return {
      id: doc.id,
      type: doc.category || 'Certificate',
      issueDate: doc.uploaded
        ? new Date(doc.uploaded).toISOString().split('T')[0]
        : '',
      expiryDate: expiryDate
        ? new Date(expiryDate).toISOString().split('T')[0]
        : '',
      status,
      daysToExpiry,
      name: doc.name,
      fileUrl: `/api/document/${doc.id}/serve`
    }
  })

  const certificatesLoading = documentsLoading
  const certificatesError = documentsError

  // DataTable columns for certificates
  const certificateColumns: ColumnDef<any>[] = [
    {
      header: 'Type',
      accessorKey: 'type',
      cell: info => info.getValue()
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: info => {
        const name = info.getValue() as string
        const truncated =
          name && name.length > 24 ? name.slice(0, 24) + '…' : name
        return <span title={name}>{truncated}</span>
      }
    },
    {
      header: 'Issue Date',
      accessorKey: 'issueDate',
      cell: info => {
        const value = info.getValue() as string | undefined | null;
        if (!value) return '-';
       
        return formatDateDMY(value)
      }
    },
    {
      header: 'Expiry Date',
      accessorKey: 'expiryDate',
      cell: info => {
        const value = info.getValue() as string | undefined | null;
        if (!value) return '-';
      
        return formatDateDMY(value)
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
        cell: ({ row }) => {
            const expiry = row.getValue("expiryDate") as string | undefined | null;
            return <ExpiryStatusBadge expiry={expiry} />;
          },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <Button
          variant='outline'
          size='sm'
          onClick={() => window.open(info.row.original.fileUrl, '_blank')}
        >
          View
        </Button>
      )
    }
  ]

  return (
    <Card>
      <CardContent className='p-0'>
        <div className='p-6 border-b flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-semibold'>Rental Details</h2>
            <p className='text-foreground'>
              Manage rental information for GND-001-2023
            </p>
          </div>
          <div className='flex gap-3'>
            <Dialog
              open={isGenerateDDDialogOpen}
              onOpenChange={setIsGenerateDDDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>Generate DD</Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px]'>
                <DialogHeader>
                  <DialogTitle>Generate Deployment Document</DialogTitle>
                  <DialogDescription>
                    Generate a deployment document with all required information
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4 max-h-[60vh] overflow-y-auto'>
                  <div className='space-y-2'>
                    <Label htmlFor='ddId'>DD ID *</Label>
                    <Input
                      id='ddId'
                      value={ddForm.ddId}
                      disabled
                      className='bg-background'
                      readOnly
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='deploymentDate'>Date of Deployment *</Label>
                    <Input
                      id='deploymentDate'
                      type='date'
                      value={ddForm.deploymentDate}
                      onChange={handleDdFormChange}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='projectSiteName'>
                      Project / Site Name *
                    </Label>
                    <Input
                      id='projectSiteName'
                      placeholder='Enter project or site name'
                      value={ddForm.projectSiteName}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='clientCompany'>Client Company Name *</Label>
                    <Input
                      id='clientCompany'
                      placeholder='Enter client company name'
                      value={ddForm.clientCompany}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='leadTechnicianName'>
                      Lead Technician Name *
                    </Label>
                    <Input
                      id='leadTechnicianName'
                      placeholder='Enter lead technician name'
                      value={ddForm.leadTechnicianName}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='leadTechnicianId'>
                      Lead Technician ID *
                    </Label>
                    <Input
                      id='leadTechnicianId'
                      placeholder='Enter technician ID'
                      value={ddForm.leadTechnicianId}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='siteAddress'>
                      Site Address / Location *
                    </Label>
                    <Textarea
                      id='siteAddress'
                      placeholder='Enter complete site address and location details'
                      value={ddForm.siteAddress}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='siteContactName'>
                      Site Contact Person Name *
                    </Label>
                    <Input
                      id='siteContactName'
                      placeholder='Enter site contact person name'
                      value={ddForm.siteContactName}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='siteContactPhone'>
                      Site Contact Phone *
                    </Label>
                    <Input
                      id='siteContactPhone'
                      type='tel'
                      placeholder='Enter contact phone number'
                      value={ddForm.siteContactPhone}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='siteContactEmail'>
                      Site Contact Email *
                    </Label>
                    <Input
                      id='siteContactEmail'
                      type='email'
                      placeholder='Enter contact email address'
                      value={ddForm.siteContactEmail}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='certificates'>
                      Certificates and Attachments
                    </Label>
                    <Input
                      id='certificates'
                      type='file'
                      multiple
                      className="py-[13px]"
                      accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                      onChange={handleDdFormChange}
                    />
                    <p className='text-sm text-foreground'>
                      Upload relevant certificates and supporting documents
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='additionalNotes'>Additional Notes</Label>
                    <Textarea
                      id='additionalNotes'
                      placeholder='Any additional information or special requirements'
                      value={ddForm.additionalNotes}
                      onChange={handleDdFormChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsGenerateDDDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    onClick={onGenerateDD}
                    disabled={certAlertLoading}
                  >
                    {certAlertLoading ? 'Generating ...' : 'Generate Document'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isUploadCOSDialogOpen}
              onOpenChange={setIsUploadCOSDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <Upload className='w-4 h-4 mr-2' />
                  Upload COS
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>
                    Upload Certificate of Serviceability
                  </DialogTitle>
                  <DialogDescription>
                    Upload the latest Certificate of Serviceability for{' '}
                    {gondolaId}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='cosFile'>Select COS File</Label>
                    <Input
                      id='cosFile'
                      type='file'
                      accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                      onChange={e => {
                        if (e.target.files) {
                          setSelectedFiles(e.target.files)
                        }
                      }}
                      className="py-[13px]"
                    />
                    {selectedFiles && selectedFiles.length > 0 ? (
                      <p className='text-sm text-foreground'>
                        Selected {selectedFiles.length} file(s)
                      </p>
                    ) : (
                      <p className='text-sm text-foreground'>
                        Accepted file types: PDF, DOC, JPG, PNG
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='cosNotes'>Additional Notes</Label>
                    <Textarea
                      id='cosNotes'
                      placeholder='Any additional information or notes about the COS'
                      value={cosNotes}
                      onChange={e => setCosNotes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
                  <Input id="expiryDate" type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} />
                </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsUploadCOSDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={handleUploadCOS}
                    disabled={certAlertLoading}
                  >
                    {certAlertLoading ? 'Uploading...' : 'Upload COS'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isCertAlertsDialogOpen}
              onOpenChange={setIsCertAlertsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant='outline'>
                  <AlertTriangle className='w-4 h-4 mr-2' />
                  Cert Alerts
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                  <DialogTitle>Certificate Expiry Alerts</DialogTitle>
                  <DialogDescription>
                    Configure certificate expiry alerts for {gondolaId}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='alertEmail'>Alert Email</Label>
                    <Input
                      id='alertEmail'
                      type='email'
                      placeholder='Enter email address for alerts'
                      value={alertEmail}
                      onChange={e => setAlertEmail(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='alertFrequency'>Alert Frequency</Label>
                    <Select
                      name='alertFrequency'
                      value={alertFrequency}
                      onValueChange={setAlertFrequency}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select frequency' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='daily'>Daily</SelectItem>
                        <SelectItem value='weekly'>Weekly</SelectItem>
                        <SelectItem value='monthly'>Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='alertThreshold'>
                      Alert Threshold (Days)
                    </Label>
                    <Input
                      id='alertThreshold'
                      type='number'
                      placeholder='Number of days before expiry to start sending alerts'
                      value={alertThreshold}
                      onChange={e => setAlertThreshold(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsCertAlertsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={handleCertAlertSave}
                    disabled={certAlertLoading}
                  >
                    {certAlertLoading ? 'Saving ...' : 'Save Settings'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>Rental Information</h3>
          {projects.length > 0 ? (
            projects.map((project: any) => (
              <div
                key={project.id}
                className='bg-background border rounded-md p-4 mb-4'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4'>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Project Name
                    </p>
                    <p className='font-medium text-gray-900'>
                      {project.projectName || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Project ID
                    </p>
                    <p className='font-medium text-gray-900'>
                      {project.id || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Client Name
                    </p>
                    <p className='font-medium text-gray-900'>
                      {project.client || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>Site</p>
                    <p className='font-medium text-gray-900'>
                      {project.site || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Status
                    </p>
                    <p className='font-medium text-gray-900'>
                      {project.status || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Rental Start Date
                    </p>
                    <p className='font-medium text-gray-900'>
                      
                         {formatDateDMY(project.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      Rental End Date
                    </p>
                    <p className='font-medium text-gray-900'>
                      {formatDateDMY(project.endDate)}
                    </p>
                  </div>
                  {/* Add more project/rental fields as needed */}
                </div>
              </div>
            ))
          ) : (
            <div className='text-foreground'>
              No rental details found for this gondola.
            </div>
          )}
        </div>

        <div className='p-6'>
          <h3 className='text-lg font-semibold mb-4'>Certificates</h3>
          {certificatesLoading ? (
            <div className='text-foreground p-4'>Loading certificates...</div>
          ) : certificatesError ? (
            <div className='text-red-600 p-4'>Error: {certificatesError}</div>
          ) : certificates.length === 0 ? (
            <div className='text-foreground p-4'>
              No certificates found for this gondola.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              {/* DataTable for certificates */}
              <DataTable
                columns={certificateColumns}
                data={certificates}
                pageSize={10}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
