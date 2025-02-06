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
    svg.selectAll("*").remove();

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height].join(" "))
      .attr("style", "max-width: 100%; height: auto;");
    
    const mapGroup = svg.append("g");
    console.log('Map group created');

    // Create fills and boundaries
    const fillsGroup = mapGroup.append("g").attr("class", "country-fills");
    const boundariesGroup = mapGroup.append("g").attr("class", "country-boundaries");

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, path]);

  if (!data || !svgRef.current) {
    console.log('Rendering null due to missing data or svgRef');
    return null;
  }

  const handleHover = (event: any, d: any) => {
    const countryData = data.states.find(s => s.state === d.properties.name);
    showTooltip(event, countryData);
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full">
        <g>
          <CountryFills
            mapGroup={d3.select(svgRef.current).select("g")}
            path={path}
            data={data}
            onHover={handleHover}
            onLeave={hideTooltip}
          />
          <CountryBoundaries
            mapGroup={d3.select(svgRef.current).select("g")}
            path={path}
            mapType={data.mapType}
          />
        </g>
      </svg>
    </div>
  );
};

export default MapVisualization;