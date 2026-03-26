// Ensure MessageRepository is correctly imported and used
import { MessageRepository } from '../repositories/MessageRepository';
class StatsService {
  constructor(private readonly messageRepository: MessageRepository) {}
  findAll() {
    return this.messageRepository.findAll();
  }
}
export default StatsService;