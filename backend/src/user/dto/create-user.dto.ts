import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const passwordRequirements = z
  .string()
  .min(8)
  .nonempty()
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Needs an uppercase character',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: 'Needs a lowercase character',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Needs a number',
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: 'Needs a special char',
  });

export const UserBaseSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: passwordRequirements,
  confirmPassword: passwordRequirements,
  nome: z.string().min(1),
  cognome: z.string().min(1),
});

export const CreateUserSchema = UserBaseSchema.omit({
  confirmPassword: true,
});

export const RegisterUserSchema = UserBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  },
);

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class RegisterUserDto extends createZodDto(RegisterUserSchema) {}
