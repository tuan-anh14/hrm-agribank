import { Test, TestingModule } from '@nestjs/testing';
import { WorkscheduleService } from './workschedule.service';

describe('WorkscheduleService', () => {
  let service: WorkscheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkscheduleService],
    }).compile();

    service = module.get<WorkscheduleService>(WorkscheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
