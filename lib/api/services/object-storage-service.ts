export interface ObjectStorageService {
  get(filePath: string): Promise<any>; 
  put(filePath: string, file: Buffer): Promise<void>;
  delete(filePath: string): Promise<void>;
}