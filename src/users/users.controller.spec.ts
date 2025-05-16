import { PayloadTokenDto } from 'src/auth/dto/payload-token.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersController } from './users.controller';

describe('Users Controller', () => {
  let controller: UsersController;

  const userServiceMock = {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    uploadAvatarImage: jest.fn(),
  };

  // Antes de cada teste
  beforeEach(() => {
    controller = new UsersController(userServiceMock as any);
  });

  // Teste: Buscar usuário pelo ID
  it('should find One user', async () => {
    const userId = 1;

    await controller.findOneUser(userId);

    expect(userServiceMock.findOne).toHaveBeenCalledWith(userId);
  });

  // Teste: Criar um suário
  it('should create a new user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Denilson',
      email: 'teste@gmail.com',
      password: '43654654',
    };

    const mockUser = {
      id: 1,
      name: 'Denilson',
      email: 'teste@gmail.com',
    };

    userServiceMock.create.mockResolvedValue(mockUser);

    const result = await controller.createUser(createUserDto);

    expect(userServiceMock.create).toHaveBeenCalledWith(createUserDto);

    expect(result).toEqual(mockUser);
  });

  // Teste: Alterar um usuário
  it('should update user', async () => {
    const userId = 1;

    const updateUserDto: UpdateUserDto = {
      name: 'Matheus novo',
    };

    const tokenPayload: PayloadTokenDto = {
      sub: userId,
      aud: '',
      email: '',
      exp: 1,
      iat: 1,
      iss: '',
    };

    const updateUser = {
      id: userId,
      name: 'Matheus',
      email: 'teste@teste.com',
    };

    userServiceMock.update.mockResolvedValue(updateUser);

    const result = await controller.updateUser(userId, updateUserDto, tokenPayload);

    expect(userServiceMock.update).toHaveBeenCalledWith(userId, updateUserDto, tokenPayload);

    expect(result).toEqual(updateUser);
  });

  // Teste: Deletar usuário
  it('should delte a user', async () => {
    const userId = 1;

    const tokenPayload: PayloadTokenDto = {
      sub: userId,
      aud: '',
      email: '',
      exp: 1,
      iat: 1,
      iss: '',
    };

    await controller.deleteUser(userId, tokenPayload);
    expect(userServiceMock.delete).toHaveBeenCalledWith(userId, tokenPayload);
  });

  // Teste: Upload Avatar
  it('should upload avatar', async () => {
    const tokenPayload: PayloadTokenDto = {
      sub: 1,
      aud: '',
      email: '',
      exp: 1,
      iat: 1,
      iss: '',
    };

    const mockFile = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      buffer: Buffer.from('mock'),
    } as Express.Multer.File;

    await controller.uploadAvatarImage(tokenPayload, mockFile);

    expect(userServiceMock.uploadAvatarImage).toHaveBeenCalledWith(tokenPayload, mockFile);
  });
});
