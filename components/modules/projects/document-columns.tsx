"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

import Link from 'next/link';
import { ExpiryStatusBadge } from "@/app/utils/statusUtils";


// Assuming your Document type from the store/API looks like this:
export type Document = {
  id: string
  name: string     // Actual filename, used for download attribute
  type: string     // Actual MIME type, used by serve API
  title?: string | null    // User-provided title for display
  category?: string | null // User-provided category for display
  uploaded: string // ISO date string
  expiry?: string | null // ISO date string
  status?: string | null // e.g., 'valid', 'expired', 'pending_review'
  fileUrl?: string | null // URL to view/download the document
  notes?:string
  // projectId: string - not usually displayed in the table itself
  // fileData: Buffer - definitely not displayed
}

export const columns: ColumnDef<Document>[] = [
 
  {
    accessorKey: "id",
   header:"Document ID",
    cell: ({ row }) => {
    
      // Display user-provided title, fallback to actual filename if title is not set
      return <div className="font-medium">{row?.original?.id?.slice(0,10)}</div>
    }
  },
  {
    accessorKey: "title", // Primarily sort/filter by title
    header: "Document Name",
    cell: ({ row }) => {
      const document = row.original;
      // Display user-provided title, fallback to actual filename if title is not set
      return <div className="font-medium">{document.title || document.name}</div>
    }
  },
  {
    accessorKey: "category", // Primarily sort/filter by category
    header: "Type", // Keep header label as "Type"
    cell: ({ row }) => {
      const document = row.original;
      // Display user-provided category, fallback to actual MIME type if category is not set
      return <div className="font-medium">{document.category || document.type}</div>
    }
  },
  {
    accessorKey: "uploaded",
    header: "Uploaded Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("uploaded"))
      return <div className="font-medium">{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "expiry",
    header: "Expiry Date",
    cell: ({ row }) => {
      const expiryDate = row.getValue("expiry") as string | undefined | null;
      if (!expiryDate) return <div className="text-foreground">N/A</div>;
      const date = new Date(expiryDate);
      return <div className="font-medium">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const expiry = row.getValue("expiry") as string | undefined | null;
      return <ExpiryStatusBadge expiry={expiry} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const doc = row.original;
      const documentUrl = (doc as any).fileUrl || `/api/document/${doc.id}/serve`;     
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(documentUrl, '_blank')}
          >
            View
          </Button>
        )
    },
  },
]
