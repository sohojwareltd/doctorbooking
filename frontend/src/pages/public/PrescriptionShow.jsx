import { useMemo, useRef, useState } from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import { isEyeSpecialist } from '../../components/prescription/EyePrescriptionSection';
import PrescriptionDocument from '../../components/prescription/PrescriptionDocument';
import {
  formatDisplayDate,
  formatDisplayFromDateLike,
  formatTime12hFromDateTime,
} from '../../utils/dateFormat';

function parseMedicationsText(text) {
  if (!text?.trim()) return [];

  return text
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(' - ');
      return {
        name: parts[0] || '',
        dosage: parts[1] || '',
        duration: parts[2] || '',
        instruction: parts[3] || '',
      };
    });
}

export default function PublicPrescriptionShow({ prescription = {}, doctorInfo = {}, chamberInfo = null }) {
  const createdAtDateLabel = useMemo(() => formatDisplayFromDateLike(prescription?.created_at), [prescription?.created_at]);
  const createdAtTimeLabel = useMemo(() => formatTime12hFromDateTime(prescription?.created_at), [prescription?.created_at]);
  const nextVisitLabel = useMemo(() => formatDisplayDate(prescription?.next_visit_date), [prescription?.next_visit_date]);

  const patientName = prescription?.patient_name || `Patient #${prescription?.id || ''}`;
  const patientAge = prescription?.patient_age;
  const patientAgeUnit = prescription?.patient_age_unit || 'years';
  const patientGender = prescription?.patient_gender;
  const patientWeight = prescription?.patient_weight;
  const patientContact = prescription?.patient_contact;
  const visitType = prescription?.visit_type;
  const templateType = prescription?.template_type || (isEyeSpecialist(doctorInfo?.specialization) ? 'eye' : 'general');
  const medicines = useMemo(() => parseMedicationsText(prescription?.medications), [prescription?.medications]);

  const prescriptionRef = useRef(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (downloadingPDF) return;

    try {
      setDownloadingPDF(true);
      const element = prescriptionRef.current;
      if (!element) {
        handlePrint();
        return;
      }

      const loadHtml2pdf = () => new Promise((resolve, reject) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.12.0/html2pdf.bundle.min.js';
        script.onload = () => (window.html2pdf ? resolve(window.html2pdf) : reject(new Error('html2pdf unavailable')));
        script.onerror = () => reject(new Error('Failed to load html2pdf'));
        document.head.appendChild(script);
      });

      let html2pdf;
      try {
        html2pdf = await loadHtml2pdf();
      } catch {
        handlePrint();
        return;
      }

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `prescription-${prescription?.id || 'prescription'}-${patientName.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <PublicLayout hideHeader>
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        

          <PrescriptionDocument
            prescription={prescription}
            doctorInfo={doctorInfo}
            chamberInfo={chamberInfo}
            patientName={patientName}
            patientAge={patientAge}
            patientAgeUnit={patientAgeUnit}
            patientGender={patientGender}
            patientWeight={patientWeight}
            patientContact={patientContact}
            visitType={visitType}
            templateType={templateType}
            medicines={medicines}
            nextVisitLabel={nextVisitLabel}
            createdAtDateLabel={createdAtDateLabel}
            createdAtTimeLabel={createdAtTimeLabel}
            onPrint={handlePrint}
            onDownloadPDF={handleDownloadPDF}
            downloadingPDF={downloadingPDF}
            showDownloadButton
            backHref="/"
            backLabel="Back to Home"
            prescriptionRef={prescriptionRef}
            hidePrintHeader
            hidePrintPatientMeta
          />
        </div>
      </section>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </PublicLayout>
  );
}
