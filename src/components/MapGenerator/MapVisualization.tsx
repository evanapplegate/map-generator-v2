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
    console.log('MapVisualization - Raw data received:', data);
    if (!data || !svgRef.current) {
      console.log('No data or SVG ref available');
      return;
    }

    console.log('MapVisualization - States data:', data.states);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 960;
    const height = 600;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    // Determine if we're showing a US map or world map based on the data
    const isUSMap = data.states.some(s => s.postalCode?.length === 2);
    console.log('Map type:', isUSMap ? 'US Map' : 'World Map');

    const projection = isUSMap 
      ? d3.geoAlbersUsa()
          .scale(1000)
          .translate([width / 2, height / 2])
      : d3.geoEqualEarth()
          .scale(180)
          .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const colorScale = getColorScale(data.minSales, data.maxSales);

    // Load appropriate GeoJSON data based on map type
    const dataPromise = isUSMap
      ? Promise.all([
          d3.json("/geojson/US_states.geojson"),
          d3.json("/geojson/US_bounds.geojson")
        ])
      : Promise.all([
          d3.json("/geojson/countries.geojson"),
          d3.json("/geojson/country_bounds.geojson")
        ]);

    dataPromise.then(([regions, bounds]: [any, any]) => {
      console.log('Loaded GeoJSON data:', { 
        regionsFeatures: regions.features.length,
        bounds: bounds
      });

      // Log all country names from GeoJSON for debugging
      console.log('Available countries in GeoJSON:', 
        regions.features.map((f: any) => {
          const name = f.properties?.NAME || f.properties?.name;
          console.log('GeoJSON country:', { name, properties: f.properties });
          return { 
            name,
            matched: data.states.some(s => s.state?.toLowerCase() === name?.toLowerCase())
          };
        })
      );

      // Log all countries from uploaded data
      console.log('Countries from uploaded data:', 
        data.states.map(s => {
          console.log('Processing state data:', s);
          return {
            country: s.state,
            foundMatch: regions.features.some((f: any) => {
              const geoName = f.properties?.NAME || f.properties?.name;
              const match = s.state?.toLowerCase() === geoName?.toLowerCase();
              console.log('Matching attempt:', { 
                dataCountry: s.state, 
                geoJsonCountry: geoName,
                matched: match 
              });
              return match;
            })
          };
        })
      );

      // Draw region boundaries (states or countries)
      svg.append("g")
        .selectAll("path")
        .data(regions.features)
        .join("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const geoName = d.properties?.NAME || d.properties?.name;
          console.log('Processing region for coloring:', { 
            properties: d.properties,
            geoName
          });
          
          const regionData = data.states.find(s => {
            if (!s.state || !geoName) {
              console.log('Missing data for matching:', { state: s.state, geoName });
              return false;
            }
            const match = isUSMap 
              ? s.state === d.properties.name
              : s.state.toLowerCase() === geoName.toLowerCase();
            if (match) {
              console.log('Found matching region:', {
                feature: d.properties,
                stateData: s
              });
            }
            return match;
          });
          
          const color = regionData ? colorScale(regionData.sales) : "#eee";
          console.log('Region color:', {
            region: geoName,
            sales: regionData?.sales,
            color
          });
          return color;
        })
        .attr("stroke", (d: any) => {
          const geoName = d.properties?.NAME || d.properties?.name;
          const regionData = data.states.find(s => {
            if (!s.state || !geoName) return false;
            return isUSMap 
              ? s.state === d.properties.name
              : s.state.toLowerCase() === geoName.toLowerCase();
          });
          // Only add stroke if there's no fill (no data)
          return regionData ? "none" : "white";
        })
        .attr("stroke-width", "0.5px");

      // Draw bounds with white 1px stroke
      svg.append("path")
        .datum(bounds)
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", "1px");

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
          const geoName = d.properties?.NAME || d.properties?.name;
          const regionData = data.states.find(s => 
            isUSMap 
              ? s.state === d.properties.name
              : s.state?.toLowerCase() === geoName?.toLowerCase()
          );
          if (regionData) {
            console.log('Tooltip shown for:', regionData);
            tooltip
              .style("visibility", "visible")
              .html(`
                <strong>${regionData.state}</strong><br/>
                ${isUSMap ? 'Sales' : 'GDP'}: ${formatSalesNumber(regionData.sales)}
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