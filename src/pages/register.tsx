import { ZodError, z } from "zod";
import Button from "../components/button";
import TextInput from "../components/text-input";
import { NetError } from "../utils/net-error";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// schema definition
const RegisterCustomerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  contact: z.string(),
  dob: z.string().date(),
});

// api integration
const registerCustomer = (payload: z.infer<typeof RegisterCustomerSchema>) => {
  const url = new URL("/api/customers", import.meta.env.VITE_API_BASE_URL);

  return fetch(url, {
    method: "POST",
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
      return response.json();
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

export default function RegisterCustomer() {
  const { mutate, status } = useMutation({
    mutationKey: ["register-customer"],
    mutationFn: registerCustomer,
  });
  const navigate = useNavigate();
  return (
    <main className="p-2">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Register Customer</h1>
      </section>
      <form
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
          const result = RegisterCustomerSchema.safeParse(payload);
          if (!result.success) {
            // handle validation errors
            const msg = result.error.errors.map((e) => e.message).join(", ");
            window.alert(`${msg}\nPlease correct the errors and try again.`);
            return;
          }

          e.currentTarget.reset();

          // proceed with the API call
          mutate(result.data, {
            onSuccess: () => {
              // reset the form
              const redirect = window.confirm(
                "Customer registered successfully. Do you want to go back to the listing page?",
              );
              if (redirect) {
                navigate("/customers");
              } else {
                e.currentTarget.reset();
              }
            },
          });
        }}
      >
        <section className="space-y-2">
          <TextInput
            id="name"
            label="Name"
            type="text"
            classes={{
              container: "w-full",
              input: "w-full",
            }}
            required
          />
          <TextInput
            id="email"
            label="Email"
            classes={{
              container: "w-full",
              input: "w-full",
            }}
            type="email"
            required
          />
          <TextInput
            id="contact"
            label="Contact"
            classes={{
              container: "w-full",
              input: "w-full",
            }}
            pattern="^\+60[1-9]{1}\d{8,9}$" // Malaysian phone number
            title="Phone number must be in the format +60123456789"
          />
          <TextInput
            id="dob"
            label="Date of Birth"
            type="date"
            classes={{
              container: "w-full",
              input: "w-full",
            }}
            max={new Date().toISOString().split("T")[0]}
            title="Date of Birth cannot be in the future"
          />
        </section>
        <Button
          className="mt-4 py-0.5 px-3"
          type="submit"
          disabled={status === "pending"}
        >
          Register
        </Button>
      </form>
    </main>
  );
}
