import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    showInfo?: boolean;
    totalItems?: number;
    itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    showInfo = true,
    totalItems,
    itemsPerPage,
}) => {
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const buttonBase = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    const buttonActive = 'bg-blue-600 text-white hover:bg-blue-700';
    const buttonInactive = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            {showInfo && totalItems !== undefined && itemsPerPage !== undefined && (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Wyświetlanie {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} z {totalItems}
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!canGoPrev}
                    className={`${buttonBase} ${buttonInactive}`}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                    {/* Show first page */}
                    {currentPage > 2 && (
                        <>
                            <button
                                onClick={() => onPageChange(1)}
                                className={`${buttonBase} ${buttonInactive}`}
                            >
                                1
                            </button>
                            {currentPage > 3 && <span className="px-2 text-neutral-400">...</span>}
                        </>
                    )}

                    {/* Previous page */}
                    {currentPage > 1 && (
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            className={`${buttonBase} ${buttonInactive}`}
                        >
                            {currentPage - 1}
                        </button>
                    )}

                    {/* Current page */}
                    <button className={`${buttonBase} ${buttonActive}`}>
                        {currentPage}
                    </button>

                    {/* Next page */}
                    {currentPage < totalPages && (
                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            className={`${buttonBase} ${buttonInactive}`}
                        >
                            {currentPage + 1}
                        </button>
                    )}

                    {/* Show last page */}
                    {currentPage < totalPages - 1 && (
                        <>
                            {currentPage < totalPages - 2 && <span className="px-2 text-neutral-400">...</span>}
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className={`${buttonBase} ${buttonInactive}`}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!canGoNext}
                    className={`${buttonBase} ${buttonInactive}`}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
