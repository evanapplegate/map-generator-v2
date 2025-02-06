import * * d3 from 'd3';

export const useMapProjection = (width: number, height: number) => {
  const projection = d3.geoMercator()
    .scale(width / 2 / Math.PI)
    .center([0, 0])
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  return { projection, path };
};