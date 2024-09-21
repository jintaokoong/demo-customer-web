/* {
  "id": 1,
  "name": "jane",
  "dob": "10-01-2024",
  "email": "jane.smith@mail.net",
  "contact": "+60198765432",
  "created_at": "2024-09-13T16:12:15Z",
  "updated_at": "2024-09-13T16:19:21Z"
}, */

import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  dob: z.string(),
  email: z.string(),
  contact: z.string(),
  created_at: z.string().transform((val) => new Date(val)),
  updated_at: z.string().transform((val) => new Date(val)),
});
