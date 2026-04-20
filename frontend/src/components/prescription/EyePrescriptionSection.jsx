import { Eye } from 'lucide-react';

const createEyeSide = () => ({ sph: '', cyl: '', axis: '', va: '' });

const createEyeRow = () => ({
    right: createEyeSide(),
    left: createEyeSide(),
});

export function createEmptyEyePrescriptionData() {
    return {
        eye: {
            distance: createEyeRow(),
            near: createEyeRow(),
            findings: '',
            notes: '',
            advice: '',
            iop_right: '',
            iop_left: '',
            pd: '',
        },
    };
}

export function normalizeEyePrescriptionData(value) {
    const payload = value && typeof value === 'object' ? value : {};
    const eye = payload.eye && typeof payload.eye === 'object' ? payload.eye : {};
    const normalizeRow = (row) => ({
        right: { ...createEyeSide(), ...(row?.right || {}) },
        left: { ...createEyeSide(), ...(row?.left || {}) },
    });

    return {
        eye: {
            distance: normalizeRow(eye.distance),
            near: normalizeRow(eye.near),
            findings: eye.findings || '',
            notes: eye.notes || '',
            advice: eye.advice || '',
            iop_right: eye.iop_right || '',
            iop_left: eye.iop_left || '',
            pd: eye.pd || '',
        },
    };
}

export function isEyeSpecialist(specialization) {
    return /(eye|ophthalm|ophthal|vision|optom)/i.test(String(specialization || ''));
}

function CellField({ readOnly, value, placeholder, className = '', onChange }) {
    if (readOnly) {
        return (
            <div className={`min-h-[34px] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 ${className}`}>
                {value || <span className="text-slate-300">{placeholder}</span>}
            </div>
        );
    }

    return (
        <input
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`w-full rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-sm text-slate-900  ${className}`}
        />
    );
}

function TextBlock({ readOnly, value, placeholder, rows = 3, onChange }) {
    if (readOnly) {
        return (
            <div
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-800 whitespace-pre-wrap"
                style={{ minHeight: `${rows * 1.6}rem` }}
            >
                {value || <span className="text-slate-300">{placeholder}</span>}
            </div>
        );
    }

    return (
        <textarea
            value={value || ''}
            rows={rows}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 "
        />
    );
}

export default function EyePrescriptionSection({ value, onChange, readOnly = false }) {
    const data = normalizeEyePrescriptionData(value);

    const updateEye = (patch) => {
        if (!onChange) return;
        onChange({
            ...data,
            eye: {
                ...data.eye,
                ...patch,
            },
        });
    };

    const updateCell = (row, side, field, nextValue) => {
        updateEye({
            [row]: {
                ...data.eye[row],
                [side]: {
                    ...data.eye[row][side],
                    [field]: nextValue,
                },
            },
        });
    };

    const renderRow = (label, rowKey) => (
        <div key={rowKey} className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))_repeat(4,minmax(0,1fr))] gap-2">
            <div className="flex items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
            </div>
            {['sph', 'cyl', 'axis', 'va'].map((field) => (
                <CellField
                    key={`right-${rowKey}-${field}`}
                    readOnly={readOnly}
                    value={data.eye[rowKey].right[field]}
                    placeholder={field.toUpperCase()}
                    onChange={(nextValue) => updateCell(rowKey, 'right', field, nextValue)}
                />
            ))}
            {['sph', 'cyl', 'axis', 'va'].map((field) => (
                <CellField
                    key={`left-${rowKey}-${field}`}
                    readOnly={readOnly}
                    value={data.eye[rowKey].left[field]}
                    placeholder={field.toUpperCase()}
                    onChange={(nextValue) => updateCell(rowKey, 'left', field, nextValue)}
                />
            ))}
        </div>
    );

    return (
        <div className="space-y-4 rounded-2xl border border-[#d9e4f4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Eye className="h-4 w-4 text-[#3556a6]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Eye Assessment</span>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[760px] space-y-2">
                    <div className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))_repeat(4,minmax(0,1fr))] gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        <div />
                        <div className="col-span-4 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center">OD (RE)</div>
                        <div className="col-span-4 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-center">OS (LE)</div>
                    </div>
                    <div className="grid grid-cols-[52px_repeat(4,minmax(0,1fr))_repeat(4,minmax(0,1fr))] gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        <div />
                        {['SPH', 'CYL', 'AXIS', 'V/A', 'SPH', 'CYL', 'AXIS', 'V/A'].map((label, index) => (
                            <div key={`${label}-${index}`} className="px-1 text-center">{label}</div>
                        ))}
                    </div>
                    {renderRow('D', 'distance')}
                    {renderRow('N', 'near')}
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">IOP Right</div>
                    <CellField
                        readOnly={readOnly}
                        value={data.eye.iop_right}
                        placeholder="mmHg"
                        onChange={(nextValue) => updateEye({ iop_right: nextValue })}
                    />
                </div>
                <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">IOP Left</div>
                    <CellField
                        readOnly={readOnly}
                        value={data.eye.iop_left}
                        placeholder="mmHg"
                        onChange={(nextValue) => updateEye({ iop_left: nextValue })}
                    />
                </div>
                <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">PD</div>
                    <CellField
                        readOnly={readOnly}
                        value={data.eye.pd}
                        placeholder="PD"
                        onChange={(nextValue) => updateEye({ pd: nextValue })}
                    />
                </div>
            </div>

            <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Findings</div>
                <TextBlock
                    readOnly={readOnly}
                    value={data.eye.findings}
                    rows={3}
                    placeholder="Anterior segment, lens, fundus, ocular movement, etc."
                    onChange={(nextValue) => updateEye({ findings: nextValue })}
                />
            </div>

            <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Clinical Notes</div>
                <TextBlock
                    readOnly={readOnly}
                    value={data.eye.notes}
                    rows={3}
                    placeholder="Visual complaint summary, constant use note, lens advice, etc."
                    onChange={(nextValue) => updateEye({ notes: nextValue })}
                />
            </div>

            <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Optical Advice</div>
                <TextBlock
                    readOnly={readOnly}
                    value={data.eye.advice}
                    rows={2}
                    placeholder="Glasses advice, lens use, follow-up instruction, etc."
                    onChange={(nextValue) => updateEye({ advice: nextValue })}
                />
            </div>
        </div>
    );
}