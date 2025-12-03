import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RewardPenaltyService } from './reward-penalty.service';
import { CreateRewardPenaltyDto } from './dto/create-reward-penalty.dto';
import { UpdateRewardPenaltyDto } from './dto/update-reward-penalty.dto';

import { CurrentUser } from '@/decorator/customize';

@Controller('reward-penalty')
export class RewardPenaltyController {
    constructor(private readonly rewardPenaltyService: RewardPenaltyService) { }

    @Post()
    create(@Body() createRewardPenaltyDto: CreateRewardPenaltyDto) {
        return this.rewardPenaltyService.create(createRewardPenaltyDto);
    }

    @Get()
    findAll(@Query() query: any, @CurrentUser() user: any) {
        if (user.role === 'EMPLOYEE') {
            query.employeeId = user.id;
        }
        return this.rewardPenaltyService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rewardPenaltyService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRewardPenaltyDto: UpdateRewardPenaltyDto) {
        return this.rewardPenaltyService.update(id, updateRewardPenaltyDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rewardPenaltyService.remove(id);
    }
}
