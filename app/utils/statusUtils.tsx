import React from "react";

/**
 * Returns an object with statusText and badgeClass for a given expiry date.
 * @param expiry - ISO string or null/undefined
 */
export function getExpiryStatus(expiry?: string | null): {
  statusText: string;
  badgeClass: string;
} {
  const now = new Date();
  let statusText = "";
  let badgeClass = "";
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
  return { statusText, badgeClass };
}

/**
 * Renders a badge span for expiry/certificate status.
 */
export function ExpiryStatusBadge({ expiry }: { expiry?: string | null }) {
  const { statusText, badgeClass } = getExpiryStatus(expiry);
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badgeClass}`}>
      {statusText}
    </span>
  );
}
