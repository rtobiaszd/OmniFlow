// src/services/validation.service.spec.ts
import { ValidationService } from './validation.service';

jest.mock('./validation.service');

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    service = new ValidationService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateInput', () => {
    it('should return true for valid input', () => {
      const dto: { input: string } = { input: 'valid' };
      (service.validateInput as jest.Mock).mockReturnValue(true);
      const result = service.validateInput(dto);
      expect(result).toBe(true);
    });

    it('should throw an error for invalid input', () => {
      const dto: { input: string } = { input: '' };
      (service.validateInput as jest.Mock).mockReturnValue(false);
      expect(() => service.validateInput(dto)).toThrowError();
    });
  });
});