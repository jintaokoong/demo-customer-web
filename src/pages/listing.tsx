import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const getPages = (currentPage: number, totalPages: number, maxVisiblePages = 5) => {
  const totalPageNumbers = Math.min(maxVisiblePages, totalPages);
  const halfWay = Math.floor(totalPageNumbers / 2);

  const startPage = Math.max(
    Math.min(
      currentPage - halfWay,
      totalPages - totalPageNumbers + 1
    ),
    1
  );

  const endPage = Math.min(startPage + totalPageNumbers - 1, totalPages);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
};


const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void
}) => {
  const maxVisiblePages = 5;

  const pageNumbers = useMemo(
    () => getPages(currentPage, totalPages, maxVisiblePages),
    [currentPage, totalPages, maxVisiblePages]
  );

  return (
    <nav aria-label="Page navigation">
      <ul 
        style={{ display: 'flex', listStyle: 'none', padding: 0, gap: '0.2rem' }}
      >
        {/* Previous Button */}
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous"
          >
            Previous
          </button>
        </li>

        {/* First Page Button */}
        {pageNumbers[0] > 1 && (
          <>
            <li className="page-item">
              <button className="page-link" onClick={() => onPageChange(1)}>
                1
              </button>
            </li>
            <li className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          </>
        )}

        {/* Visible Page Numbers */}
        {pageNumbers.map((number) => (
          <li
            key={number}
          >
            <button className="page-link" onClick={() => onPageChange(number)}
              style={{ fontWeight: number === currentPage ? 'bold' : 'normal' }}
            >
              {number}
            </button>
          </li>
        ))}

        {/* Last Page Button */}
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            <li className="page-item disabled">
              <span className="page-link">...</span>
            </li>
            <li className="page-item">
              <button
                className="page-link"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        {/* Next Button */}
        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};


export default function Listing() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 50;
  return (
    <main>
      <h1>{currentPage} is the current page</h1>
      <p>List of Customers</p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </main>
  )
}