import { adminDb } from "../lib/firebase-admin";
import { Integration } from "../../src/types";

export class IntegrationRepository {
  private collection = adminDb.collection("integrations");

  async findAll(): Promise<Integration[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ ...doc.data() } as Integration));
  }

  async findById(id: string): Promise<Integration | undefined> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? (doc.data() as Integration) : undefined;
  }
}
