import { Link } from '@inertiajs/react';

export default function Pagination({ data }) {
  // Check if pagination data exists
  if (!data || !data.links || typeof data.current_page !== 'number') {
    return null;
  }

  const prev = data.links.find((l) => String(l.label).toLowerCase().includes('previous'));
  const next = data.links.find((l) => String(l.label).toLowerCase().includes('next'));

  const btnBase = 'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition';
  const btnOn = 'bg-[#00acb1] text-white hover:bg-[#00787b]';
  const btnOff = 'bg-gray-100 text-gray-400 cursor-not-allowed';

  return (
    <div className="border-t bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold text-[#005963]">{data.current_page}</span> of{' '}
          <span className="font-semibold text-[#005963]">{data.last_page}</span>
          {data.total && (
            <>
              {' '}· Showing <span className="font-semibold text-[#005963]">{data.from || 0}</span> to{' '}
              <span className="font-semibold text-[#005963]">{data.to || 0}</span> of{' '}
              <span className="font-semibold text-[#005963]">{data.total}</span> results
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {prev?.url ? (
            <Link href={prev.url} className={`${btnBase} ${btnOn}`}>
              Prev
            </Link>
          ) : (
            <span className={`${btnBase} ${btnOff}`}>Prev</span>
          )}
          {next?.url ? (
            <Link href={next.url} className={`${btnBase} ${btnOn}`}>
              Next
            </Link>
          ) : (
            <span className={`${btnBase} ${btnOff}`}>Next</span>
          )}
        </div>
      </div>
    </div>
  );
}
