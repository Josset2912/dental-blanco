import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientImages, uploadPatientImage, deletePatientImage, type PatientImage } from '../api/images';
import { jsPDF } from 'jspdf';

const TYPE_OPTIONS = [
  { value: 'radiografia', label: 'Radiografía' },
  { value: 'foto_clinica', label: 'Foto clínica' },
  { value: 'documento', label: 'Documento' },
  { value: 'otro', label: 'Otro' },
];

interface Props {
  patientId: string;
  patientName: string;
}

export default function PatientImages({ patientId, patientName }: Props) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState('radiografia');
  const [preview, setPreview] = useState<PatientImage | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['images', patientId],
    queryFn: () => getPatientImages(patientId),
  });

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadPatientImage(patientId, file, selectedType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['images', patientId] }),
  });

  const deleteMut = useMutation({
    mutationFn: deletePatientImage,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['images', patientId] });
      setPreview(null);
    },
  });

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(f => uploadMut.mutate(f));
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 18;

      doc.setFontSize(18);
      doc.setTextColor(0, 119, 182);
      doc.text('Blanco Dental', pageW / 2, y, { align: 'center' });
      y += 8;

      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text('Expediente de imagenes del paciente', pageW / 2, y, { align: 'center' });
      y += 10;

      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(`Paciente: ${patientName}`, 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Fecha de exportacion: ${new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, y);
      y += 10;

      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageW - 14, y);
      y += 8;

      for (const img of images) {
        const dataUrl = await fetchImageAsDataUrl(img.url);
        const imgProps = doc.getImageProperties(dataUrl);
        const maxW = pageW - 28;
        const ratio = imgProps.height / imgProps.width;
        const imgW = maxW;
        const imgH = Math.min(imgW * ratio, 120);

        if (y + imgH + 20 > doc.internal.pageSize.getHeight() - 14) {
          doc.addPage();
          y = 14;
        }

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`${img.name}  |  ${TYPE_OPTIONS.find(t => t.value === img.type)?.label ?? img.type}  |  ${new Date(img.createdAt).toLocaleDateString('es-PE')}`, 14, y);
        y += 4;
        doc.addImage(dataUrl, 'JPEG', 14, y, imgW, imgH);
        y += imgH + 10;
      }

      doc.save(`${patientName.replace(/\s+/g, '_')}_imagenes.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Radiografías e imágenes</h3>
          <p className="text-xs text-gray-500 mt-0.5">{images.length} archivo{images.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00AEEF]"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploadMut.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-60 transition-colors"
            style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {uploadMut.isPending ? 'Subiendo...' : 'Subir'}
          </button>
          {images.length > 0 && (
            <button
              onClick={exportPDF}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {exporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
          )}
        </div>
      </div>

      <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />

      <div
        className={`p-6 transition-colors ${dragging ? 'bg-[#E6F7FD]' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Cargando...</p>
        ) : images.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#00AEEF] transition-colors" onClick={() => fileInput.current?.click()}>
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p className="text-sm text-gray-500 font-medium">Arrastra imágenes aquí o haz clic para subir</p>
            <p className="text-xs text-gray-400 mt-1">Radiografías, fotos clínicas, documentos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map(img => (
              <div key={img.id} className="group relative cursor-pointer" onClick={() => setPreview(img)}>
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group-hover:border-[#00AEEF] transition-colors">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <p className="mt-1.5 text-xs text-gray-600 font-medium truncate">{img.name}</p>
                <p className="text-xs text-gray-400">{TYPE_OPTIONS.find(t => t.value === img.type)?.label ?? img.type}</p>
              </div>
            ))}
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#00AEEF] transition-colors"
              onClick={() => fileInput.current?.click()}
            >
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">{preview.name}</p>
                <p className="text-xs text-gray-500">{TYPE_OPTIONS.find(t => t.value === preview.type)?.label} · {new Date(preview.createdAt).toLocaleDateString('es-PE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={preview.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-medium text-[#0077B6] border border-[#00AEEF] rounded-lg hover:bg-[#E6F7FD] transition-colors">
                  Abrir original
                </a>
                <button
                  onClick={() => deleteMut.mutate(preview.id)}
                  disabled={deleteMut.isPending}
                  className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-700 transition-colors ml-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <img src={preview.url} alt={preview.name} className="max-h-[60vh] w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
