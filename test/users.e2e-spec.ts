import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { TasksModule } from 'src/tasks/tasks.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaService } from 'src/prisma/prisma.service';
import * as dotenv from 'dotenv';
import { execSync } from 'node:child_process';
import { ConfigModule } from '@nestjs/config';

// Carregar banco de teste
dotenv.config({ path: 'env.test' });

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  // Antes de rodar qualquer coisa
  beforeAll(() => {
    execSync('npx prisma migrate deploy');
  });

  // Antes de cada teste
  beforeEach(async () => {
    execSync('cross-env DATABASE_URL=file:./dev-test.db npx prisma migrate deploy');

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        TasksModule,
        UsersModule,
        AuthModule,
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', '..', 'files'),
          serveRoot: '/files',
        }),
      ],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Se TRUE ele remove as chaves que não estão no DTO
      }),
    );

    prismaService = module.get<PrismaService>(PrismaService);

    await app.init();
  });

  // Apagar informações do banco de dados após o teste
  afterEach(async () => {
    await prismaService.user.deleteMany();
  });

  // Garantir que vai encerrar a aplicação depois dos testes
  afterEach(async () => {
    await app.close();
  });

  describe('/users', () => {
    // Teste: Criação de usuário
    it('/users (POST) - createUser', async () => {
      const createUserDto = {
        name: 'Denilson Nunes',
        email: 'denilson@gmail.com',
        password: '5436544',
      };

      const response = await request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);

      expect(response.body).toEqual({
        id: response.body.id,
        name: 'Denilson Nunes',
        email: 'denilson@gmail.com',
      });
    });

    // Teste: Senha fraca
    it('/users (POST) - weak password', async () => {
      const createUserDto = {
        name: 'Denilson Nunes',
        email: 'denilson@gmail.com',
        password: '543123',
      };

      const response = await request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);

      console.log(response.body);
    });

    // Teste: Atualização de usuário
    it('/users (PATCH) - update user', async () => {
      const createUserDto = {
        name: 'Ana Carol',
        email: 'ana@gmail.com',
        password: '123123',
      };

      const updateUserDto = {
        name: 'Ana Carolina',
      };

      const user = await request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);

      const auth = await request(app.getHttpServer()).post('/auth').send({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      expect(auth.body.token).toEqual(auth.body.token);

      const response = await request(app.getHttpServer()).patch(`/users/${auth.body.id}`).set('Authorization', `Bear ${auth.body.token}`).send(updateUserDto);

      expect(response.body).toEqual({ id: auth.body.id, name: updateUserDto.name, email: createUserDto.email });
    });

    // Teste: Deletar usuário
    it('/users (DELETE) -  delete a user', async () => {
      const createUserDto = {
        name: 'Lucas',
        email: 'lucas@gmail.com',
        password: '123123',
      };

      const user = await request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);

      const auth = await request(app.getHttpServer()).post('/auth').send({
        email: createUserDto.email,
        password: createUserDto.password,
      });

      expect(auth.body.token).toEqual(auth.body.token);

      const response = await request(app.getHttpServer()).delete(`/users/${user.body.id}`).set('Authorization', `Bear ${auth.body.token}`);

      expect(response.body.message).toEqual('Usuário deletado com sucesso!');
    });
  });
});
