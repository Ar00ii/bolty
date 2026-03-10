import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, { message: 'Username can only contain lowercase letters, numbers, _ and -' })
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}

export class LoginEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
