import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString({ message: 'o nome precisa ser texto' })
  @MinLength(5, { message: 'o nome precisa ter 5 caracteres!' })
  @IsNotEmpty()
  readonly name: string;

  @IsString({ message: 'o nome precisa ser texto' })
  @MinLength(5, { message: 'o nome precisa ter 5 caracteres!' })
  @IsNotEmpty()
  readonly description: string;
}
