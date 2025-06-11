// Utility to generate Deployment Details PDF using jsPDF
import jsPDF from 'jspdf';

export function generateDDPdf(ddForm: any) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Deployment Details', 10, 15);
  doc.setFontSize(11);
  let y = 30;
  Object.entries(ddForm).forEach(([key, val]) => {
    if (typeof val === 'string' && val.trim()) {
      doc.text(`${key}: ${val}`, 10, y);
      y += 8;
    }
  });
  return doc;
}
