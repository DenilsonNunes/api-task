import { CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from '../config/jwt.config';
import { REQUEST_TOKEN_PAYLOAD_NAME } from '../common/auth.constants';
import { PrismaService } from 'src/prisma/prisma.service';

export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenHeader(request);

    // Verifica se não tem o token
    if (!token) {
      throw new UnauthorizedException('Token não encontrado!');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
      request[REQUEST_TOKEN_PAYLOAD_NAME] = payload;

      // Verifica se o usuário esta ativo
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload?.sub,
        },
      });

      // Se o usuario não estiver ativo, não prossegue.
      if (!user?.active) {
        throw new UnauthorizedException('Acesso não autorizado!');
      }
    } catch (err) {
      throw new UnauthorizedException('Acesso não autorizado!', { cause: err });
    }

    return true;
  }

  // Função para extrair o token da requisição
  extractTokenHeader(request: Request) {
    const authorization = request.headers?.authorization;

    if (!authorization || typeof authorization !== 'string') {
      return;
    }

    return authorization.split(' ')[1];
  }
}
