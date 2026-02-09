import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Logic để tạo danh sách các trang cần hiển thị
  const getPageNumbers = () => {
    const delta = 2; // Số lượng trang hiển thị 2 bên trang hiện tại
    const range = [];
    const rangeWithDots: (number | string)[] = [];

    // Luôn hiển thị trang 1, trang cuối, và khoảng giữa
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    // Thêm dấu ... vào các khoảng trống
    let l: number | null = null;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  const btnClass = "min-w-[40px] h-[40px] flex items-center justify-center rounded border text-sm font-medium transition-colors";
  const activeClass = "bg-primary border-primary text-white pointer-events-none";
  // Updated for light mode: bg-white text-gray-700 border-gray-300
  const inactiveClass = "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-primary hover:border-primary dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";
  const disabledClass = "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-600";

  return (
    <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
      {/* Nút về trang đầu */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`${btnClass} ${currentPage === 1 ? disabledClass : inactiveClass}`}
        title="Trang đầu"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* Nút trang trước */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnClass} ${currentPage === 1 ? disabledClass : inactiveClass}`}
        title="Trang trước"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Danh sách số trang */}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="flex items-end justify-center w-[30px] h-[30px] text-gray-500 pb-2">
              ...
            </span>
          );
        }
        
        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            className={`${btnClass} ${currentPage === page ? activeClass : inactiveClass}`}
          >
            {page}
          </button>
        );
      })}

      {/* Nút trang sau */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnClass} ${currentPage === totalPages ? disabledClass : inactiveClass}`}
        title="Trang sau"
      >
        <ChevronRight size={16} />
      </button>

      {/* Nút về trang cuối */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${btnClass} ${currentPage === totalPages ? disabledClass : inactiveClass}`}
        title="Trang cuối"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};