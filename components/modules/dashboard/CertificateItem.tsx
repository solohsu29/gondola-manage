import { Badge } from "@/components/ui/badge";

interface CertificateItemProps {
  title: string;
  serialNumber: string;
  expiry?: string | null;
}

export default function CertificateItem({ title, serialNumber, expiry }: CertificateItemProps) {
  // Calculate status
  let statusText = "";
  let badgeClass = "";
  const now = new Date();
  let expiryDate: Date | null = null;
  if (expiry) {
    expiryDate = new Date(expiry);
    expiryDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      statusText = "Expired";
      badgeClass = "bg-red-100 text-red-800 border-red-200";
    } else if (diffDays === 0) {
      statusText = "Expiring today";
      badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else if (diffDays <= 30) {
      statusText = `Expiring in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      statusText = `Valid Until ${expiryDate.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
      badgeClass = "bg-green-100 text-green-800 border-green-200";
    }
  } else {
    statusText = "No Expiry";
    badgeClass = "bg-gray-100 text-gray-800 border-gray-200";
  }

  return (
    <div className="flex items-center justify-between border-b pb-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-foreground">Gondola: {serialNumber}</p>
      </div>
      <Badge
        variant="outline"
        className={badgeClass}
      >
        {statusText}
      </Badge>
    </div>
  );
}