import * as d3 from 'd3';

export const useMapProjection = (width: number, height: number) => {
  // Use mercator projection for better world map display
  const projection = d3.geoMercator()
    .scale((width - 3) / (2 * Math.PI))
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  return { projection, path };
};