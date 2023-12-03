import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

import { ObjectStorageService } from "lib/api/services/object-storage-service";

export class LocalObjectStorageService implements ObjectStorageService {
  async get(key: string): Promise<Buffer> {
    if (!process.env.DATA_PATH) {
      throw new Error("DATA_PATH env is not set!");
    }
    const filePath = path.join(process.env.DATA_PATH, key);

    return readFileSync(filePath);
  }

  async put(key: string, file: any): Promise<void> {
    if (!process.env.DATA_PATH) {
      throw new Error("DATA_PATH env is not set!");
    }
    const filePath = path.join(process.env.DATA_PATH, key);

    const dir = path.dirname(filePath);
    const stats = statSync(dir, { throwIfNoEntry: false });

    if (!stats) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, file);
  }

  async delete(key: string): Promise<void> {
    throw new Error("Delete method not implemented yet");
  }
}
