import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

// At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_=+[\]{};':"\\|,.<>/?`~]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character';

export class RegisterEmailDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email!: string;

  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must be 30 characters or fewer' })
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'Username can only contain lowercase letters, numbers, _ and -',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  occupation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  whatDoYouDo?: string;
}

export class LoginEmailDto {
  @IsString()
  @MinLength(1, { message: 'Email or username is required' })
  identifier!: string;

  @IsString()
  password!: string;
}

export class ForgotPasswordDto {
  @IsString()
  @MinLength(1, { message: 'Email or username is required' })
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

export class Verify2FADto {
  @IsString()
  tempToken!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

export class RequestEmailChangeDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  newEmail!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  twoFactorCode?: string;
}

export class ConfirmEmailChangeDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

export class DeleteAccountDto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

export class Toggle2FADto {
  @IsString()
  @IsOptional()
  password?: string;
}

export class Enable2FADto {
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}
