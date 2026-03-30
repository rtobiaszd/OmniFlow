"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Updated monitoring to use NestJS testing utilities.
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    await app.listen(3000, () => {
        console.log('Application is running on: http://localhost:3000');
    });
}
bootstrap();
