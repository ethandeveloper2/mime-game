import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS 설정
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 정적 파일 서빙 설정
  app.useStaticAssets('public', {
    prefix: '/public/',
  });

  // 글로벌 프리픽스 설정 (선택사항)
  app.setGlobalPrefix('api');

  // 9100 포트로 서버 시작
  await app.listen(9100);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap(); 