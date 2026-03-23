import { db } from "../db";
import { Workflow } from "../../src/types";
import { IWorkflowRepository } from "../interfaces/repository.interface";

export class WorkflowRepository implements IWorkflowRepository {
  async findAll(): Promise<Workflow[]> {
    return db.workflows;
  }

  async findById(id: string): Promise<Workflow | undefined> {
    return db.workflows.find(w => w.id === id);
  }

  async findActiveByTrigger(event: string): Promise<Workflow[]> {
    return db.workflows.filter(w => 
      w.active && w.nodes.some(n => n.type === 'trigger' && n.data.event === event)
    );
  }

  async create(workflow: Workflow): Promise<Workflow> {
    db.workflows.push(workflow);
    return workflow;
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | undefined> {
    const index = db.workflows.findIndex(w => w.id === id);
    if (index !== -1) {
      db.workflows[index] = { ...db.workflows[index], ...data };
      return db.workflows[index];
    }
    return undefined;
  }

  async delete(id: string): Promise<boolean> {
    const index = db.workflows.findIndex(w => w.id === id);
    if (index !== -1) {
      db.workflows.splice(index, 1);
      return true;
    }
    return false;
  }
}
