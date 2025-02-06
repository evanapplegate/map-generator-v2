import { useEffect } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { getColorScale } from '@/lib/mapUtils';

interface CountryFillsProps {
  mapGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  path: d3.GeoPath;
  data: MapData;
  onHover: (event: any, d: any) => void;
  onLeave: () => void;
}

const CountryFills = ({ mapGroup, path, data, onHover, onLeave }: CountryFillsProps) => {
  useEffect(() => {
    const colorScale = getColorScale(data.minSales, data.maxSales);

    d3.json("/data/countries-110m.json")
      .then((countriesData: any) => {
        mapGroup.append("g")
          .attr("class", "country-fills")
          .selectAll("path")
          .data(countriesData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            return countryData ? colorScale(countryData.sales) : "#eee";
          })
          .attr("stroke", "none")
          .on("mouseover", onHover)
          .on("mouseout", onLeave);
      })
      .catch(error => {
        console.error('Error loading country fills:', error);
      });
  }, [mapGroup, path, data, onHover, onLeave]);

  return null;
};

export default CountryFills;