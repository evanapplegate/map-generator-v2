import { useEffect } from 'react';
import * as d3 from 'd3';

interface CountryBoundariesProps {
  mapGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  path: d3.GeoPath;
}

const CountryBoundaries = ({ mapGroup, path }: CountryBoundariesProps) => {
  useEffect(() => {
    d3.json("/data/US_bounds.geojson")
      .then((boundariesData: any) => {
        mapGroup.append("g")
          .attr("class", "country-boundaries")
          .selectAll("path")
          .data(boundariesData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", "1px");
      })
      .catch(error => {
        console.error('Error loading country boundaries:', error);
      });
  }, [mapGroup, path]);

  return null;
};

export default CountryBoundaries;