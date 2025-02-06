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
  const height = 600;
  const { path } = useMapProjection(width, height);

  useEffect(() => {
    console.log('MapVisualization data:', data);
    console.log('svgRef.current:', svgRef.current);
    
    if (!data || !svgRef.current) {
      console.log('Missing data or svgRef, returning early');
      return;
    }

    const svg = d3.select(svgRef.current);
    console.log('Creating SVG with dimensions:', width, height);
    
    // Clear existing content
    svg.selectAll("*").remove();

    // Set up the SVG
    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");

    // Create a single group for all map elements
    const mapGroup = svg.append("g").attr("class", "map-group");
    console.log('Map group created:', mapGroup.node());

    // Create groups for fills and boundaries
    mapGroup.append("g").attr("class", "country-fills");
    mapGroup.append("g").attr("class", "country-boundaries");
    console.log('Created fill and boundary groups');

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, path, width, height]);

  if (!data || !svgRef.current) {
    console.log('Rendering null due to missing data or svgRef');
    return null;
  }

  const handleHover = (event: any, d: any) => {
    const countryData = data.states.find(s => s.state === d.properties.name);
    showTooltip(event, countryData);
  };

  // Only render the components if we have both data and svgRef
  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full">
        {svgRef.current && (
          <>
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
          </>
        )}
      </svg>
    </div>
  );
};

export default MapVisualization;