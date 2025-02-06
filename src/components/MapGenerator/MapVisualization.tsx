import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MapData } from '@/lib/types';
import { useMapProjection } from '@/hooks/useMapProjection';
import { useTooltip } from '@/hooks/useTooltip';
import CountryFills from './Layers/CountryFills';
import CountryBoundaries from './Layers/CountryBoundaries';

interface MapVisualizationProps {
  data: MapData | null;
}

const MapVisualization = ({ data }: MapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, hideTooltip } = useTooltip();
  const width = 960;
  const height = 500;
  const { path } = useMapProjection(width, height);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Clear existing content
    svg.selectAll("*").remove();

    // Set up the SVG with explicit dimensions
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto");

    // Create base group with transform
    const mapGroup = svg.append("g")
      .attr("class", "map-group")
      .attr("transform", `translate(0,0)`);

    // Create subgroups
    mapGroup.append("g").attr("class", "country-fills");
    mapGroup.append("g").attr("class", "country-boundaries");

  }, [data, width, height]);

  if (!data || !svgRef.current) return null;

  const handleHover = (event: any, d: any) => {
    const countryData = data.states.find(s => s.state === d.properties.name);
    showTooltip(event, countryData);
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg 
        ref={svgRef}
        style={{ 
          width: '100%',
          height: 'auto',
          minHeight: '500px'
        }}
      >
        <g className="map-group">
          <CountryFills
            mapGroup={d3.select(svgRef.current).select(".map-group")}
            path={path}
            data={data}
            onHover={handleHover}
            onLeave={hideTooltip}
          />
          <CountryBoundaries
            mapGroup={d3.select(svgRef.current).select(".map-group")}
            path={path}
            mapType={data.mapType}
          />
        </g>
      </svg>
    </div>
  );
};

export default MapVisualization;