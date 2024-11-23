export interface DB {
  single: (query: string, params?: any[]) => Promise<any>;
  transaction: (fn: () => Promise<any>) => Promise<any>;
  insert: (table: string, data: any) => Promise<any>;
  update: (table: string, data: any, where: any) => Promise<any>;
}

export const db: DB = {
  single: async () => {},
  transaction: async () => {},
  insert: async () => {},
  update: async () => {}
};
