import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { ResponseCreateUserDto, ResponseFindOneUserDto, ResponseUpdateAvatarDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private hashingService: HashingServiceProtocol,
  ) {}

  async findOne(id: number): Promise<ResponseFindOneUserDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        Task: true,
      },
    });

    if (user) return user;

    throw new HttpException('Nenhum usuário foi encontrado', HttpStatus.BAD_REQUEST);
  }

  async create(createUserDto: CreateUserDto): Promise<ResponseCreateUserDto> {
    try {
      const passwordHash = await this.hashingService.hash(createUserDto.password);

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: passwordHash,
        },
        // retorna somente as propriedades como true
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return user;
    } catch (err) {
      throw new HttpException('Falha ao cadastrar usuário!', HttpStatus.BAD_REQUEST, { cause: err });
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, tokenPayload: PayloadTokenDto): Promise<ResponseCreateUserDto> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      if (!user) {
        throw new HttpException('Usuário não existe!', HttpStatus.BAD_REQUEST);
      }

      if (user.id !== tokenPayload.sub) {
        throw new HttpException('Acesso negado.', HttpStatus.BAD_REQUEST);
      }

      const dataUser: { name?: string; passwordHash?: string } = {
        name: updateUserDto.name ? updateUserDto.name : user.name,
      };

      if (updateUserDto?.password) {
        const passwordHash = await this.hashingService.hash(updateUserDto?.password);
        dataUser.passwordHash = passwordHash;
      }

      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: dataUser.name,
          passwordHash: dataUser?.passwordHash ? dataUser?.passwordHash : user.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return updateUser;
    } catch (err) {
      throw new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST, { cause: err });
    }
  }

  async delete(id: number, tokenPayload: PayloadTokenDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: id,
        },
      });

      // Verifica se o usuário existe
      if (!user) {
        throw new HttpException('Usuário não existe!', HttpStatus.BAD_REQUEST);
      }

      // Verifica se o usuário é diferente do qual o mesma esta tentando deletar
      if (user.id !== tokenPayload.sub) {
        throw new HttpException('Acesso negado.', HttpStatus.BAD_REQUEST);
      }

      await this.prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      return {
        message: 'Usuário deletado com sucesso!',
      };
    } catch (err) {
      throw new HttpException('Falha ao deletar o usuário!', HttpStatus.BAD_REQUEST);
    }
  }

  async uploadAvatarImage(tokenPayload: PayloadTokenDto, file: Express.Multer.File): Promise<ResponseUpdateAvatarDto> {
    try {
      const fileExtension = path.extname(file.originalname).toLocaleLowerCase().substring(1);

      const fileName = `${tokenPayload.sub}.${fileExtension}`;

      // Local para salvar a imagem
      const fileLocale = path.resolve(process.cwd(), 'files', fileName);

      await fs.writeFile(fileLocale, file.buffer);

      const user = await this.prisma.user.findFirst({
        where: {
          id: tokenPayload.sub,
        },
      });

      if (!user) {
        throw new HttpException('Falha ao atualizar o avatar do usuário', HttpStatus.BAD_REQUEST);
      }

      const updateUser = await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: fileName,
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      return updateUser;
    } catch (err) {
      throw new HttpException('Falha ao atualizar o avatar do usuário', HttpStatus.BAD_REQUEST, { cause: err });
    }
  }
}
