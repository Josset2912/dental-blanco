import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOdontogram, saveOdontogram } from '../api/odontogram';
import type { ToothCondition } from '../api/odontogram';
import type { OdontogramConditions } from '../api/odontogram';

// ─── Condiciones ────────────────────────────────────────────────────────────
const CONDITIONS: { id: ToothCondition; label: string; color: string }[] = [
  { id: 'SANO',       label: 'Sano',        color: '#1e2d3e' },
  { id: 'CARIES',     label: 'Caries',      color: '#dc2626' },
  { id: 'OBTURADO',   label: 'Obturado',    color: '#2563eb' },
  { id: 'CORONA',     label: 'Corona',      color: '#d97706' },
  { id: 'ENDODONCIA', label: 'Endodoncia',  color: '#7c3aed' },
  { id: 'AUSENTE',    label: 'Ausente',     color: '#374151' },
  { id: 'FRACTURA',   label: 'Fractura',    color: '#ea580c' },
  { id: 'IMPLANTE',   label: 'Implante',    color: '#059669' },
];

const SANO_COLOR = '#1e2d3e';

// ─── Layout FDI ─────────────────────────────────────────────────────────────
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// ─── SVG paths anatómicos (viewBox 0 0 40 88, corona abajo, raíces arriba) ──
const PATHS: Record<string, string> = {
  CI:  'M20,2 C23,9 26,24 27,40 C28,50 29,56 29,62 L33,65 L33,80 Q33,87 20,87 Q7,87 7,80 L7,65 L11,62 C11,56 12,50 13,40 C14,24 17,9 20,2 Z',
  LI:  'M20,4 C22,11 24,26 25,42 C26,51 27,57 27,63 L31,66 L31,80 Q31,86 20,86 Q9,86 9,80 L9,66 L13,63 C13,57 14,51 15,42 C16,26 18,11 20,4 Z',
  CA:  'M20,0 C23,11 27,29 28,46 C29,57 29,64 28,70 L33,75 L32,82 Q20,89 8,82 L7,75 L12,70 C11,64 11,57 12,46 C13,29 17,11 20,0 Z',
  PM:  'M20,3 C22,13 24,29 25,45 C26,54 26,60 26,65 L33,70 L33,81 Q29,86 26,88 Q23,84 20,84 Q17,84 14,88 Q11,86 7,81 L7,70 L14,65 C14,60 14,54 15,45 C16,29 18,13 20,3 Z',
  MU:  'M10,2 Q9,14 9,28 Q9,42 11,52 L17,52 Q15,42 14,28 Q13,14 14,2 Z M30,2 Q31,14 31,28 Q31,42 29,52 L23,52 Q25,42 26,28 Q26,14 26,2 Z M19,6 Q19,18 19,32 Q19,46 19,52 L21,52 Q21,46 21,32 Q21,18 21,6 Z M4,52 L36,52 L36,76 Q33,82 30,85 Q27,82 22,82 Q20,85 18,82 Q13,82 10,85 Q7,82 4,76 Z',
  MU2: 'M11,3 Q10,15 10,29 Q10,43 12,52 L18,52 Q16,43 15,29 Q14,15 15,3 Z M29,3 Q30,15 30,29 Q30,43 28,52 L22,52 Q24,43 25,29 Q25,15 25,3 Z M19,7 Q19,19 19,33 Q19,46 19,52 L21,52 Q21,46 21,33 Q21,19 21,7 Z M5,52 L35,52 L35,75 Q32,81 29,84 Q26,81 22,81 Q20,84 18,81 Q14,81 11,84 Q8,81 5,75 Z',
  WU:  'M12,5 Q11,17 11,30 Q11,43 13,52 L19,52 Q17,43 16,30 Q15,17 16,5 Z M28,5 Q29,17 29,30 Q29,43 27,52 L21,52 Q23,43 24,30 Q24,17 24,5 Z M6,52 L34,52 L34,74 Q31,80 27,83 Q24,80 20,80 Q16,80 13,83 Q9,80 6,74 Z',
  ML:  'M11,2 Q10,16 10,32 Q10,46 12,54 L20,54 Q19,46 18,32 Q17,16 17,2 Z M29,2 Q30,16 30,32 Q30,46 28,54 L22,54 Q23,46 24,32 Q24,16 24,2 Z M4,54 L36,54 L36,78 Q33,84 30,87 Q27,84 24,84 Q22,87 20,87 Q18,87 16,84 Q13,84 10,87 Q7,84 4,78 Z',
  ML2: 'M11,3 Q10,17 10,33 Q10,46 13,54 L20,54 Q19,46 18,33 Q17,17 17,3 Z M29,3 Q30,17 30,33 Q30,46 27,54 L22,54 Q23,46 24,33 Q24,17 24,3 Z M5,54 L35,54 L35,77 Q32,83 29,86 Q26,83 22,83 Q20,86 18,83 Q14,83 11,86 Q8,83 5,77 Z',
  WL:  'M12,5 Q11,17 11,30 Q11,43 14,52 L20,52 Q19,43 18,30 Q17,17 17,5 Z M28,5 Q29,17 29,30 Q29,43 26,52 L22,52 Q23,43 24,30 Q24,17 24,5 Z M6,52 L34,52 L34,73 Q31,79 27,82 Q24,79 20,79 Q16,79 13,82 Q9,79 6,73 Z',
};

function getPath(num: number): string {
  const d = num % 10;
  const up = num >= 11 && num <= 28;
  if (d === 1) return PATHS.CI;
  if (d === 2) return PATHS.LI;
  if (d === 3) return PATHS.CA;
  if (d === 4 || d === 5) return PATHS.PM;
  if (d === 6) return up ? PATHS.MU : PATHS.ML;
  if (d === 7) return up ? PATHS.MU2 : PATHS.ML2;
  return up ? PATHS.WU : PATHS.WL;
}

function getToothWidth(num: number): number {
  const d = num % 10;
  if (d === 1) return 30; if (d === 2) return 26; if (d === 3) return 28;
  if (d === 4 || d === 5) return 30; if (d === 6) return 40;
  if (d === 7) return 38; return 32;
}

function condColor(c: ToothCondition): string {
  return CONDITIONS.find(x => x.id === c)?.color ?? SANO_COLOR;
}

function defaultTooth(): Record<string, ToothCondition> {
  return { w: 'SANO', v: 'SANO', o: 'SANO', l: 'SANO', m: 'SANO', d: 'SANO' };
}

// ─── Diente (estilo outline médico) ─────────────────────────────────────────
function Tooth({
  num, state, isUpper, onClick, onHover, onLeave,
}: {
  num: number;
  state: Record<string, ToothCondition>;
  isUpper: boolean;
  activeCond: ToothCondition;
  onClick: (num: number, surf: string | null) => void;
  onHover: (num: number, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const w = getToothWidth(num);
  const h = 88;
  const path = getPath(num);
  const absent = state.w === 'AUSENTE';
  const toothFill = absent ? '#1a2035' : condColor(state.w) === SANO_COLOR ? SANO_COLOR : condColor(state.w);
  const flipTransform = isUpper ? undefined : `scale(1,-1) translate(0,${-h})`;

  return (
    <svg
      width={w} height={h}
      viewBox={`0 0 40 ${h}`}
      style={{ display: 'block', cursor: 'pointer' }}
      onClick={() => onClick(num, null)}
      onMouseEnter={e => onHover(num, e)}
      onMouseLeave={onLeave}
      onMouseMove={e => onHover(num, e)}
    >
      <g transform={flipTransform}>
        <path
          d={path}
          fill={toothFill}
          stroke="#c8c0b0"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>
      {absent && (
        <>
          <line x1="8" y1="8" x2={w - 8} y2={h - 8} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" pointerEvents="none" />
          <line x1={w - 8} y1="8" x2="8" y2={h - 8} stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" pointerEvents="none" />
        </>
      )}
    </svg>
  );
}

// ─── Círculo de superficies (5 sectores: V/L, M, O, D, L/V) ─────────────────
function SurfaceCircle({
  num, state, isUpper, onClick, onHover, onLeave,
}: {
  num: number;
  state: Record<string, ToothCondition>;
  isUpper: boolean;
  onClick: (num: number, surf: string) => void;
  onHover: (num: number, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const tw = getToothWidth(num);
  const cx = tw / 2;
  const cy = tw / 2;
  const R = tw / 2 - 1.5;
  const ri = R * 0.33;

  const [topKey, botKey] = isUpper ? ['v', 'l'] : ['l', 'v'];

  function sector(a1Deg: number, a2Deg: number): string {
    const toRad = (d: number) => (d - 90) * Math.PI / 180;
    const a1 = toRad(a1Deg);
    const a2 = toRad(a2Deg);
    const x1i = cx + ri * Math.cos(a1);
    const y1i = cy + ri * Math.sin(a1);
    const x1o = cx + R  * Math.cos(a1);
    const y1o = cy + R  * Math.sin(a1);
    const x2o = cx + R  * Math.cos(a2);
    const y2o = cy + R  * Math.sin(a2);
    const x2i = cx + ri * Math.cos(a2);
    const y2i = cy + ri * Math.sin(a2);
    const large = (a2Deg - a1Deg) > 180 ? 1 : 0;
    return `M ${x1i} ${y1i} L ${x1o} ${y1o} A ${R} ${R} 0 ${large} 1 ${x2o} ${y2o} L ${x2i} ${y2i} A ${ri} ${ri} 0 ${large} 0 ${x1i} ${y1i} Z`;
  }

  const segments = [
    { key: topKey, d: sector(-45, 45)   },
    { key: 'd',    d: sector(45, 135)   },
    { key: botKey, d: sector(135, 225)  },
    { key: 'm',    d: sector(225, 315)  },
  ];

  const divStroke = '#4b5563';

  return (
    <svg
      width={tw} height={tw} viewBox={`0 0 ${tw} ${tw}`} style={{ display: 'block' }}
      onMouseEnter={e => onHover(num, e)}
      onMouseLeave={onLeave}
      onMouseMove={e => onHover(num, e)}
    >
      {segments.map(seg => (
        <path
          key={seg.key}
          d={seg.d}
          fill={condColor(state[seg.key] as ToothCondition ?? 'SANO')}
          stroke={divStroke}
          strokeWidth="0.7"
          style={{ cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); onClick(num, seg.key); }}
        />
      ))}
      <circle
        cx={cx} cy={cy} r={ri}
        fill={condColor(state['o'] as ToothCondition ?? 'SANO')}
        stroke={divStroke}
        strokeWidth="0.7"
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); onClick(num, 'o'); }}
      />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={divStroke} strokeWidth="0.7" pointerEvents="none" />
    </svg>
  );
}

// ─── Tooltip label diente ────────────────────────────────────────────────────
const TOOTH_NAMES: Record<number, string> = {
  11: 'IC sup der', 12: 'IL sup der', 13: 'C sup der', 14: '1PM sup der', 15: '2PM sup der',
  16: '1M sup der', 17: '2M sup der', 18: 'CJ sup der',
  21: 'IC sup izq', 22: 'IL sup izq', 23: 'C sup izq', 24: '1PM sup izq', 25: '2PM sup izq',
  26: '1M sup izq', 27: '2M sup izq', 28: 'CJ sup izq',
  31: 'IC inf izq', 32: 'IL inf izq', 33: 'C inf izq', 34: '1PM inf izq', 35: '2PM inf izq',
  36: '1M inf izq', 37: '2M inf izq', 38: 'CJ inf izq',
  41: 'IC inf der', 42: 'IL inf der', 43: 'C inf der', 44: '1PM inf der', 45: '2PM inf der',
  46: '1M inf der', 47: '2M inf der', 48: 'CJ inf der',
};

// ─── Componente principal ────────────────────────────────────────────────────
interface TooltipInfo { num: number; x: number; y: number }

export default function Odontogram({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [activeCond, setActiveCond] = useState<ToothCondition>('CARIES');
  const [localState, setLocalState] = useState<OdontogramConditions>({});
  const [dirty, setDirty] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const { data: remoteState } = useQuery({
    queryKey: ['odontogram', patientId],
    queryFn: () => getOdontogram(patientId),
  });

  useEffect(() => {
    if (remoteState) {
      setLocalState(remoteState);
      setDirty(false);
    }
  }, [remoteState]);

  const saveMut = useMutation({
    mutationFn: () => saveOdontogram(patientId, localState),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['odontogram', patientId] });
      setDirty(false);
    },
  });

  const getState = useCallback((num: number): Record<string, ToothCondition> => {
    return (localState[String(num)] as Record<string, ToothCondition>) ?? defaultTooth();
  }, [localState]);

  const handleHover = useCallback((num: number, e: React.MouseEvent) => {
    setTooltip({ num, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => setTooltip(null), []);

  const handleClick = useCallback((num: number, surf: string | null) => {
    setLocalState(prev => {
      const cur = (prev[String(num)] as Record<string, ToothCondition>) ?? defaultTooth();
      if (surf === null) {
        return {
          ...prev,
          [String(num)]: { w: activeCond, v: activeCond, o: activeCond, l: activeCond, m: activeCond, d: activeCond },
        };
      }
      return { ...prev, [String(num)]: { ...cur, [surf]: activeCond } };
    });
    setDirty(true);
  }, [activeCond]);

  function renderRow(teeth: number[], isUpper: boolean) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: isUpper ? 'flex-end' : 'flex-start', gap: 2 }}>
        {teeth.map(n => (
          <Tooth
            key={n} num={n} state={getState(n)} isUpper={isUpper}
            activeCond={activeCond} onClick={handleClick}
            onHover={handleHover} onLeave={handleLeave}
          />
        ))}
      </div>
    );
  }

  function renderNumbers(teeth: number[], isUpper: boolean) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {teeth.map(n => (
          <div
            key={n}
            style={{
              width: getToothWidth(n),
              textAlign: 'center',
              fontSize: 9,
              color: isUpper ? '#6b7280' : '#6b7280',
              lineHeight: 1.4,
              userSelect: 'none',
            }}
          >
            {n}
          </div>
        ))}
      </div>
    );
  }

  function renderCircles(teeth: number[], isUpper: boolean) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {teeth.map(n => (
          <SurfaceCircle
            key={n} num={n} state={getState(n)} isUpper={isUpper}
            onClick={handleClick} onHover={handleHover} onLeave={handleLeave}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Odontograma</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Haz clic en la silueta de un diente o en uno de los círculos de superficie de corona entre los arcos.
          </p>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={!dirty || saveMut.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white transition-colors rounded-lg text-xs font-medium" style={{ background: "linear-gradient(135deg,#00AEEF,#0077B6)" }}>
          {saveMut.isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Canvas */}
      <div style={{ background: '#111827', padding: '16px 10px', userSelect: 'none' }}>
        {/* Maxilar Superior */}
        {renderNumbers(UPPER, true)}
        {renderRow(UPPER, true)}
        <div style={{ marginTop: 4 }}>{renderCircles(UPPER, true)}</div>

        {/* Divisor */}
        <div style={{ height: 1, background: '#1f2937', margin: '3px auto', width: '90%' }} />

        {/* Mandíbula Inferior */}
        <div style={{ marginBottom: 4 }}>{renderCircles(LOWER, false)}</div>
        {renderRow(LOWER, false)}
        {renderNumbers(LOWER, false)}
      </div>

      {/* Condición activa */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2.5">Condición activa:</p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCond(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                activeCond === c.id
                  ? 'border-[#00AEEF] bg-[#E6F7FD] text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span style={{
                width: 10, height: 10, borderRadius: 2,
                background: c.id === 'SANO' ? '#c8c0b0' : c.color,
                flexShrink: 0, display: 'inline-block',
                border: c.id === 'SANO' ? '1px solid #9ca3af' : 'none',
              }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {saveMut.isError && (
        <div className="mx-5 mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Error al guardar. Intenta de nuevo.
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (() => {
        const st = getState(tooltip.num);
        const name = TOOTH_NAMES[tooltip.num] ?? `Diente ${tooltip.num}`;
        const conds = Object.entries(st)
          .filter(([k, v]) => k !== 'w' && v !== 'SANO')
          .map(([k, v]) => {
            const surf: Record<string, string> = { v: 'Vestibular', o: 'Oclusal', l: 'Lingual', m: 'Mesial', d: 'Distal' };
            const label = CONDITIONS.find(c => c.id === v)?.label ?? v;
            return `${surf[k] ?? k}: ${label}`;
          });
        return (
          <div
            style={{
              position: 'fixed',
              left: tooltip.x + 14,
              top: tooltip.y - 10,
              transform: 'translateY(-100%)',
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11,
              pointerEvents: 'none',
              zIndex: 50,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '1px solid #374151',
              minWidth: 140,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              #{tooltip.num} — {name}
            </div>
            {conds.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>Sin condiciones registradas</div>
            ) : (
              conds.map((c, i) => (
                <div key={i} style={{ color: '#d1d5db' }}>{c}</div>
              ))
            )}
          </div>
        );
      })()}
    </div>
  );
}

// suppress unused import warning for TOOTH_NAMES (used if tooltip added later)
void TOOTH_NAMES;
