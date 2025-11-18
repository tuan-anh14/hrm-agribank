import { Test, TestingModule } from '@nestjs/testing';
import { WorkscheduleController } from './workschedule.controller';

describe('WorkscheduleController', () => {
  let controller: WorkscheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkscheduleController],
    }).compile();

    controller = module.get<WorkscheduleController>(WorkscheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
