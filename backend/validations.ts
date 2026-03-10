import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const storeSchema = z.object({
  name: z.string().min(2, "Store name is required"),
  address: z.string().min(5, "Address is required"),
  managerIds: z.array(z.string()).default([]),
});

export const employeeSchema = z.object({
  name: z.string().min(2, "Employee name is required"),
  storeId: z.string().min(1, "Assigned store is required"),
  status: z.enum(["Active", "Inactive"]),
  payRate: z.coerce.number().min(1, "Pay rate must be greater than zero"),
});

export const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  storeId: z.string().min(1, "Store is required"),
  date: z.string().min(1, "Date is required"),
  clockIn: z.string().min(1, "Clock in is required"),
  clockOut: z.string().min(1, "Clock out is required"),
  totalHours: z.coerce.number().min(0.1, "Total hours must be greater than zero"),
});

export const coOwnerSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(8, "Temporary password must be at least 8 characters"),
  storeIds: z.array(z.string()).min(1, "Assign at least one store"),
});

export const managerSchema = coOwnerSchema.extend({
  pastDaysAllowed: z.coerce.number().min(1, "Minimum is 1 day").max(30, "Maximum is 30 days"),
});

export const settingsSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  recoveryEmail: z.string().email("Valid recovery email required"),
  timezone: z.string().min(2, "Timezone is required"),
  notes: z.string().optional(),
});
