"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Updated monitoring to use NestJS testing utilities.
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../app.module");
describe('Monitoring', () => {
    let app;
    beforeAll(async () => {
        const module = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = module.createNestApplication();
        await app.init();
    });
    it('should start', () => {
        expect(app).toBeDefined();
    });
});
