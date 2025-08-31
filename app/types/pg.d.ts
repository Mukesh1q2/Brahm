declare module 'pg' {
  export class Client {
    constructor(config?: any);
    connect(): Promise<void>;
    end(): Promise<void>;
    query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount?: number }>;
  }
}

