import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { getColorScale, formatSalesNumber } from '@/lib/mapUtils';

interface MapVisualizationProps {
  data: MapData | null;
}

const MapVisualization = ({ data }: MapVisualizationProps) => {
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

    const projection = d3.geoEqualEarth()
      .scale(180)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);

    // Create a group for map layers
    const mapGroup = svg.append("g");

    // Load and render country fills
    d3.json("/data/countries-110m.json")
      .then((countriesData: any) => {
        // Render country fills
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
          .attr("stroke", "none");

        // Load and render country boundaries
        return d3.json("/data/countries-boundaries-110m.json");
      })
      .then((boundariesData: any) => {
        // Render boundaries as a separate layer
        mapGroup.append("g")
          .attr("class", "country-boundaries")
          .selectAll("path")
          .data(boundariesData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", "none")
          .attr("stroke", "#fff")
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

        mapGroup.selectAll(".country-fills path")
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
        console.error('Error loading map data:', error);
      });

    return () => {
      d3.select("body").selectAll(".tooltip").remove();
    };
  }, [data]);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};

export default MapVisualization;