import * as d3 from 'd3';

export const getScale = (detailLevel: string) => {
  switch (detailLevel) {
    case "10m": return 160;
    case "50m": return 170;
    case "110m": return 180;
    default: return 180;
  }
};

export const createProjection = (width: number, height: number, detailLevel: string) => {
  return d3.geoEqualEarth()
    .scale(getScale(detailLevel))
    .translate([width / 2, height / 2])
    .clipExtent([[0, 0], [width, height]]);
};