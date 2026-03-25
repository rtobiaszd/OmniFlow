import { Router } from "express";
import { PipelineController } from "../controllers/pipeline.controller";
import { DealController } from "../controllers/deal.controller";
import { EventController } from "../controllers/event.controller";
import { StatsController } from "../controllers/stats.controller";
import { WorkflowController } from "../controllers/workflow.controller";
import { IntegrationController } from "../controllers/integration.controller";
import { AuthController } from "../controllers/auth.controller";
import { MessageController } from "../controllers/message.controller";

const router = Router();
router.use((req, res, next) => {
  console.log(`API [${req.method}] ${req.url}`);
  next();
});
console.log("API: Registering routes...");
console.log("API: Registering routes...");

// Controller instances
const pipelineController = new PipelineController();
const dealController = new DealController();
const eventController = new EventController();
const statsController = new StatsController();
const workflowController = new WorkflowController();
const integrationController = new IntegrationController();
const authController = new AuthController();
const messageController = new MessageController();

// Auth
router.get("/auth/url", (req, res) => authController.getAuthUrl(req, res));

// Stats
router.get("/dashboard/stats", (req, res) => statsController.getDashboardStats(req, res));

// Pipelines
router.get("/pipelines", (req, res) => pipelineController.getAll(req, res));
router.post("/pipelines", (req, res) => pipelineController.create(req, res));
router.patch("/pipelines/:id", (req, res) => pipelineController.update(req, res));
router.delete("/pipelines/:id", (req, res) => pipelineController.delete(req, res));

// Deals
router.get("/deals", (req, res) => dealController.getAll(req, res));
router.post("/deals", (req, res) => dealController.create(req, res));
router.patch("/deals/:id", (req, res) => dealController.update(req, res));
router.delete("/deals/:id", (req, res) => dealController.delete(req, res));

// Workflows
router.get("/workflows", (req, res) => workflowController.getAll(req, res));
router.post("/workflows", (req, res) => workflowController.create(req, res));
router.patch("/workflows/:id", (req, res) => workflowController.update(req, res));
router.delete("/workflows/:id", (req, res) => workflowController.delete(req, res));

// Integrations
router.get("/integrations", (req, res) => integrationController.getAll(req, res));
router.post("/integrations", (req, res) => integrationController.create(req, res));
router.patch("/integrations/:id", (req, res) => integrationController.update(req, res));
router.delete("/integrations/:id", (req, res) => integrationController.delete(req, res));

// Messages / Conversations
router.get("/conversations", (req, res) => messageController.getConversations(req, res));
router.get("/conversations/:conversationId/messages", (req, res) => messageController.getMessages(req, res));
router.post("/messages", (req, res) => messageController.sendMessage(req, res));

// Events
router.post("/events", (req, res) => eventController.handle(req, res));

export default router;
