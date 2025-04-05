import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // /api/auth/public 으로 시작하는 경로는 인증 없이 접근 가능
    const request = context.switchToHttp().getRequest();
    if (request.path.startsWith('/api/auth/public')) {
      return true;
    }

    // 기본 JWT 인증 수행
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 토큰이 없는 경우
    if (info?.message === 'No auth token') {
      throw new UnauthorizedException('인증 토큰이 필요합니다.');
    }

    // 토큰이 만료된 경우
    if (info?.message === 'jwt expired') {
      throw new UnauthorizedException('인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    // 토큰이 유효하지 않은 경우
    if (err || !user) {
      throw new UnauthorizedException('유효하지 않은 인증입니다.');
    }

    // 사용자 정보가 데이터베이스에서 찾을 수 없는 경우 (JwtStrategy에서 null을 반환한 경우)
    if (!user.id) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    return user;
  }
} 