import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
  recoveryEmail: z.string().email("Valid recovery email is required"),
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

export const setNewPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
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
  workerId: z.string().min(1, "Worker is required"),
  workerType: z.enum(["EMPLOYEE", "MANAGER"]),
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
  payRate: z.coerce.number().min(1, "Pay rate must be greater than zero"),
});

export const settingsSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  recoveryEmail: z.string().email("Valid recovery email required"),
  timezone: z.string().min(2, "Timezone is required"),
  notes: z.string().optional(),
});

export const payRateChangeSchema = z
  .object({
    workerId: z.string().min(1, "Worker is required"),
    workerType: z.enum(["EMPLOYEE", "MANAGER"]),
    currentPayRate: z.coerce.number().min(0),
    newPayRate: z.coerce.number().min(1, "New pay rate must be greater than zero"),
    applyMode: z.enum(["FUTURE_ONLY", "DATE_RANGE", "ONE_DAY", "ALL_RECORDS"]),
    effectiveStartDate: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    date: z.string().optional(),
    confirmAllRecords: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.applyMode === "FUTURE_ONLY" && !data.effectiveStartDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Effective start date is required", path: ["effectiveStartDate"] });
    }

    if (data.applyMode === "DATE_RANGE") {
      if (!data.startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start date is required", path: ["startDate"] });
      }
      if (!data.endDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date is required", path: ["endDate"] });
      }
    }

    if (data.applyMode === "ONE_DAY" && !data.date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date is required", path: ["date"] });
    }

    if (data.applyMode === "ALL_RECORDS" && !data.confirmAllRecords) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Confirmation is required", path: ["confirmAllRecords"] });
    }
  });
