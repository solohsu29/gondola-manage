import { Badge } from "@/components/ui/badge";

interface CertificateItemProps {
    title: string;
    serialNumber: string;
    status: string;
  }
  
 export default function CertificateItem({ title, serialNumber, status }: CertificateItemProps) {
    const isExpired = status === "Expired"
    const isExpiring = status.includes("Expires")
  
    return (
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-foreground">Gondola: {serialNumber}</p>
        </div>
        <Badge
          variant="outline"
          className={`
            ${isExpired ? "bg-red-100 text-red-800 border-red-200" : ""} 
            ${isExpiring ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
          `}
        >
          {status}
        </Badge>
      </div>
    )
  }