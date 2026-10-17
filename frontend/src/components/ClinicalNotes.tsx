import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClinicalNotes, createClinicalNote, deleteClinicalNote } from '../api/clinical-notes';

export default function ClinicalNotes({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['clinical-notes', patientId],
    queryFn: () => getClinicalNotes(patientId),
  });

  const createMut = useMutation({
    mutationFn: () => createClinicalNote(patientId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      setContent('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteClinicalNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinical-notes', patientId] });
      setConfirmDelete(null);
    },
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notas de evolución clínica</h3>
        <p className="text-xs text-gray-500 mt-0.5">{notes.length} nota{notes.length !== 1 ? 's' : ''} registrada{notes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add note form */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribe una nota de evolución clínica..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white placeholder-gray-400"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={() => createMut.mutate()}
            disabled={!content.trim() || createMut.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
          >
            {createMut.isPending ? 'Guardando...' : 'Agregar nota'}
          </button>
        </div>
      </div>

      {/* Notes timeline */}
      <div className="px-6 py-4">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-6">Cargando notas...</p>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-sm text-gray-500">Sin notas clínicas registradas</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-5">
              {notes.map(note => (
                <div key={note.id} className="relative pl-9">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#E6F7FD] border-2 border-[#00AEEF] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#00AEEF]" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs font-semibold text-[#0077B6]">{note.doctor.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(note.createdAt).toLocaleDateString('es-PE', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(note.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                        title="Eliminar nota"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Eliminar nota</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-5">¿Estás seguro de eliminar esta nota clínica? Esta acción no se puede deshacer.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
                  onClick={() => deleteMut.mutate(confirmDelete)}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
