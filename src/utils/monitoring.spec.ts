
import { describe, it } from 'jasmine';
import monitoring from './monitoring';

describe('Monitoring', () => {
  it('should start the application and listen on port 3000', async (done) => {
    const spy = spyOn(console, 'log');
    await monitoring();
    expect(spy).toHaveBeenCalledWith('Application is running on: http://localhost:3000');
    done();
  });
});
      