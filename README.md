# API Task

Esta é uma API desenvolvida em NestJS para gerenciamento de tarefas. Ela permite criar, listar, atualizar e excluir tarefas,

## Tecnologias Utilizadas

- Node.js
- NestJS
- PostgreSQL
- Prisma
- JWT
- SqlLite
  
<br/>

## Pré-requisitos

- Node.js instalado
- PostgreSQL configurado
- Git instalado
  
<br/>

## Instalação

### Clonando o Repositório

```bash
git clone https://github.com/DenilsonNunes/api-task
```
### Instalando as Dependências

```bash
cd api-task
npm install
```

<br/>

### Configurando o Arquivo .env

Crie um arquivo `.env` na raiz do projeto com os seguintes parâmetros:

```env
DATABASE_URL="file:./dev.db"

# Configuração do token JWT
JWT_SECRET= 'Informe uma chave secreta usada para assinar o token JWT.'
JWT_TOKEN_AUDIENCE=http://localhost:3000
JWT_TOKEN_ISSUER=http://localhost:3000
JWT_TTL= 'Informe o tempo de vida do token JWT (por exemplo, '30d' para 30 dias).'
```

<br/>

### Configurando o Arquivo .env para rodar os testes

Crie um arquivo `.env.test` na raiz do projeto com os seguintes parâmetros:

```env
DATABASE_URL="file:./dev-test.db"

# Configuração do token JWT
JWT_SECRET= 'Informe uma chave secreta usada para assinar o token JWT.'
JWT_TOKEN_AUDIENCE=http://localhost:3000
JWT_TOKEN_ISSUER=http://localhost:3000
JWT_TTL= 'Informe o tempo de vida do token JWT (por exemplo, '30d' para 30 dias).'
```

### Rodando as Migrações

```bash
npx prisma migrate dev
```
<br/>

## Executando o Projeto

### Em desenvolvimento

```bash
npm run start:dev
```

<br/>

## Documentação com Swagger

A documentação da API está configurada com Swagger e pode ser acessada através da seguinte URL após iniciar o servidor:

```bash
http://localhost:3000/docs
```

É possível visualizar e testar todos os endpoints da API diretamente na interface do Swagger.
