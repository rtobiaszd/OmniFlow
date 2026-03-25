import prisma from "../lib/prisma";
import { Workflow } from "../../src/types";

export class WorkflowRepository {
  async findAll(): Promise<Workflow[]> {
    return (await prisma.workflow.findMany()) as any;
  }

  async findById(id: string): Promise<Workflow | undefined> {
    return (await prisma.workflow.findUnique({ where: { id } })) as any;
  }

  async findActiveByTrigger(event: string): Promise<Workflow[]> {
    const workflows = await prisma.workflow.findMany({
      where: { active: true }
    });
    
    return (workflows as any).filter((w: any) => 
      w.nodes.some((n: any) => 
        (n.type === 'trigger' && n.data.event === event) ||
        (n.type === 'email_trigger' && event === 'email_received')
      )
    );
  }

  async create(workflow: Workflow): Promise<Workflow> {
    return (await prisma.workflow.create({ data: workflow as any })) as any;
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | undefined> {
    return (await prisma.workflow.update({ 
      where: { id },
      data: data as any
    })) as any;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.workflow.delete({ where: { id } });
    return true;
  }
}
