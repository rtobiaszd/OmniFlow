import { Router } from "express";
import { PipelineController } from "../controllers/pipeline.controller";
import { DealController } from "../controllers/deal.controller";
import { EventController } from "../controllers/event.controller";
import { StatsController } from "../controllers/stats.controller";
import { WorkflowController } from "../controllers/workflow.controller";
import { IntegrationController } from "../controllers/integration.controller";

const router = Router();

// Controller instances
const pipelineController = new PipelineController();
const dealController = new DealController();
const eventController = new EventController();
const statsController = new StatsController();
const workflowController = new WorkflowController();
const integrationController = new IntegrationController();

// Stats
router.get("/dashboard/stats", (req, res) => statsController.getDashboardStats(req, res));

// Pipelines
router.get("/pipelines", (req, res) => pipelineController.getAll(req, res));
router.post("/pipelines", (req, res) => pipelineController.create(req, res));

// Deals
router.get("/deals", (req, res) => dealController.getAll(req, res));
router.post("/deals", (req, res) => dealController.create(req, res));

// Workflows
router.get("/workflows", (req, res) => workflowController.getAll(req, res));

// Integrations
router.get("/integrations", (req, res) => integrationController.getAll(req, res));

// Events
router.post("/events", (req, res) => eventController.handle(req, res));

export default router;
