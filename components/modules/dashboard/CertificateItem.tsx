import { Badge } from "@/components/ui/badge";

interface CertificateItemProps {
  title: string;
  serialNumber: string;
  expiry?: string | null;
  projectName?:string
}

import { ExpiryStatusBadge } from "@/app/utils/statusUtils";

export default function CertificateItem({ title, serialNumber, expiry,projectName }: CertificateItemProps) {
  // Calculate status
  // Use the reusable ExpiryStatusBadge
  return (
    <div className="flex items-center justify-between border-b pb-3">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-foreground">{projectName ? `Project: ${projectName}` : `Gondola: ${serialNumber}`}</p>
      </div>
      <ExpiryStatusBadge expiry={expiry} />
    </div>
  );
}