import { useMemo, useState } from "react";
import { NetError } from "../utils/net-error";
import { ZodError, z } from "zod";
import { ApiResponseSchema } from "../api-response.schema";
import { CustomerSchema } from "../customer.schema";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

// API response schema definition
const CustomerListingSchema = ApiResponseSchema(
  z.object({
    records: z.array(CustomerSchema),
    total_pages: z.number(),
  }),
);

const getPages = (
  currentPage: number,
  totalPages: number,
  maxVisiblePages = 5,
) => {
  const totalPageNumbers = Math.min(maxVisiblePages, totalPages);
  const halfWay = Math.floor(totalPageNumbers / 2);

  const startPage = Math.max(
    Math.min(currentPage - halfWay, totalPages - totalPageNumbers + 1),
    1,
  );

  const endPage = Math.min(startPage + totalPageNumbers - 1, totalPages);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );
};

// throws error when the response is not ok or the request fails
const fetchCustomerListing = (page: number, limit: number) => {
  const url = new URL("/api/customers", import.meta.env.VITE_API_BASE_URL);

  // add query params
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());

  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((message) => {
          throw new NetError("server-error", message);
        });
      }
      return response
        .json()
        .then((data) => CustomerListingSchema.parseAsync(data));
    })
    .catch((error) => {
      if (error instanceof NetError) {
        throw error;
      }

      if (error instanceof ZodError) {
        throw new NetError("validation-error", error.message, error);
      }

      if (error instanceof Error) {
        // could be a network error
        throw new NetError("network-error", error.message, error);
      }

      throw new NetError("unknown-error", error.message, error);
    });
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const maxVisiblePages = 5;

  const pageNumbers = useMemo(
    () => getPages(currentPage, totalPages, maxVisiblePages),
    [currentPage, totalPages, maxVisiblePages],
  );

  return (
    <nav aria-label="Page navigation">
      <ul
        style={{
          display: "flex",
          listStyle: "none",
          padding: 0,
          gap: "0.2rem",
        }}
      >
        {/* Previous Button */}
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
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
          <li key={number}>
            <button
              className="page-link"
              onClick={() => onPageChange(number)}
              style={{ fontWeight: number === currentPage ? "bold" : "normal" }}
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
        <li
          className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
        >
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const queryData = useQuery({
    queryKey: ["customer-listing", page, limit] as const,
    queryFn: ({ queryKey: [_, p, l] }) => fetchCustomerListing(p, l),
  });

  if (queryData.status === "error") {
    const error = queryData.error as NetError;
    return <div>Error: {error.type}</div>;
  }

  if (queryData.status === "pending") {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <h1>List of Customers</h1>
      <table style={{ width: "100%", textAlign: "center" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>DOB</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queryData.data.data.records.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.contact}</td>
              <td>{customer.dob}</td>
              <td>{customer.created_at.toISOString()}</td>
              <td>{customer.updated_at.toISOString()}</td>
              <td>
                <Link to={customer.id.toString()}>
                  <button>Manage</button>
                </Link>{" "}
                | <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={page}
        totalPages={Number(queryData.data.data.total_pages)}
        onPageChange={setPage}
      />
    </main>
  );
}
