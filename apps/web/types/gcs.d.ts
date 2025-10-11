declare module '@google-cloud/storage' {
  export class Storage {
    constructor(options?: any);
    bucket(name: string): Bucket;
  }
  export interface Bucket {
    name: string;
    file(name: string): File;
  }
  export interface File {
    save(data: Buffer | Uint8Array, options?: any): Promise<void>;
    exists(): Promise<[boolean]>;
    getSignedUrl(options: any): Promise<[string]>;
  }
}
