import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  visiblePageNumbers: number[];
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  visiblePageNumbers,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-brown/5 bg-white px-4 py-4 shadow-[0_4px_20px_rgba(61,43,31,0.03)] sm:flex-row"
      aria-label="Paginação do catálogo"
    >
      <p className="text-xs font-medium text-brand-brown/50">
        Página {currentPage} de {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-9 rounded-full border-brand-brown/15 px-3 text-brand-brown hover:bg-stone-50 disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {visiblePageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-bold transition-colors ${
                currentPage === pageNumber
                  ? 'bg-brand-brown text-white shadow-sm'
                  : 'text-brand-brown/60 hover:bg-stone-50 hover:text-brand-brown'
              }`}
              aria-current={currentPage === pageNumber ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 rounded-full border-brand-brown/15 px-3 text-brand-brown hover:bg-stone-50 disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
