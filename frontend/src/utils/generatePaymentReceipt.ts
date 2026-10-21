import jsPDF from 'jspdf';
import { LOGO_BASE64 } from './logoBase64';

interface ReceiptPayment {
  id: string;
  amount: string;
  method: 'CASH' | 'CARD' | 'TRANSFER';
  concept: string;
  notes?: string;
  createdAt: string;
  treatment?: { id: string; name: string } | null;
}

interface ReceiptPatient {
  name: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface ReceiptTreatment {
  name: string;
  cost: string;
  totalPaid: number;
  balance: number;
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

// Brand colors
const BLUE_DARK  = [0,   119, 182] as const;  // #0077B6
const BLUE_LIGHT = [0,   174, 239] as const;  // #00AEEF
const ORANGE     = [249, 115,  22] as const;  // accent orange

function divider(doc: jsPDF, y: number, x1 = 14, x2 = 134) {
  doc.setDrawColor(220, 228, 236);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFontSize(7);
  doc.setTextColor(...BLUE_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), 14, y);
}

function row(doc: jsPDF, label: string, value: string, y: number, bold = false) {
  doc.setFontSize(9);
  doc.setTextColor(110, 120, 130);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 14, y);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(25, 35, 50);
  doc.text(value, 134, y, { align: 'right' });
}

export async function generatePaymentReceipt(
  payment: ReceiptPayment,
  patient: ReceiptPatient,
  treatment?: ReceiptTreatment | null,
) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const W = 148;
  let y = 0;

  // ── Header background ─────────────────────────────────────
  // Dark blue top band
  doc.setFillColor(...BLUE_DARK);
  doc.rect(0, 0, W, 38, 'F');

  // Lighter blue accent strip at bottom of header
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(0, 35, W, 3, 'F');

  // Orange decorative corner accent
  doc.setFillColor(...ORANGE);
  doc.rect(0, 35, 8, 3, 'F');

  // ── Logo ──────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(8, 4, 30, 28, 3, 3, 'F');
  doc.addImage(LOGO_BASE64, 'JPEG', 8, 4, 30, 28);

  // ── Clinic name & tagline ─────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('Blanco Dental', 44, 14);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(179, 222, 244);   // light blue tint
  doc.text('CREAMOS ARTE EN TU SONRISA', 44, 20);

  // "Comprobante de pago" pill inside header
  doc.setFillColor(...BLUE_LIGHT);
  doc.roundedRect(44, 24, 62, 7, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('COMPROBANTE DE PAGO', 75, 29, { align: 'center' });

  y = 46;

  // ── Número y fecha ────────────────────────────────────────
  const receiptNum = payment.id.slice(-6).toUpperCase();
  const fecha = new Date(payment.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const hora = new Date(payment.createdAt).toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit',
  });

  doc.setFontSize(8);
  doc.setTextColor(130, 140, 155);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${receiptNum}`, 14, y);
  doc.setTextColor(80, 90, 105);
  doc.text(`${fecha}  ${hora}`, 134, y, { align: 'right' });

  y += 5;
  divider(doc, y);
  y += 7;

  // ── Paciente ──────────────────────────────────────────────
  sectionTitle(doc, 'Paciente', y);
  y += 5.5;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 30, 50);
  doc.text(`${patient.name} ${patient.lastName}`, 14, y);
  y += 5.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 120, 130);
  doc.text(patient.phone, 14, y);
  if (patient.email) {
    doc.text(patient.email, 134, y, { align: 'right' });
  }

  y += 9;
  divider(doc, y);
  y += 7;

  // ── Detalle del pago ──────────────────────────────────────
  sectionTitle(doc, 'Detalle del pago', y);
  y += 6;

  row(doc, 'Concepto', payment.concept, y);
  y += 6;
  if (treatment) {
    row(doc, 'Tratamiento', treatment.name, y);
    y += 6;
  }
  row(doc, 'Método de pago', METHOD_LABEL[payment.method] ?? payment.method, y);
  y += 6;
  if (payment.notes) {
    row(doc, 'Notas', payment.notes, y);
    y += 6;
  }

  y += 2;
  divider(doc, y);
  y += 6;

  // ── Monto pagado (destacado) ──────────────────────────────
  // Green pill background
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14, y - 3, W - 28, 15, 3, 3, 'F');
  // Left accent bar
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(14, y - 3, 3, 15, 1, 1, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO PAGADO', 22, y + 3.5);

  doc.setFontSize(15);
  doc.setTextColor(5, 150, 105);
  doc.text(
    `S/ ${parseFloat(payment.amount).toFixed(2)}`,
    130,
    y + 4.5,
    { align: 'right' },
  );

  y += 20;

  // ── Resumen del tratamiento ───────────────────────────────
  if (treatment) {
    divider(doc, y);
    y += 7;
    sectionTitle(doc, 'Resumen del tratamiento', y);
    y += 6;

    row(doc, 'Costo total', `S/ ${parseFloat(treatment.cost).toFixed(2)}`, y);
    y += 6;
    row(doc, 'Total pagado', `S/ ${treatment.totalPaid.toFixed(2)}`, y);
    y += 6;

    const isPaid = treatment.balance <= 0;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 120, 130);
    doc.text('Saldo pendiente', 14, y);
    doc.setFont('helvetica', 'bold');
    if (isPaid) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(
      isPaid ? 'PAGADO COMPLETAMENTE ✓' : `S/ ${treatment.balance.toFixed(2)}`,
      134,
      y,
      { align: 'right' },
    );
    y += 10;
  }

  // ── Footer ────────────────────────────────────────────────
  // Footer background band
  const pageH = 210; // A5 height
  doc.setFillColor(245, 248, 252);
  doc.rect(0, pageH - 22, W, 22, 'F');
  doc.setFillColor(...BLUE_LIGHT);
  doc.rect(0, pageH - 22, W, 1.5, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE_DARK);
  doc.text('Blanco Dental — Creamos arte en tu sonrisa', W / 2, pageH - 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 160, 170);
  doc.text('Este documento es un comprobante interno de pago.', W / 2, pageH - 8, { align: 'center' });

  // ── Guardar ───────────────────────────────────────────────
  const fileName = `comprobante-${patient.lastName.toLowerCase()}-${receiptNum}.pdf`;
  doc.save(fileName);
}
