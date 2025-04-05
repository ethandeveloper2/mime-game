import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [GameModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 