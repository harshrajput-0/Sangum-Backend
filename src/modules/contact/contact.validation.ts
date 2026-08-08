import z from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  message: z.string().trim().min(10),
});

export type ContactInput = z.infer<typeof contactSchema>;