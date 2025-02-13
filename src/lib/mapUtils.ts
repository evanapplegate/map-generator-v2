
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
        
        console.log('Raw Excel data:', jsonData);
        
        // Map the Excel columns to our expected format
        const stateData: StateData[] = jsonData
          .map((row: any) => {
            console.log('Processing row:', row);
            
            const countryName = row['COUNTRY'] || row['Country'] || row['country'] || row['NAME'] || row['name'];
            const code = row['CODE'] || row['Code'] || row['code'] || row['ISO'] || row['iso'] || row['ISO_A3'] || row['iso_a3'] || countryName;
            const gdpValue = parseFloat(row['GDP'] || row['gdp'] || row['GDP_PER_CAPITA'] || row['gdp_per_capita'] || row['Value'] || row['value'] || 0);
            
            if (countryName && gdpValue) {
              console.log('Valid row found:', { countryName, code, gdpValue });
            }
            
            return {
              state: countryName,
              postalCode: code,
              label: countryName,
              sales: gdpValue
            };
          })
          .filter(data => {
            const isValid = data.state && data.sales > 0;
            if (!isValid) {
              console.log('Filtered out invalid row:', data);
            }
            return isValid;
          });
        
        console.log('Processed state data:', stateData);
        console.log('Number of valid entries:', stateData.length);
        
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

