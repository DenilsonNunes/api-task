import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*
  Utilização de CORS
  app.enableCors({
    //origin: ['https://meusite.com.br'] // -> Definir um dominio para fazer requisição na minha API. ou ['*'] para todos
    //methodos: ['GET', 'PUT', 'DELETE'] // -> Quais metodos que minha aplicação vai aceitar
  });
  */

  app.enableCors({
    origin: ['*'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Se TRUE ele remove as chaves que não estão no DTO
    }),
  );

  const configSwagger = new DocumentBuilder().setTitle('Lista de tarefas').setDescription('API Lista de tarefas').addBearerAuth().setVersion('1.0.0').build();

  const documentFactory = () => SwaggerModule.createDocument(app, configSwagger);

  SwaggerModule.setup('docs', app, documentFactory); // -> Aqui o nome da rota para que acesse o doc da sua API

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
