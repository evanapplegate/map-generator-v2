import { useEffect } from 'react';
import * as d3 from 'd3';

interface CountryBoundariesProps {
  mapGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  path: d3.GeoPath;
  mapType: "usa" | "world";
}

const CountryBoundaries = ({ mapGroup, path, mapType }: CountryBoundariesProps) => {
  useEffect(() => {
    const geoJsonPath = mapType === "usa" ? "/data/US_bounds.geojson" : "/data/country_bounds.geojson";

    d3.json(geoJsonPath)
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
        console.error('Error loading boundaries:', error);
      });
  }, [mapGroup, path, mapType]);

  return null;
};

export default CountryBoundaries;