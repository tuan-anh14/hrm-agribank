import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RewardPenaltyService } from './reward-penalty.service';
import { CreateRewardPenaltyDto } from './dto/create-reward-penalty.dto';
import { UpdateRewardPenaltyDto } from './dto/update-reward-penalty.dto';

@Controller('reward-penalty')
export class RewardPenaltyController {
    constructor(private readonly rewardPenaltyService: RewardPenaltyService) { }

    @Post()
    create(@Body() createRewardPenaltyDto: CreateRewardPenaltyDto) {
        return this.rewardPenaltyService.create(createRewardPenaltyDto);
    }

    @Get()
    findAll() {
        return this.rewardPenaltyService.findAll();
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
