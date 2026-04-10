import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class GetNonceDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 100)
  address!: string;
}

export class VerifyEthereumDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Invalid Ethereum address' })
  address!: string;

  @IsString()
  @IsNotEmpty()
  @Length(100, 200)
  signature!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;
}
