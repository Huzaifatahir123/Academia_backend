import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(255)
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password is too long."),
});


export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required.")
    .max(128),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(128, "New password must not exceed 128 characters."),
});

export type ChangePasswordInput = z.infer< typeof changePasswordSchema>;

export type LoginInput = z.infer<typeof loginSchema>;