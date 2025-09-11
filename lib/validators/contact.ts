import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  subject: z.string().max(200).optional().or(z.literal("")),
  message: z.string().min(20).max(2000),
  ch: z.string().max(0).optional().or(z.literal("")), // honeypot must be empty
});

export type ContactInput = z.infer<typeof contactSchema>;
