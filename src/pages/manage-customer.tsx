import { ZodError } from "zod";
import { CustomerSchema } from "../customer.schema";
import { NetError } from "../utils/net-error";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { ApiResponseSchema } from "../api-response.schema";
import TextInput from "../components/text-input";
import Button from "../components/button";
import { useState } from "react";

// schema definition
const GetCustomerSchema = ApiResponseSchema(CustomerSchema);

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

type UseToggleOptions<TPositive, TNegative> = {
  positive: TPositive;
  negative: TNegative;
};

const useToggle = <TPositive, TNegative>(
  p: UseToggleOptions<TPositive, TNegative>,
) => {
  const [state, setState] = useState<TPositive | TNegative>(p.positive);

  const toggle = () => {
    setState(state === p.positive ? p.negative : p.positive);
  };

  return [state, toggle] as const;
};

export default function ManageCustomer() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    throw new Error("Customer id missing");
  }
  const queryData = useQuery({
    queryKey: ["customer", id] as const,
    queryFn: ({ queryKey: [_, id] }) => fetchCustomer(id),
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
      <section className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold w-fit">{data.name}'s Details</h1>
        <Button type="button" onClick={toggle}>
          {mode === "view" ? "Edit" : "Cancel"}
        </Button>
      </section>
      <form>
        <TextInput
          id="name"
          label="Name"
          defaultValue={data.name}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          readOnly={mode === "view"}
        />
        <TextInput
          id="email"
          label="Email"
          defaultValue={data.email}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
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
          readOnly={mode === "view"}
        />
        <TextInput
          id="dob"
          label="Date of Birth"
          defaultValue={data.dob}
          classes={{
            container: "w-full",
            input: "w-full",
          }}
          readOnly={mode === "view"}
        />

        {mode === "edit" && (
          <Button type="submit" className="mt-2">
            Save
          </Button>
        )}
      </form>
    </main>
  );
}
