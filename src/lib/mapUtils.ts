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
        const stateData: StateData[] = jsonData.map((row: any) => {
          const countryName = row.COUNTRY || row.Country || row.country;
          const gdpValue = parseFloat(row.gdp_per_capita || row.gdp || row.GDP || row.sales) || 0;
          
          console.log('Processing row:', { countryName, gdpValue });
          
          return {
            state: countryName,
            postalCode: countryName,
            sales: gdpValue
          };
        }).filter(data => data.state && data.sales > 0);
        
        console.log('Final processed data:', stateData);
        resolve(stateData);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const getColorScale = (minSales: number, maxSales: number) => {
  return d3.scaleSequential()
    .domain([minSales, maxSales])
    .interpolator(d3.interpolateGreens);
};

export const formatSalesNumber = (sales: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(sales);
};