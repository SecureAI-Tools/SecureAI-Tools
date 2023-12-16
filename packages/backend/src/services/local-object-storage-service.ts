import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { ObjectStorageService } from "./object-storage-service";

export class LocalObjectStorageService implements ObjectStorageService {
  async get(key: string): Promise<Buffer> {
    if (!process.env.LOCAL_OBJECT_STORAGE_DIR) {
      throw new Error("LOCAL_OBJECT_STORAGE_DIR env is not set!");
    }
    const filePath = path.join(process.env.LOCAL_OBJECT_STORAGE_DIR, key);

    return readFileSync(filePath);
  }

  async put(key: string, file: any): Promise<void> {
    if (!process.env.LOCAL_OBJECT_STORAGE_DIR) {
      throw new Error("LOCAL_OBJECT_STORAGE_DIR env is not set!");
    }
    const filePath = path.join(process.env.LOCAL_OBJECT_STORAGE_DIR, key);

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
