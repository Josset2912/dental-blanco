import jsPDF from 'jspdf';

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

function line(doc: jsPDF, y: number, x1 = 20, x2 = 190) {
  doc.setDrawColor(220, 220, 220);
  doc.line(x1, y, x2, y);
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'bold');
  doc.text(text.toUpperCase(), 20, y);
}

function row(doc: jsPDF, label: string, value: string, y: number, bold = false) {
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(label, 20, y);
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(value, 190, y, { align: 'right' });
}

export function generatePaymentReceipt(
  payment: ReceiptPayment,
  patient: ReceiptPatient,
  treatment?: ReceiptTreatment | null,
) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm' });
  const W = 148;
  let y = 18;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(0, 174, 239);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Blanco Dental', W / 2, 12, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPROBANTE DE PAGO', W / 2, 20, { align: 'center' });

  y = 38;

  // ── Número y fecha ───────────────────────────────────────
  const receiptNum = payment.id.slice(-6).toUpperCase();
  const fecha = new Date(payment.createdAt).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const hora = new Date(payment.createdAt).toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit',
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${receiptNum}`, 20, y);
  doc.text(`${fecha}  ${hora}`, W - 20, y, { align: 'right' });

  y += 8;
  line(doc, y);
  y += 7;

  // ── Paciente ─────────────────────────────────────────────
  sectionTitle(doc, 'Paciente', y);
  y += 5;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(`${patient.name} ${patient.lastName}`, 20, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(patient.phone, 20, y);
  if (patient.email) {
    doc.text(patient.email, W - 20, y, { align: 'right' });
  }

  y += 9;
  line(doc, y);
  y += 7;

  // ── Detalle del pago ─────────────────────────────────────
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
  line(doc, y);
  y += 7;

  // ── Monto pagado (destacado) ─────────────────────────────
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(16, y - 4, W - 32, 14, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTO PAGADO', 22, y + 3);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `S/ ${parseFloat(payment.amount).toFixed(2)}`,
    W - 22,
    y + 4,
    { align: 'right' },
  );

  y += 18;

  // ── Resumen del tratamiento ──────────────────────────────
  if (treatment) {
    line(doc, y);
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
    doc.setTextColor(100, 100, 100);
    doc.text('Saldo pendiente', 20, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isPaid ? 22 : 217, isPaid ? 163 : 119, isPaid ? 74 : 6);
    doc.text(
      isPaid ? 'PAGADO COMPLETAMENTE ✓' : `S/ ${treatment.balance.toFixed(2)}`,
      W - 20,
      y,
      { align: 'right' },
    );
    y += 10;
  }

  // ── Footer ───────────────────────────────────────────────
  line(doc, y);
  y += 7;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('Gracias por su confianza en Blanco Dental', W / 2, y, { align: 'center' });
  y += 5;
  doc.text('Este documento es un comprobante interno de pago.', W / 2, y, { align: 'center' });

  // ── Guardar ──────────────────────────────────────────────
  const fileName = `comprobante-${patient.lastName.toLowerCase()}-${receiptNum}.pdf`;
  doc.save(fileName);
}
