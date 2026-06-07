import { Eye } from 'lucide-react';

export default function PrescriptionMedicineSection({
  templateType = 'general',
  medicines = [],
  normalizeMedicineName,
  medicineMatchesByRow = {},
  focusedMedicineIndex = null,
  setFocusedMedicineIndex,
  onNameFocus,
  onNameBlur,
  onNameChange,
  onSelectSuggestion,
  onDoseChange,
  onDurationChange,
  onInstructionChange,
  onRemove,
  onAdd,
  showNoMatchHint = false,
  isDoctor = true,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-5xl font-serif font-bold text-[#0d2f63]">Rx</span>
          {/* <span className="text-2xl font-bold uppercase tracking-wide text-[#0d2f63]">Prescription</span> */}
        </div>
        {/* <div className="inline-flex items-center rounded-full border border-[#ccd8ea] bg-white p-1 text-[11px] font-semibold text-[#0d2f63]">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${templateType === 'eye' ? 'text-slate-500' : 'bg-[#0b3f86] text-white'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" /> General
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${templateType === 'eye' ? 'bg-[#0b3f86] text-white' : 'text-slate-500'}`}>
            <Eye className="h-3.5 w-3.5" /> Eye
          </span>
        </div> */}
      </div>

      <div className="rounded-xl border border-[#c7d3e4] bg-white">
        <div className="grid grid-cols-12 bg-[#0b3f86] px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
          <div className="col-span-1">No.</div>
          <div className="col-span-5">Medicine</div>
          <div className="col-span-2">Dose</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Instruction</div>
        </div>

        <div className="space-y-1 p-2">
          {medicines.map((m, idx) => {
            const normalizedMedicineName = normalizeMedicineName ? normalizeMedicineName(m.name) : '';
            const matchedSuggestions = medicineMatchesByRow[idx] || [];
            const hasMedicineMatches = matchedSuggestions.length > 0;
            const showMedicineMatchDropdown = focusedMedicineIndex === idx && hasMedicineMatches;

            return (
              <div key={idx} className={`grid grid-cols-12 items-center gap-2 border-b border-dotted border-[#b9c7dc] pb-1 ${showMedicineMatchDropdown ? 'relative z-40' : ''}`}>
                <div className="col-span-1 text-center text-sm font-bold text-slate-500">{idx + 1}</div>
                <div className="col-span-5 relative">
                  <input
                    className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 focus:outline-none"
                    value={m.name}
                    readOnly={!isDoctor}
                    onFocus={() => {
                      if (!isDoctor) return;
                      setFocusedMedicineIndex?.(idx);
                      onNameFocus?.(idx, m.name);
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        onNameBlur?.(idx);
                      }, 120);
                    }}
                    onChange={(e) => isDoctor && onNameChange?.(idx, e.target.value)}
                    placeholder="Medicine"
                  />
                  {m.category_name ? (
                    <p className="mt-0.5 text-[10px] font-medium text-teal-700">{m.category_name}</p>
                  ) : null}
                  {showMedicineMatchDropdown ? (
                    <div className="absolute left-0 z-50 mt-1 min-w-[min(520px,calc(100vw-3rem))] w-[max(100%,min(520px,calc(100vw-3rem)))] max-h-80 overflow-y-auto overscroll-contain rounded-md border border-[#c7d6f7] bg-white shadow-xl">
                      {matchedSuggestions.map((med, optionIdx) => (
                        <button
                          key={`${med.id ?? med.name}-${med.strength}-${optionIdx}`}
                          type="button"
                          className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs last:border-b-0 hover:bg-[#edf2ff]"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            onSelectSuggestion?.(idx, med);
                            setFocusedMedicineIndex?.(null);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-slate-800">{med.name}</span>
                            <span className="shrink-0 text-slate-500">{med.strength || 'No strength'}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                            <span>Generic: {med.generic_name || 'N/A'}</span>
                            <span className="text-slate-300">|</span>
                            <span>Category: {med.category_name || 'N/A'}</span>
                            <span className="text-slate-300">|</span>
                            <span>Supplier: {med.supplier_name || 'N/A'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {/* {showNoMatchHint && normalizedMedicineName && !hasMedicineMatches ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">No medicine match found.</p>
                  ) : null} */}
                </div>
                <div className="col-span-2">
                  <input
                    className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 focus:outline-none"
                    value={m.dosage || ''}
                    readOnly={!isDoctor}
                    onChange={(e) => isDoctor && onDoseChange?.(idx, e.target.value)}
                    placeholder="1+0+1"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    className="w-full border-0 bg-transparent px-0 py-0.5 text-sm text-slate-900 focus:outline-none"
                    value={m.duration || ''}
                    readOnly={!isDoctor}
                    onChange={(e) => isDoctor && onDurationChange?.(idx, e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <input
                    className="w-full border-0 bg-transparent px-0 py-0.5 text-xs text-slate-900 focus:outline-none"
                    value={m.instruction || ''}
                    readOnly={!isDoctor}
                    onChange={(e) => isDoctor && onInstructionChange?.(idx, e.target.value)}
                    placeholder="Instruction"
                  />
                  {isDoctor && (
                  <button
                    type="button"
                    className="rounded border border-rose-300 bg-rose-50 px-1.5 py-1 text-xs text-rose-800 hover:bg-rose-100"
                    onClick={() => onRemove?.(idx)}
                  >
                    x
                  </button>
                  )}
                </div>
              </div>
            );
          })}

          {isDoctor && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 w-full rounded border border-dashed border-[#b9c7dc] bg-[#f8fbff] px-3 py-2 text-lg font-semibold text-[#3556a6] transition hover:bg-[#edf2ff]"
          >
            + Add Medicine Row
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
