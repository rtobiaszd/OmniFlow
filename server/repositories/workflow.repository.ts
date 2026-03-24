import { adminDb } from "../lib/firebase-admin";
import { Workflow } from "../../src/types";

export class WorkflowRepository {
  private collection = adminDb.collection("workflows");

  async findAll(): Promise<Workflow[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ ...doc.data() } as Workflow));
  }

  async findById(id: string): Promise<Workflow | undefined> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as Workflow) : undefined;
  }

  async findActiveByTrigger(event: string): Promise<Workflow[]> {
    const snapshot = await this.collection.where("active", "==", true).get();
    const workflows = snapshot.docs.map(doc => ({ ...doc.data() } as Workflow));
    
    return workflows.filter(w => 
      w.nodes.some(n => 
        (n.type === 'trigger' && n.data.event === event) ||
        (n.type === 'email_trigger' && event === 'email_received')
      )
    );
  }

  async create(workflow: Workflow): Promise<Workflow> {
    await this.collection.doc(workflow.id).set(workflow);
    return workflow;
  }

  async update(id: string, data: Partial<Workflow>): Promise<Workflow | undefined> {
    await this.collection.doc(id).update(data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.collection.doc(id).delete();
    return true;
  }
}
