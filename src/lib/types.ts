
export interface MapRequest {
  description: string;
  file: File | null;
  apiKey?: string;
}

export interface StateData {
  state: string;
  postalCode: string;
  label: string;
  sales: number;
}

export interface MapData {
  states: StateData[];
  maxSales: number;
  minSales: number;
  defaultFill?: string;
  borderColor?: string;
  highlightColor?: string;
  highlightColors?: { [key: string]: string };
  borderWidth?: string;
  boundaryWidth?: string;
  labelColor?: string;
  labelSize?: string;
  showLabels?: boolean;
  mapType: 'us' | 'world';
}

export interface SimpleMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
}
