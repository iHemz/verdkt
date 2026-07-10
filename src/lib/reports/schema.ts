// Zod schema for the publish form. Single source of truth for the form's shape
// and validation, consumed by the React Hook Form resolver.

import { z } from "zod";

export const publishFormSchema = z.object({
  title: z.string().trim().max(80, "Keep the name under 80 characters."),
  author: z.string().trim().max(60, "Keep the handle under 60 characters."),
  agreed: z.boolean().refine((v) => v === true, {
    message: "Please acknowledge this before publishing.",
  }),
});

export type PublishFormValues = z.infer<typeof publishFormSchema>;
