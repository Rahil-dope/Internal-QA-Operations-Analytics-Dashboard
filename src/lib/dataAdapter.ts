import type { OperationsDataset } from '../types/data';
import { parseExcelFile } from './excelParser';

export interface OperationsDataAdapter {
  fetchData(): Promise<OperationsDataset>;
}

export class ExcelDataAdapter implements OperationsDataAdapter {
  private url: string;

  constructor(url: string = '/data.xlsx') {
    this.url = url;
  }

  async fetchData(): Promise<OperationsDataset> {
    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel workbook from ${this.url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return parseExcelFile(buffer);
  }
}
