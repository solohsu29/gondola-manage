import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/common/data-table"
import type { ColumnDef } from "@tanstack/react-table"

// ...rest of imports

import { 
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,DialogTrigger,DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"


import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function RentalDetailsTab({ gondolaId }: { gondolaId: string }) {
  // --- Generate DD Dialog state and handlers ---
  const [ddForm, setDdForm] = useState({
    ddId: `DD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`,
    deploymentDate: new Date().toISOString().split("T")[0],
    projectSiteName: "Marina Bay Tower",
    clientCompany: "Apex Construction",
    leadTechnicianName: "",
    leadTechnicianId: "",
    siteAddress: "",
    siteContactName: "",
    siteContactPhone: "",
    siteContactEmail: "",
    certificates: null as FileList | null,
    additionalNotes: ""
  });

  const handleDdFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, files } = e.target as HTMLInputElement;
    if (id === "certificates") {
      setDdForm((prev) => ({ ...prev, certificates: files }));
    } else {
      setDdForm((prev) => ({ ...prev, [id]: value }));
    }
  };

  const onGenerateDD = () => {
    // Validate required fields
    const requiredFields = [
      { value: ddForm.deploymentDate, name: "Deployment Date" },
      { value: ddForm.projectSiteName, name: "Project/Site Name" },
      { value: ddForm.clientCompany, name: "Client Company Name" },
      { value: ddForm.leadTechnicianName, name: "Lead Technician Name" },
      { value: ddForm.leadTechnicianId, name: "Lead Technician ID" },
      { value: ddForm.siteAddress, name: "Site Address" },
      { value: ddForm.siteContactName, name: "Site Contact Name" },
      { value: ddForm.siteContactPhone, name: "Site Contact Phone" },
      { value: ddForm.siteContactEmail, name: "Site Contact Email" },
    ];
    const missingFields = requiredFields.filter((field) => !field.value.trim());
    if (missingFields.length > 0) {


      toast.error("Missing Required Fields!",{description: `Please fill in the following required fields:\n${missingFields.map((field) => `- ${field.name}`).join("\n")}`,className:"bg-destructive text-white"})
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ddForm.siteContactEmail)) {
    
      toast.error("Invalid Email!",{description:"Please enter a valid email address for Site Contact Email",className:"bg-destructive text-white"})
      return;
    }
    const attachments = ddForm.certificates
      ? Array.from(ddForm.certificates).map((file) => file.name).join(", ")
      : "None";
    const deploymentDocument = {
      ddId: ddForm.ddId,
      gondolaId: gondolaId,
      deploymentDate: ddForm.deploymentDate,
      projectSiteName: ddForm.projectSiteName,
      clientCompany: ddForm.clientCompany,
      leadTechnician: {
        name: ddForm.leadTechnicianName,
        id: ddForm.leadTechnicianId,
      },
      siteAddress: ddForm.siteAddress,
      siteContact: {
        name: ddForm.siteContactName,
        phone: ddForm.siteContactPhone,
        email: ddForm.siteContactEmail,
      },
      attachments: attachments,
      additionalNotes: ddForm.additionalNotes || "None",
      generatedAt: new Date().toISOString(),
    };
    console.log("Generated Deployment Document:", deploymentDocument);
    alert(
      `Deployment Document generated successfully!\n\nDD ID: ${deploymentDocument.ddId}\nGondola: ${deploymentDocument.gondolaId}\nDeployment Date: ${deploymentDocument.deploymentDate}\nProject/Site: ${deploymentDocument.projectSiteName}\nClient: ${deploymentDocument.clientCompany}\nLead Technician: ${deploymentDocument.leadTechnician.name} (ID: ${deploymentDocument.leadTechnician.id})\nSite Address: ${deploymentDocument.siteAddress}\nSite Contact: ${deploymentDocument.siteContact.name}\nPhone: ${deploymentDocument.siteContact.phone}\nEmail: ${deploymentDocument.siteContact.email}\nAttachments: ${deploymentDocument.attachments}\nNotes: ${deploymentDocument.additionalNotes}\n\nDocument has been generated and is ready for download.`,
    );
    setIsGenerateDDDialogOpen(false);
    // Reset form fields
    setDdForm({
      ddId: `DD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`,
      deploymentDate: new Date().toISOString().split("T")[0],
      projectSiteName: "Marina Bay Tower",
      clientCompany: "Apex Construction",
      leadTechnicianName: "",
      leadTechnicianId: "",
      siteAddress: "",
      siteContactName: "",
      siteContactPhone: "",
      siteContactEmail: "",
      certificates: null,
      additionalNotes: ""
    });
  };
  // --- End Generate DD Dialog state and handlers ---

  const [isGenerateDDDialogOpen, setIsGenerateDDDialogOpen] = useState(false)
  const [isUploadCOSDialogOpen, setIsUploadCOSDialogOpen] = useState(false)
  const [isCertAlertsDialogOpen, setIsCertAlertsDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)



  useEffect(() => {
    if (gondolaId) fetchRentalDetailsByGondolaId(gondolaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gondolaId]);

  // All needed state from store (single destructure)
  const {
    documents, documentsLoading, documentsError, fetchDocumentsByGondolaId,
    rentalDetails, rentalDetailsLoading, rentalDetailsError, fetchRentalDetailsByGondolaId
  } = useAppStore();

  useEffect(() => {
    if (gondolaId) fetchRentalDetailsByGondolaId(gondolaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gondolaId]);

  useEffect(() => {
    if (gondolaId) fetchDocumentsByGondolaId(gondolaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gondolaId]);

  if (rentalDetailsLoading) {
    return <div className="p-6">Loading rental details...</div>;
  }
  if (rentalDetailsError) {
    return <div className="p-6 text-red-600">Error: {rentalDetailsError}</div>;
  }
  // Support multiple rental infos (one per project)
  const gondola = rentalDetails?.gondola || {};
  const projects = rentalDetails?.projects || [];

  const certificates = (documents || []).map((doc: any) => {
    let status = doc.status?.toLowerCase() || 'valid';
    let daysToExpiry = null;
    let expiryDate = doc.expiry;
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      daysToExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (daysToExpiry < 0) status = 'expired';
      else if (daysToExpiry <= 30) status = 'expiring';
      else status = 'valid';
    }
    return {
      id: doc.id,
      type: doc.category || 'Certificate',
      issueDate: doc.uploaded ? new Date(doc.uploaded).toISOString().split('T')[0] : '',
      expiryDate: expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : '',
      status,
      daysToExpiry,
      name: doc.name,
      fileUrl: `/api/document/${doc.id}/serve`,
    };
  });


  const certificatesLoading = documentsLoading;
  const certificatesError = documentsError;

  // DataTable columns for certificates
  const certificateColumns: ColumnDef<any>[] = [
    {
      header: 'Type',
      accessorKey: 'type',
      cell: info => info.getValue(),
    },
    {
      header: 'Issue Date',
      accessorKey: 'issueDate',
      cell: info => info.getValue(),
    },
    {
      header: 'Expiry Date',
      accessorKey: 'expiryDate',
      cell: info => info.getValue(),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => (
        <div className="flex items-center gap-2">
          {getCertificateStatusIcon(info.row.original.status)}
          {getCertificateStatusBadge(info.row.original.status)}
        </div>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <Button variant="outline" size="sm" onClick={() => window.open(info.row.original.fileUrl, '_blank')}>
          View
        </Button>
      ),
    },
  ];

  const getCertificateStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "expiring":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getCertificateStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>
      case "expiring":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Expiring Soon</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Rental Details</h2>
            <p className="text-gray-500">Manage rental information for GND-001-2023</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isGenerateDDDialogOpen} onOpenChange={setIsGenerateDDDialogOpen}>
              <DialogTrigger asChild>
                <Button>Generate DD</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Generate Deployment Document</DialogTitle>
                  <DialogDescription>Generate a deployment document with all required information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="ddId">DD ID *</Label>
                    <Input
                      id="ddId"
                      value={ddForm.ddId}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deploymentDate">Date of Deployment *</Label>
                    <Input
                      id="deploymentDate"
                      type="date"
                      value={ddForm.deploymentDate}
                      onChange={handleDdFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectSiteName">Project / Site Name *</Label>
                    <Input
                      id="projectSiteName"
                      placeholder="Enter project or site name"
                      value={ddForm.projectSiteName}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">Client Company Name *</Label>
                    <Input
                      id="clientCompany"
                      placeholder="Enter client company name"
                      value={ddForm.clientCompany}
                      onChange={handleDdFormChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadTechnicianName">Lead Technician Name *</Label>
                    <Input id="leadTechnicianName" placeholder="Enter lead technician name" value={ddForm.leadTechnicianName} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadTechnicianId">Lead Technician ID *</Label>
                    <Input id="leadTechnicianId" placeholder="Enter technician ID" value={ddForm.leadTechnicianId} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteAddress">Site Address / Location *</Label>
                    <Textarea id="siteAddress" placeholder="Enter complete site address and location details" value={ddForm.siteAddress} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteContactName">Site Contact Person Name *</Label>
                    <Input id="siteContactName" placeholder="Enter site contact person name" value={ddForm.siteContactName} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteContactPhone">Site Contact Phone *</Label>
                    <Input id="siteContactPhone" type="tel" placeholder="Enter contact phone number" value={ddForm.siteContactPhone} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteContactEmail">Site Contact Email *</Label>
                    <Input id="siteContactEmail" type="email" placeholder="Enter contact email address" value={ddForm.siteContactEmail} onChange={handleDdFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certificates">Certificates and Attachments</Label>
                    <Input id="certificates" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleDdFormChange} />
                    <p className="text-sm text-gray-500">Upload relevant certificates and supporting documents</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea id="additionalNotes" placeholder="Any additional information or special requirements" value={ddForm.additionalNotes} onChange={handleDdFormChange} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsGenerateDDDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={onGenerateDD}
                  >
                    Generate Document
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isUploadCOSDialogOpen} onOpenChange={setIsUploadCOSDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload COS
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Upload Certificate of Serviceability</DialogTitle>
                  <DialogDescription>Upload the latest Certificate of Serviceability for {gondolaId}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cosFile">Select COS File</Label>
                    <Input
                      id="cosFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSelectedFiles(e.target.files)
                        }
                      }}
                    />
                    {selectedFiles && selectedFiles.length > 0 ? (
                      <p className="text-sm text-gray-500">Selected {selectedFiles.length} file(s)</p>
                    ) : (
                      <p className="text-sm text-gray-500">Accepted file types: PDF, DOC, JPG, PNG</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cosNotes">Additional Notes</Label>
                    <Textarea id="cosNotes" placeholder="Any additional information or notes about the COS" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsUploadCOSDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      const cosNotesInput = document.getElementById("cosNotes") as HTMLTextAreaElement

                      if (selectedFiles && selectedFiles.length > 0) {
                        alert(
                          `Certificate of Serviceability uploaded successfully!\n\nGondola: ${gondolaId}\nFiles: ${Array.from(
                            selectedFiles,
                          )
                            .map((file) => file.name)
                            .join(", ")}\nNotes: ${cosNotesInput.value || "None"}`,
                        )
                        setIsUploadCOSDialogOpen(false)
                        setSelectedFiles(null)
                      } else {
                        alert("Please select a file to upload")
                      }
                    }}
                  >
                    Upload COS
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCertAlertsDialogOpen} onOpenChange={setIsCertAlertsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Cert Alerts
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Certificate Expiry Alerts</DialogTitle>
                  <DialogDescription>Configure certificate expiry alerts for {gondolaId}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="alertEmail">Alert Email</Label>
                    <Input id="alertEmail" type="email" placeholder="Enter email address for alerts" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alertFrequency">Alert Frequency</Label>
                    <Select name="alertFrequency">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Alert Threshold (Days)</Label>
                    <Input
                      id="alertThreshold"
                      type="number"
                      placeholder="Number of days before expiry to start sending alerts"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCertAlertsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => {
                      const alertEmailInput = document.getElementById("alertEmail") as HTMLInputElement
                      const alertFrequencySelect = document.querySelector(
                        '[name="alertFrequency"]',
                      ) as HTMLSelectElement
                      const alertThresholdInput = document.getElementById("alertThreshold") as HTMLInputElement

                      alert(
                        `Certificate expiry alerts configured successfully!\n\nGondola: ${gondolaId}\nEmail: ${alertEmailInput.value}\nFrequency: ${alertFrequencySelect.value}\nThreshold: ${alertThresholdInput.value} days`,
                      )
                      setIsCertAlertsDialogOpen(false)
                    }}
                  >
                    Save Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rental Information</h3>
          {projects.length > 0 ? (
            projects.map((project: any) => (
              <div key={project.id} className="bg-background border rounded-md p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project Name</p>
                    <p className="font-medium text-gray-900">{project.projectName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project ID</p>
                    <p className="font-medium text-gray-900">{project.id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Client Name</p>
                    <p className="font-medium text-gray-900">{project.client || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Site</p>
                    <p className="font-medium text-gray-900">{project.site || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="font-medium text-gray-900">{project.status || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rental Start Date</p>
                    <p className="font-medium text-gray-900">{project.startDate ? project.startDate.split('T')[0] : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rental End Date</p>
                    <p className="font-medium text-gray-900">{project.endDate ? project.endDate.split('T')[0] : '-'}</p>
                  </div>
                  {/* Add more project/rental fields as needed */}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No rental details found for this gondola.</div>
          )}
        </div>

        <div className="p-6">
  <h3 className="text-lg font-semibold mb-4">Certificates</h3>
  {certificatesLoading ? (
    <div className="text-gray-500 p-4">Loading certificates...</div>
  ) : certificatesError ? (
    <div className="text-red-600 p-4">Error: {certificatesError}</div>
  ) : certificates.length === 0 ? (
    <div className="text-gray-500 p-4">No certificates found for this gondola.</div>
  ) : (
    <div className="overflow-x-auto">
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