import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface TransactionPaginationProps {
  currentPage: number;
  pageSize: number;
  itemsCount: number;
  onPageChange: (page: number) => void;
}

export function TransactionPagination({
  currentPage,
  pageSize,
  itemsCount,
  onPageChange,
}: TransactionPaginationProps) {
  const hasMorePages = itemsCount === pageSize;
  const hasPreviousPage = currentPage > 0;

  // Calculate total possible pages based on current page and data
  // We know there's at least currentPage + 1 pages, and potentially more if we have PAGE_SIZE items
  const knownPages = currentPage + 1 + (hasMorePages ? 1 : 0);
  
  // Show up to 5 page numbers centered around current page
  const maxPagesToShow = 5;
  const totalPages = Math.max(knownPages, currentPage + 1);
  const pagesToShow = Math.min(maxPagesToShow, totalPages);
  
  // Center the current page in the visible range
  let startPage = Math.max(0, currentPage - Math.floor(pagesToShow / 2));
  // Adjust if we're at the end
  startPage = Math.min(startPage, Math.max(0, totalPages - pagesToShow));
  
  const pageNumbers = [...Array(pagesToShow)].map((_, i) => startPage + i);

  return (
    <div className="mt-6 flex justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
              className={!hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {pageNumbers.map((pageNum) => (
            <PaginationItem key={`pagination-current${currentPage}-page${pageNum}`}>
              <PaginationLink
                onClick={() => onPageChange(pageNum)}
                isActive={pageNum === currentPage}
                className="cursor-pointer"
                aria-label={`Go to page ${pageNum + 1}`}
                aria-current={pageNum === currentPage ? 'page' : undefined}
                role="button"
              >
                {pageNum + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext 
              onClick={() => hasMorePages && onPageChange(currentPage + 1)}
              className={!hasMorePages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
