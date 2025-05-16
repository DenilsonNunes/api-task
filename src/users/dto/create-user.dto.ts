import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'É necessário informar um email válido!' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve conte no minimo 6 caracteres' })
  @IsNotEmpty()
  password: string;
}
