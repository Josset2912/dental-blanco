import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateField, DateInput, DateSegment, Label } from 'react-aria-components';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import type { Patient } from '../api/patients';

type FormData = Omit<Patient, 'id' | 'createdAt'>;

interface Props {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  initial?: Partial<FormData>;
  title?: string;
  isEdit?: boolean;
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#00AEEF,#0077B6)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
];

const inputClass =
  'px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all ' +
  'focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] w-full bg-white placeholder-gray-300';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5 first:mt-0">
      {children}
    </p>
  );
}

export default function PatientForm({
  onClose,
  onSubmit,
  loading,
  initial = {},
  title = 'Nuevo paciente',
  isEdit = false,
}: Props) {
  const [form, setForm] = useState<FormData>({
    name: initial.name ?? '',
    lastName: initial.lastName ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    birthDate: initial.birthDate ? initial.birthDate.slice(0, 10) : '',
    gender: initial.gender ?? 'MASCULINO',
    address: initial.address ?? '',
    allergies: initial.allergies ?? '',
    notes: initial.notes ?? '',
  });

  // allergies stored as chip array
  const [allergyChips, setAllergyChips] = useState<string[]>(
    initial.allergies ? initial.allergies.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [allergyInput, setAllergyInput] = useState('');
  const allergyRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergyChips.includes(val)) {
      setAllergyChips(c => [...c, val]);
    }
    setAllergyInput('');
  };

  const removeAllergy = (chip: string) =>
    setAllergyChips(c => c.filter(x => x !== chip));

  const onAllergyKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addAllergy(); }
    if (e.key === 'Backspace' && !allergyInput && allergyChips.length)
      setAllergyChips(c => c.slice(0, -1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, allergies: allergyChips.join(', ') });
  };

  const initials = [form.name.trim()[0], form.lastName.trim()[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const gradIdx = ((form.name.charCodeAt(0) || 0) + (form.lastName.charCodeAt(0) || 0)) % AVATAR_GRADIENTS.length;
  const gradient = AVATAR_GRADIENTS[gradIdx];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const calcAge = (d: string) => {
    if (!d) return null;
    const diff = Date.now() - new Date(d).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };
  const age = calcAge(form.birthDate);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="relative overflow-hidden px-6 pt-6 pb-5"
            style={{ background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)' }}>
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[#00AEEF]/10" />
            <div className="absolute bottom-0 right-12 w-16 h-16 rounded-full bg-[#0077B6]/10" />

            <div className="relative flex items-center gap-4">
              {/* Avatar preview */}
              <motion.div
                key={initials}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md"
                style={{ background: gradient }}
              >
                {initials}
              </motion.div>

              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {form.name || form.lastName
                    ? `${form.name} ${form.lastName}`.trim()
                    : 'Completa los datos del paciente'}
                  {age !== null && ` · ${age} años`}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700 transition-colors shrink-0 shadow-sm"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Form body ───────────────────────────────────── */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            <form onSubmit={handleSubmit} id="patient-form">

              {/* Datos personales */}
              <SectionTitle>Datos personales</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Nombre *</label>
                  <input className={inputClass} value={form.name} onChange={set('name')} required placeholder="Juan" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Apellidos *</label>
                  <input className={inputClass} value={form.lastName} onChange={set('lastName')} required placeholder="Pérez García" />
                </div>
                <DateField
                  value={form.birthDate ? parseDate(form.birthDate) : null}
                  onChange={(date: DateValue | null) =>
                    setForm(f => ({ ...f, birthDate: date?.toString() ?? '' }))
                  }
                  maxValue={today(getLocalTimeZone())}
                  isRequired
                  className="flex flex-col gap-1.5"
                >
                  <Label className="text-xs font-semibold text-gray-600">
                    Fecha de nacimiento *
                  </Label>
                  <DateInput className="flex items-center gap-0.5 px-3 h-[42px] border border-gray-200 rounded-xl bg-white text-sm transition-all outline-none focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#E6F7FD]">
                    {(segment) => (
                      <DateSegment
                        segment={segment}
                        className="px-px rounded tabular-nums text-gray-900 outline-none focus:bg-[#00AEEF] focus:text-white data-[placeholder]:text-gray-300 data-[type=literal]:text-gray-300 data-[type=literal]:select-none"
                      />
                    )}
                  </DateInput>
                </DateField>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Género *</label>
                  <div className="flex gap-1.5 h-[42px] items-center">
                    {(['MASCULINO', 'FEMENINO', 'OTRO'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, gender: g }))}
                        className={`flex-1 h-full rounded-xl text-xs font-semibold border transition-all ${
                          form.gender === g
                            ? 'bg-[#00AEEF] text-white border-[#00AEEF] shadow-sm'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#00AEEF] hover:text-[#00AEEF]'
                        }`}
                      >
                        {g === 'MASCULINO' ? 'Masc.' : g === 'FEMENINO' ? 'Fem.' : 'Otro'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <SectionTitle>Contacto</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Teléfono *</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"/>
                    </svg>
                    <input className={`${inputClass} pl-9`} value={form.phone} onChange={set('phone')} required placeholder="999 999 999" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Correo electrónico</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <input className={`${inputClass} pl-9`} type="email" value={form.email} onChange={set('email')} placeholder="juan@email.com" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Dirección</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <input className={`${inputClass} pl-9`} value={form.address} onChange={set('address')} placeholder="Av. Principal 123, Lima" />
                  </div>
                </div>
              </div>

              {/* Información médica */}
              <SectionTitle>Información médica</SectionTitle>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Alergias
                    <span className="ml-1.5 font-normal text-gray-400">— escribe y presiona Enter o coma</span>
                  </label>
                  <div
                    className="min-h-[44px] flex flex-wrap gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white cursor-text focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#E6F7FD] transition-all"
                    onClick={() => allergyRef.current?.focus()}
                  >
                    {allergyChips.map(chip => (
                      <span key={chip} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                        {chip}
                        <button type="button" onClick={() => removeAllergy(chip)} className="text-amber-400 hover:text-amber-700 leading-none">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                    <input
                      ref={allergyRef}
                      value={allergyInput}
                      onChange={e => setAllergyInput(e.target.value)}
                      onKeyDown={onAllergyKey}
                      onBlur={addAllergy}
                      placeholder={allergyChips.length === 0 ? 'Penicilina, látex, ibuprofeno...' : ''}
                      className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-gray-300"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Notas clínicas</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="Observaciones importantes, antecedentes médicos relevantes..."
                  />
                </div>
              </div>

            </form>
          </div>

          {/* ── Footer ──────────────────────────────────────── */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
            <p className="text-xs text-gray-400">Los campos con * son obligatorios</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="patient-form"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
              >
                {loading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={isEdit ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M5 13l4 4L19 7"}/>
                    </svg>
                    {isEdit ? 'Actualizar paciente' : 'Guardar paciente'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
