
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface MapVisualizationProps {
  data: MapData | null;
}

const MapVisualization = ({ data }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!data || !svgRef.current) {
      console.log('No data or SVG ref available');
      return;
    }

    console.log('Rendering map with data:', data);
    console.log('Show labels?', data.showLabels);
    console.log('Highlight colors:', data.highlightColors);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    const isUSMap = data.mapType === 'us';
    console.log('Map type:', isUSMap ? 'US Map' : 'World Map');

    const projection = isUSMap 
      ? d3.geoAlbersUsa()
          .scale(1000)
          .translate([width / 2, height / 2])
      : d3.geoEqualEarth()
          .scale(180)
          .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const dataPromise = isUSMap
      ? Promise.all([
          d3.json("/geojson/US_states.geojson"),
          d3.json("/geojson/US_bounds.geojson")
        ])
      : Promise.all([
          d3.json("/geojson/countries.geojson"),
          d3.json("/geojson/country_bounds.geojson")
        ]);

    dataPromise.then(async ([regions, bounds]: [any, any]) => {
      console.log('First region feature:', regions.features[0]);
      
      // Draw regions - STRICTLY NO STROKE
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const code = isUSMap 
            ? d.properties?.postal 
            : (d.properties?.ISO_A3 || d.properties?.iso_a3);
            
          console.log('Region code:', code, 'Has highlight?:', !!data.highlightColors?.[code]);
          
          if (data.highlightColors?.[code]) {
            return data.highlightColors[code];
          }
          return data.defaultFill || "#f3f3f3";
        });

      // Draw bounds - STRICTLY 1PX WHITE STROKE
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", "1");

      // Add labels where specified
      if (data.showLabels) {
        console.log('Adding labels...');
        svg.append("g")
          .selectAll("text")
          .data(regions.features)
          .join("text")
          .attr("transform", (d: any) => {
            const centroid = path.centroid(d);
            console.log('Centroid for feature:', centroid);
            if (isNaN(centroid[0]) || isNaN(centroid[1])) {
              console.log('Invalid centroid for feature:', d);
              return null;
            }
            return `translate(${centroid[0]},${centroid[1]})`;
          })
          .attr("text-anchor", "middle")
          .attr("dy", ".35em")
          .text((d: any) => {
            const code = isUSMap 
              ? d.properties?.postal 
              : (d.properties?.ISO_A3 || d.properties?.iso_a3);
            
            const name = isUSMap ? code : (d.properties?.NAME || d.properties?.name || code);
            console.log('Label check:', { code, name, hasHighlight: !!data.highlightColors?.[code] });
            
            return data.highlightColors?.[code] ? name : "";
          })
          .attr("fill", "#000000")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .style("pointer-events", "none");
      }

      // Add tooltips
      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "#ffffff")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

      svg.selectAll("path")
        .on("mouseover", (event, d: any) => {
          const name = d.properties?.NAME || d.properties?.name || 'Unknown';
          const code = isUSMap 
            ? d.properties?.postal 
            : (d.properties?.ISO_A3 || d.properties?.iso_a3 || 'Unknown');
            
          tooltip
            .style("visibility", "visible")
            .html(`<strong>${name}</strong> (${code})`);
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
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
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
