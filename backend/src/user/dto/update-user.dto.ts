import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserBaseSchema } from './create-user.dto';

const strongPassword = z
  .string()
  .min(8)
  .refine((pw) => /[A-Z]/.test(pw), { message: 'Needs an uppercase character' })
  .refine((pw) => /[a-z]/.test(pw), { message: 'Needs a lowercase character' })
  .refine((pw) => /[0-9]/.test(pw), { message: 'Needs a number' })
  .refine((pw) => /[!@#$%^&*]/.test(pw), { message: 'Needs a special char' });

export const UpdateUserSchema = UserBaseSchema.partial()
  .extend({
    password: strongPassword.optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    },
  );

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
