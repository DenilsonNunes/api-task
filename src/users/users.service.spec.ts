import { UsersService } from './users.service';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

jest.mock('node:fs/promises');

describe('UsersService', () => {
  let userService: UsersService;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;

  //Antes de rodar cada teste, rodar oque tem aqui:
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                name: 'Matheus',
                email: 'matheus@teste.com',
              }),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);
  });

  //Depois de cada teste que foi rodado
  afterEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  it('should be define users service', () => {
    expect(userService).toBeDefined();
  });

  // Grupo de testes - Criação de usuário
  describe('Create User', () => {
    // Teste: Deve criar um usuário
    it('should create a new user', async () => {
      // Preciso criar um createUserDto
      // Preciso do hashingService tenha o metodo hash
      // Verificar se o hashingService foi chamado com o parametro createUserDto.password
      // Verificar se o prisma user create foi chamado
      // -> O retorno deve ser o novo user criado

      const createUserDto: CreateUserDto = {
        email: 'matheus@teste.com',
        name: 'Matheus',
        password: '123456789',
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_EXEMPLO');

      const result = await userService.create(createUserDto);

      expect(hashingService.hash).toHaveBeenCalled();

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: 'HASH_MOCK_EXEMPLO',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(result).toEqual({
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
      });
    });

    // Teste: Se vai lançar o erro ao criar usuário com dados incorretos
    it('should throw error if prisma create fails.', async () => {
      const createUserDto: CreateUserDto = {
        email: 'denilson@gmail.com',
        name: 'Denilson',
        password: '123456789',
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK_EXEMPLO');
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(new Error('Database error'));

      await expect(userService.create(createUserDto)).rejects.toThrow(new HttpException('Falha ao cadastrar usuário!', HttpStatus.BAD_REQUEST));

      expect(hashingService.hash).toHaveBeenCalledWith(createUserDto.password);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: 'HASH_MOCK_EXEMPLO',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    });
  });

  // Grupo de testes - Busca de um usuário
  describe('FindOne User', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: null,
        task: [],
        passwordHash: 'hashexemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      const result = await userService.findOne(1);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          Task: true,
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should thorw error exception when user is not found', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      await expect(userService.findOne(1)).rejects.toThrow(new HttpException('Nenhum usuário foi encontrado', HttpStatus.BAD_REQUEST));

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
          Task: true,
        },
      });
    });
  });

  // Grupo de testes - Alterar usuário
  describe('Update User', () => {
    // Teste de exceção: Caso o usuário não for encontrado
    it('should throw exception when user is not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Novo nome',
      };

      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(userService.update(1, updateUserDto, tokenPayload)).rejects.toThrow(new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST));
    });

    // Teste de exceção: Caso o usuário não for autorizado
    it('should throw UNAUTHORIZED exception when user is not authorized', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Novo nome',
      };

      const tokenPayload: PayloadTokenDto = {
        sub: 5,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const mockUser = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: null,
        task: [],
        passwordHash: 'hashexemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(userService.update(1, updateUserDto, tokenPayload)).rejects.toThrow(new HttpException('Falha ao atualizar usuário!', HttpStatus.BAD_REQUEST));
    });

    // Teste de atualizar o usuário
    it('should update user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Novo nome',
        password: 'Nova senha',
      };

      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const mockUser = {
        id: 1,
        name: 'Denilson',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'hash_exemplo',
        active: true,
        createdAt: new Date(),
      };

      const updateUser = {
        id: 1,
        name: 'Novo nome',
        email: 'matheus@teste.com',
        avatar: null,
        passwordHash: 'novo_hash_exemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(hashingService, 'hash').mockResolvedValue('novo_hash_exemplo');
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updateUser);

      const result = await userService.update(1, updateUserDto, tokenPayload);

      expect(hashingService.hash).toHaveBeenCalledWith(updateUserDto.password);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: updateUserDto.name,
          passwordHash: 'novo_hash_exemplo',
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      expect(result).toEqual(updateUser);
    });
  });

  // Grupo de testes - Deletar usuário
  describe('Delete user', () => {
    // Teste: Caso o usuário não for encontrado
    it('should throw error when is not found', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      await expect(userService.delete(1, tokenPayload)).rejects.toThrow(new HttpException('Falha ao deletar o usuário!', HttpStatus.BAD_REQUEST));
    });

    // Teste: Usuário não autorizado ID Diferente
    it('should throw UNAUTHORIZED when user is not authorized', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 5,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const mockUser = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: null,
        passwordHash: 'hashexemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(userService.delete(1, tokenPayload)).rejects.toThrow(new HttpException('Falha ao deletar o usuário!', HttpStatus.BAD_REQUEST));

      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });

    // Teste: Deletar Usuário
    it('should Delelte user', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const mockUser = {
        id: 1,
        name: 'Denilson',
        email: 'denilson1@teste.com',
        avatar: null,
        passwordHash: 'hashexemplo',
        active: true,
        createdAt: new Date(),
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      jest.spyOn(prismaService.user, 'delete').mockResolvedValue(mockUser);

      const result = await userService.delete(1, tokenPayload);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
      });

      expect(result).toEqual({
        message: 'Usuário deletado com sucesso!',
      });
    });
  });

  // Grupo de teste - Uploado Imagem do usuário
  describe('Upload Avatar User', () => {
    // Teste: Caso o usuário não for encontrado
    it('should throw error when is not found', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      await expect(userService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(new HttpException('Falha ao atualizar o avatar do usuário', HttpStatus.BAD_REQUEST));
    });

    // Teste: Update da imagem com sucesso
    it('should upload avatar and update user succesfully', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      const mockUser: any = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: null,
      };

      const updateUser: any = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: '1.png',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updateUser);

      jest.spyOn(fs, 'writeFile').mockResolvedValue();

      const result = await userService.uploadAvatarImage(tokenPayload, file);

      const fileLocale = path.resolve(process.cwd(), 'files', '1.png');

      expect(fs.writeFile).toHaveBeenCalledWith(fileLocale, file.buffer);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: mockUser.id,
        },
        data: {
          avatar: '1.png',
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });

      expect(result).toEqual(updateUser);
    });

    // Teste: Erro ao salvar o arquivo
    it('should throw error if file write fails', async () => {
      const tokenPayload: PayloadTokenDto = {
        sub: 1,
        aud: '',
        email: 'matheus@teste.com',
        exp: 123,
        iat: 123,
        iss: '',
      };

      const file = {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      const mockUser: any = {
        id: 1,
        name: 'Denilson',
        email: 'denilson@teste.com',
        avatar: null,
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('File write error'));

      await expect(userService.uploadAvatarImage(tokenPayload, file)).rejects.toThrow(new HttpException('Falha ao atualizar o avatar do usuário', HttpStatus.BAD_REQUEST));
    });
  });
});
