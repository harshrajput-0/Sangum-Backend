import {z} from "zod";


const passwordRule = z.string().min(8, "Password must be of at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number");

export const completeEmailSchema = z.object({email: z.string().trim().toLowerCase().email("Invalid email address"),});