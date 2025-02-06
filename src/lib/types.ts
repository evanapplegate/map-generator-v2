export interface MapRequest {
  description: string;
  file: File | null;
  mapType: "usa" | "world";
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
  mapType: "usa" | "world";
}

export interface SimpleMapRequest {
  highlightedStates: string[];
  defaultFill: string;
  borderColor: string;
}