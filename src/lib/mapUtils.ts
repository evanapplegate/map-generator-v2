import * as d3 from 'd3';
import { StateData } from './types';
import { read, utils } from 'xlsx';

export const processExcelFile = async (file: File): Promise<StateData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);
        
        const stateData: StateData[] = jsonData.map((row: any) => ({
          state: row.state,
          postalCode: row.state.toUpperCase(),
          sales: parseFloat(row.sales) || 0
        }));
        
        resolve(stateData);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const getColorScale = (minSales: number, maxSales: number) => {
  return d3.scaleLinear<string>()
    .domain([minSales, maxSales])
    .range(['#FFDEE2', '#ea384c']);
};

export const formatSalesNumber = (sales: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(sales);
};