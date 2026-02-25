// harvests.ts — harvest feature removed. Kept to prevent build errors.

export interface Harvest {
  id: number;
  hive_id?: number;
  apiary_id?: number;
  harvest_date: string;
  harvest_type: string;
  quantity: number;
  unit: string;
  quality?: string;
  notes?: string;
  hive_name?: string;
  apiary_name?: string;
  created_at: string;
}

export const harvestsService = {
  async getAll(): Promise<Harvest[]> { return []; },
  async create(_payload: Partial<Harvest>): Promise<Harvest> { throw new Error('Not supported'); },
  async update(_id: number, _payload: Partial<Harvest>): Promise<Harvest> { throw new Error('Not supported'); },
  async delete(_id: number): Promise<void> { return; },
};
