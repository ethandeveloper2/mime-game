import { Controller, Post, Body, UseGuards, Get, Req, UnauthorizedException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string },
  ) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport가 자동으로 Google 로그인 페이지로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const authResponse = await this.authService.login(req.user);

      // HTML 응답으로 토큰과 사용자 정보를 클라이언트에 전달
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>인증 완료</title>
            <script>
              // origin 검증 추가
              const allowedOrigins = ['http://localhost:3000'];
              
              window.addEventListener('message', (event) => {
                if (!allowedOrigins.includes(event.origin)) {
                  console.error('Unauthorized origin');
                  return;
                }
              });

              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                data: {
                  token: '${authResponse.access_token}',
                  user: ${JSON.stringify(req.user)}
                }
              }, '${process.env.CLIENT_URL}');
              window.close();
            </script>
          </head>
          <body>
            <p>인증이 완료되었습니다. 이 창은 자동으로 닫힙니다.</p>
          </body>
        </html>
      `);
    } catch (error) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>인증 오류</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({
                type: 'AUTH_ERROR',
                error: '인증 처리 중 오류가 발생했습니다.'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `);
    }
  }
} 