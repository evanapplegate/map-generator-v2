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
        
        // Map the Excel columns to our expected format
        const stateData: StateData[] = jsonData.map((row: any) => ({
          state: row.COUNTRY || row.NAME || row.country || row.state,
          postalCode: row.COUNTRY || row.NAME || row.country_code || row.state,
          sales: parseFloat(row.gdp_per_capita || row.gdp || row.sales) || 0
        }));
        
        console.log('Processed Excel data:', stateData);
        resolve(stateData);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const getColorScale = (minSales: number, maxSales: number) => {
  return d3.scaleLinear<string>()
    .domain([minSales, maxSales])
    .range(['#90EE90', '#006400']); // Light green to dark green
};

export const formatSalesNumber = (sales: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(sales);
};