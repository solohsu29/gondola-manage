"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

import Link from 'next/link';


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
  // projectId: string - not usually displayed in the table itself
  // fileData: Buffer - definitely not displayed
}

export const columns: ColumnDef<Document>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
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
      const status = row.getValue("status") as string | undefined | null;
      if (!status) return <div className="text-foreground">N/A</div>;
      // You might want to add color coding based on status here
      return <span className={`px-2 py-1 text-xs font-medium rounded-full ${status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{status}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original

      return (
         <Button variant="outline" size="sm">
         <Link 
                href={document.fileUrl || '#'}
                download={document.name} 
                target="_blank" 
                rel="noopener noreferrer"
                style={!document.fileUrl ? { pointerEvents: 'none', opacity: 0.5 } : {}}
              >
                View
              </Link>
       </Button>
      )
    },
  },
]
