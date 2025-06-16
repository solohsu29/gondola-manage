import jsPDF from "jspdf";
 export const downloadPDF = ({gondolas,certificates,pendingInspectionsCount,projects}:any) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    let y = 40;
    pdf.setFontSize(18);
    pdf.text('Dashboard Report', 40, y);
    y += 30;

    pdf.setFontSize(14);
    pdf.text('Summary Statistics', 40, y);
    y += 20;
    pdf.setFontSize(12);
    pdf.text(`Active Gondolas: ${gondolas.filter((g: any) => typeof g.status === 'string' && g.status.toLowerCase() === 'deployed').length}`, 40, y); y += 18;
    pdf.text(`Expiring Certificates: ${certificates.filter((cert:any) => typeof cert.status === 'string' && cert.status.toLowerCase().includes('expire')).length}`, 40, y); y += 18;
    pdf.text(`Pending Inspections: ${pendingInspectionsCount}`, 40, y); y += 18;
    pdf.text(`Total Projects: ${projects.length}`, 40, y); y += 30;

    pdf.setFontSize(14);
    pdf.text('Projects Overview', 40, y); y += 20;
    pdf.setFontSize(12);
    projects.slice(0, 5).forEach((project:any, idx:any) => {
      pdf.text(`${idx + 1}. ${project.client} (${project.site}) - Status: ${project.status}`, 40, y); y += 16;
      if (y > 780) { pdf.addPage(); y = 40; }
    });
    y += 20;

    pdf.setFontSize(14);
    pdf.text('Certificate Status', 40, y); y += 20;
    pdf.setFontSize(12);
    // Dynamically import getExpiryStatus for server/client compatibility
    const { getExpiryStatus } = require("@/app/utils/statusUtils");
    certificates.forEach((cert:any, idx:any) => {
      const expiryStatus = getExpiryStatus(cert.expiry);
      pdf.text(`${idx + 1}. ${cert.title} ${cert.serialNumber ? `(${cert.serialNumber})` : ''} - ${expiryStatus.statusText}`, 40, y); y += 16;
      if (y > 780) { pdf.addPage(); y = 40; }
    });

    pdf.save('dashboard-report.pdf');
  };