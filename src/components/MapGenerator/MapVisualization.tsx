import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { MapData } from '@/lib/types';
import { getColorScale, formatSalesNumber } from '@/lib/mapUtils';

interface MapVisualizationProps {
  data: MapData | null;
  detailLevel?: string;
}

const MapVisualization = ({ data, detailLevel = "110m" }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    // Adjust scale based on detail level
    const getScale = () => {
      switch (detailLevel) {
        case "10m": return 160;
        case "50m": return 170;
        case "110m": return 180;
        default: return 180;
      }
    };

    const projection = d3.geoEqualEarth()
      .scale(getScale())
      .translate([width / 2, height / 2])
      .clipExtent([[0, 0], [width, height]]);  // Add clipExtent to prevent overflow

    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);

    // Load world GeoJSON data based on detail level
    d3.json(`https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${detailLevel}.json`)
      .then((world: any) => {
        const countries = topojson.feature(world, world.objects.countries);
        
        // Create map
        svg.append("g")
          .selectAll("path")
          .data(countries.features)
          .join("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            return countryData ? colorScale(countryData.sales) : "#eee";
          })
          .attr("stroke", "white")
          .attr("stroke-width", "0.5px");

        // Add tooltips
        const tooltip = d3.select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background-color", "white")
          .style("padding", "10px")
          .style("border-radius", "5px")
          .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

        svg.selectAll("path")
          .on("mouseover", (event, d: any) => {
            const countryData = data.states.find(s => s.state === d.properties.name);
            if (countryData) {
              tooltip
                .style("visibility", "visible")
                .html(`
                  <strong>${countryData.state}</strong><br/>
                  GDP: ${formatSalesNumber(countryData.sales)}
                `);
            }
          })
          .on("mousemove", (event) => {
            tooltip
              .style("top", (event.pageY - 10) + "px")
              .style("left", (event.pageX + 10) + "px");
          })
          .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
          });
      })
      .catch(error => {
        console.error('Error loading world map data:', error);
      });

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data, detailLevel]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

export default MapVisualization;