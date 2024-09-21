import { useCallback, useMemo, useState } from "react";
import { NetError } from "../utils/net-error";
import { ZodError, z } from "zod";
import { ApiResponseSchema } from "../api-response.schema";
import { CustomerSchema } from "../customer.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import css from "./listing.module.css";
import { formatDate } from "../utils/date";
import Button from "../components/button";

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

const deleteCustomer = (id: number) => {
  const url = new URL(
    `/api/customers/${id}`,
    import.meta.env.VITE_API_BASE_URL,
  );

  return fetch(url, {
    method: "DELETE",
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
      return Promise.resolve();
    })
    .catch((error) => {
      if (error instanceof NetError) {
        throw error;
      }

      if (error instanceof ZodError) {
        throw new NetError("validation-error", error.message, error);
      }

      if (error instanceof Error) {
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
      <ul className="space-x-1 flex items-center">
        {/* Previous Button */}
        <li>
          <button
            className="disabled:opacity-50"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous"
          >
            &laquo;
          </button>
        </li>

        {/* First Page Button */}
        {pageNumbers[0] > 1 && (
          <>
            <li>
              <button onClick={() => onPageChange(1)}>1</button>
            </li>
            <li>
              <span>...</span>
            </li>
          </>
        )}

        {/* Visible Page Numbers */}
        {pageNumbers.map((number) => (
          <li key={number}>
            <button
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
            <li>
              <span>...</span>
            </li>
            <li>
              <button onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </button>
            </li>
          </>
        )}

        {/* Next Button */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next"
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default function Listing() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const qc = useQueryClient();
  const queryData = useQuery({
    queryKey: ["customer-listing", page, limit] as const,
    queryFn: ({ queryKey: [_, p, l] }) => fetchCustomerListing(p, l),
  });
  const { variables, mutate, status } = useMutation({
    mutationKey: ["delete-customer"],
    mutationFn: (id: number) => deleteCustomer(id),
    onSettled: () => {
      // reset the page to 1
      setPage(1);
      // invalidate the query
      qc.invalidateQueries({
        queryKey: ["customer-listing", 1, limit],
      });
    },
  });

  const handleDelete = useCallback(
    (id: number, name: string) => () => {
      const confirm = window.confirm(
        `Are you sure you want to delete ${name}?`,
      );
      if (confirm) {
        mutate(id);
      }
    },
    [mutate],
  );

  if (queryData.status === "error") {
    const error = queryData.error as NetError;
    return <div>Error: {error.type}</div>;
  }

  if (queryData.status === "pending") {
    return <div>Loading...</div>;
  }

  return (
    <main className="p-2">
      <section className="flex justify-between items-center mb-4 w-full">
        <h1 className="text-2xl font-semibold">List of Customers</h1>
        <Link to="register">
          <Button>New Customer</Button>
        </Link>
      </section>
      <table className={css.table}>
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
              <td title={new Date(customer.created_at).toLocaleString()}>
                {formatDate(customer.created_at)}
              </td>
              <td title={new Date(customer.updated_at).toLocaleString()}>
                {formatDate(customer.updated_at)}
              </td>
              <td>
                <Link to={customer.id.toString()}>
                  <Button>Manage</Button>
                </Link>{" "}
                <Button
                  type="button"
                  disabled={status === "pending" && variables === customer.id}
                  onClick={handleDelete(customer.id, customer.name)}
                >
                  Delete
                </Button>
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
