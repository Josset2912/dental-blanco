import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComboBox, Label, Input, Button, Popover, ListBox, ListBoxItem,
} from 'react-aria-components';
import type { Key } from 'react-aria-components';
import { getPatients } from '../api/patients';
import type { Patient } from '../api/patients';

interface Props {
  patientId: string;
  onChange: (patientId: string) => void;
  required?: boolean;
  label?: string;
}

export default function PatientComboBox({
  patientId,
  onChange,
  required,
  label = 'Paciente',
}: Props) {
  const [inputValue, setInputValue] = useState('');
  const [search, setSearch] = useState('');

  const { data: patients = [], isFetching } = useQuery({
    queryKey: ['patients-search', search],
    queryFn: () => getPatients(search || undefined),
    staleTime: 30_000,
  });

  const handleSelectionChange = (key: Key | null) => {
    if (!key) {
      onChange('');
      return;
    }
    const patient = patients.find((p: Patient) => p.id === key);
    if (patient) {
      onChange(patient.id);
      setInputValue(`${patient.name} ${patient.lastName}`);
      setSearch('');
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setSearch(val);
    if (!val) onChange('');
  };

  return (
    <ComboBox
      selectedKey={patientId || null}
      onSelectionChange={handleSelectionChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      items={patients}
      isRequired={required}
      menuTrigger="input"
      className="flex flex-col gap-1.5"
    >
      <Label className="text-sm font-medium text-gray-700">
        {label}{required && ' *'}
      </Label>

      {/* Input + chevron button */}
      <div className="relative flex items-center">
        {/* Search icon */}
        <svg
          className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
        </svg>
        <Input
          placeholder="Buscar por nombre o teléfono..."
          className="w-full pl-9 pr-9 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none
            focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all
            placeholder-gray-400"
        />
        <Button className="absolute right-2.5 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors outline-none focus:text-[#00AEEF]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </Button>
      </div>

      {/* Dropdown */}
      <Popover
        className="border border-gray-100 rounded-xl bg-white shadow-xl overflow-hidden z-50"
        style={{ width: 'var(--trigger-width)' }}
      >
        <ListBox
          className="max-h-52 overflow-y-auto outline-none"
          renderEmptyState={() => (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {isFetching ? 'Buscando...' : 'Sin resultados'}
            </div>
          )}
        >
          {(p: Patient) => (
            <ListBoxItem
              key={p.id}
              id={p.id}
              textValue={`${p.name} ${p.lastName}`}
              className={({ isSelected, isFocused }) =>
                `flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm
                 border-b border-gray-50 last:border-b-0 outline-none transition-colors
                 ${isSelected
                   ? 'bg-[#00AEEF]/[0.09] text-[#005F8E]'
                   : isFocused
                   ? 'bg-gray-50'
                   : 'hover:bg-gray-50'
                 }`
              }
            >
              <span>
                <span className="font-medium text-gray-900">{p.name} {p.lastName}</span>
                <span className="text-gray-400 text-xs ml-2">{p.phone}</span>
              </span>
              {p.id === patientId && (
                <svg className="w-3.5 h-3.5 text-[#00AEEF] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
