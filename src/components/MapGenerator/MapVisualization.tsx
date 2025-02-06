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

    const projection = d3.geoAlbersUsa()
      .scale(1300)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);

    // Load US states TopoJSON data
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then((us: any) => {
        const states = topojson.feature(us, us.objects.states).features;
        
        // Create map
        svg.append("g")
          .selectAll("path")
          .data(states)
          .join("path")
          .attr("d", path)
          .attr("fill", (d: any) => {
            const stateData = data.states.find(s => s.state === d.properties.name);
            return stateData ? colorScale(stateData.sales) : "#eee";
          })
          .attr("stroke", "white")
          .attr("stroke-width", "1px");

        // Add postal codes
        svg.append("g")
          .selectAll("text")
          .data(states)
          .join("text")
          .attr("transform", (d: any) => `translate(${path.centroid(d)})`)
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "black")
          .text((d: any) => {
            const stateData = data.states.find(s => s.state === d.properties.name);
            return stateData?.postalCode || '';
          });

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
            const stateData = data.states.find(s => s.state === d.properties.name);
            if (stateData) {
              tooltip
                .style("visibility", "visible")
                .html(`
                  <strong>${stateData.state}</strong><br/>
                  Sales: ${formatSalesNumber(stateData.sales)}
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