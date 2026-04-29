import { IsString, IsNotEmpty, Length, Matches, IsOptional } from 'class-validator';

const SOLANA_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export class GetNonceDto {
  @IsString()
  @IsNotEmpty()
  @Matches(SOLANA_BASE58, { message: 'Invalid Solana address' })
  address!: string;
}

export class VerifySolanaDto {
  @IsString()
  @IsNotEmpty()
  @Matches(SOLANA_BASE58, { message: 'Invalid Solana address' })
  address!: string;

  @IsString()
  @IsNotEmpty()
  @Length(64, 200)
  signature!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  label?: string;
}
