import { ObjectStorageService } from "./object-storage-service";
import { mkdirSync, statSync, writeFileSync } from "fs";
import path from "path";

export class LocalObjectStorageService implements ObjectStorageService {
  async get(filePath: string): Promise<any> {
    throw new Error("Get method not implemented yet");
  }

  async put(filePath: string, file: any): Promise<void> {
    const dir = path.dirname(filePath);
    const stats = statSync(dir, {throwIfNoEntry: false});

    if(!stats) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, file);
  }

  async delete(filePath: string): Promise<void> {
    throw new Error("Delete method not implemented yet");
  }
}
