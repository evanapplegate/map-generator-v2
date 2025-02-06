export interface MapRequest {
  description: string;
  file: File | null;
  apiKey?: string;
}

export interface StateData {
  state: string;
  postalCode: string;
  sales: number;
}

export interface MapData {
  states: StateData[];
  maxSales: number;
  minSales: number;
  defaultFill?: string;
  borderColor?: string;
  highlightColor?: string;
}

export interface SimpleMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
}