import { ZodError, z } from "zod";
import { CustomerSchema } from "../customer.schema";
import { NetError } from "../utils/net-error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ApiResponseSchema } from "../api-response.schema";
import TextInput from "../components/text-input";
import Button from "../components/button";
import { useState } from "react";

// schema definition
const GetCustomerSchema = ApiResponseSchema(CustomerSchema);

const UpdateCustomerSchema = CustomerSchema.pick({
  name: true,
  email: true,
  contact: true,
  dob: true,
});
type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>;

// api integration
const fetchCustomer = (id: string) => {
  const url = new URL(
    `/api/customers/${id}`,
    import.meta.env.VITE_API_BASE_URL,
  );

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
      return response.json().then((data) => GetCustomerSchema.parseAsync(data));
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

const updateCustomer = (id: string, payload: UpdateCustomerRequest) => {
  const url = new URL(
    `/api/customers/${id}`,
    import.meta.env.VITE_API_BASE_URL,
  );

  return fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((message) => {
          throw new NetError("server-error", message);
        });
      }
      return response.json().then((data) => GetCustomerSchema.parseAsync(data));
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

type UseToggleOptions<TPositive, TNegative> = {
  positive: TPositive;
  negative: TNegative;
};

const useToggle = <TPositive, TNegative>(
  p: UseToggleOptions<TPositive, TNegative>,
) => {
  const [state, setState] = useState<TPositive | TNegative>(p.positive);

  const toggle = (value?: TPositive | TNegative) => {
    if (value != null) {
      setState(value);
    } else {
      setState(state === p.positive ? p.negative : p.positive);
    }
  };

  return [state, toggle] as const;
};

export default function ManageCustomer() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    throw new Error("Customer id missing");
  }
  const qc = useQueryClient();
  const queryData = useQuery({
    queryKey: ["customer", id] as const,
    queryFn: ({ queryKey: [_, id] }) => fetchCustomer(id),
  });
  const { mutate, status } = useMutation({
    mutationKey: ["update-customer", id] as const,
    mutationFn: (param: UpdateCustomerRequest) => updateCustomer(id, param),
    onMutate: (param) => {
      // optimistic update
      qc.setQueryData<z.infer<typeof GetCustomerSchema>>(
        ["customer", id],
        (old) => {
          if (old == null) {
            return old;
          }
          return { ...old, data: { ...old.data, ...param } };
        },
      );
    },
    onSettled: (resp, error) => {
      if (resp != null) {
        qc.setQueryData<z.infer<typeof GetCustomerSchema>>(
          ["customer", id],
          resp,
        );
      }

      if (error != null) {
        qc.invalidateQueries({ queryKey: ["customer", id] });
      }
    },
  });
  const [mode, toggle] = useToggle({
    positive: "view" as const,
    negative: "edit" as const,
  });

  if (queryData.status === "error") {
    return <p>{queryData.error.message}</p>;
  }

  if (queryData.status === "pending") {
    return <p>Loading...</p>;
  }

  const {
    data: { data },
  } = queryData;

  return (
    <main className="p-2">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);

          const payload = Array.from(formData.entries()).reduce(
            (acc, [key, value]) => {
              acc[key] = value?.toString();
              return acc;
            },
            {} as Record<string, string>,
          );

          // validate the payload before proceeding
          const result = UpdateCustomerSchema.safeParse(payload);
          if (!result.success) {
            // handle validation errors
            const msg = result.error.errors.map((e) => e.message).join(", ");
            window.alert(`${msg}\nPlease correct the errors and try again.`);
            return;
          }

          // proceed with the API call
          mutate(result.data, {
            onSuccess: () => toggle("view"),
          });
        }}
      >
        <section className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold w-fit capitalize">
            {data.name}'s Details
          </h1>
          <Button className="px-3 py-0.5" type="reset" onClick={() => toggle()}>
            {mode === "view" ? "Edit" : "Cancel"}
          </Button>
        </section>
        <TextInput
          id="name"
          label="Name"
          defaultValue={data.name}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          required
          readOnly={mode === "view"}
        />
        <TextInput
          id="email"
          label="Email"
          type="email"
          defaultValue={data.email}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          required
          readOnly={mode === "view"}
        />

        <TextInput
          id="contact"
          label="Contact"
          defaultValue={data.contact}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          pattern="^\+60[1-9]{1}\d{8,9}$" // Malaysian phone number
          title="Phone number must be in the format +60123456789"
          readOnly={mode === "view"}
        />
        <TextInput
          id="dob"
          label="Date of Birth"
          type="date"
          defaultValue={data.dob}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          readOnly={mode === "view"}
          max={new Date().toISOString().split("T")[0]}
          title="Date of Birth cannot be in the future"
        />

        {mode === "edit" && (
          <Button
            type="submit"
            className="mt-2 px-3 py-0.5"
            disabled={status === "pending"}
          >
            Save
          </Button>
        )}
      </form>
      <footer className="mt-4 text-center text-sm text-gray-500">
        <Link
          className="text-blue-900 underline hover:text-blue-700"
          to="/customers"
        >
          Back to Customers
        </Link>
      </footer>
    </main>
  );
}
