export interface ObjectStorageService {
  get(filePath: string): Promise<Buffer>;
  put(filePath: string, file: Buffer): Promise<void>;
  delete(filePath: string): Promise<void>;
}
