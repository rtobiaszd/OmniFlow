import { IsNotEmpty, IsString } from 'class-validator';

export class InputValidationDto {
  @IsNotEmpty()
  @IsString()
  input: string;
}

// Unit tests for InputValidationDto
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateInput', () => {
    it('should return true for valid input', async () => {
      const dto: InputValidationDto = { input: 'valid' };
      const result = await service.validateInput(dto);
      expect(result).toBe(true);
    });

    it('should throw an error for invalid input', async () => {
      const dto: InputValidationDto = { input: '' };
      expect(async () => await service.validateInput(dto)).rejects.toThrowError();
    });
  });
});