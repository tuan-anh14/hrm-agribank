import { Module } from '@nestjs/common';
import { PositionService } from '@/position/position.service';
import { PositionController } from '@/position/position.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PositionService],
  controllers: [PositionController],
  exports: [PositionService]
})
export class PositionModule {}
