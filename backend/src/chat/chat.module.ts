import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_TOKEN');
        if (!secret) {
          throw new Error('JWT_ACCESS_TOKEN is not configured in environment variables');
        }
        return {
          secret,
          signOptions: {
            algorithm: 'HS256',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, WsJwtAuthGuard],
  exports: [ChatService],
})
export class ChatModule {}

