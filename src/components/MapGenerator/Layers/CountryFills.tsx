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
    console.log('CountryFills data:', data);
    const colorScale = getColorScale(data.minSales, data.maxSales);
    const geoJsonPath = data.mapType === "usa" ? "/data/US_states.geojson" : "/data/countries.geojson";
    
    console.log('Loading GeoJSON from:', geoJsonPath);

    d3.json(geoJsonPath)
      .then((geoData: any) => {
        console.log('Loaded GeoJSON data:', geoData);
        
        mapGroup.append("g")
          .attr("class", "country-fills")
          .selectAll("path")
          .data(geoData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            const color = countryData ? colorScale(countryData.sales) : "#eee";
            console.log('Country:', d.properties.name, 'Color:', color);
            return color;
          })
          .attr("stroke", "none")
          .on("mouseover", onHover)
          .on("mouseout", onLeave);
      })
      .catch(error => {
        console.error('Error loading fills:', error);
      });
  }, [mapGroup, path, data, onHover, onLeave]);

  return null;
};

export default CountryFills;