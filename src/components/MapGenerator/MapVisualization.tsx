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

    const { path } = useMapProjection(width, height);
    const mapGroup = svg.append("g");

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data]);

  if (!data || !svgRef.current) return null;

  const handleHover = (event: any, d: any) => {
    const countryData = data.states.find(s => s.state === d.properties.name);
    showTooltip(event, countryData);
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full">
        {svgRef.current && (
          <>
            <CountryFills
              mapGroup={d3.select(svgRef.current).select("g")}
              path={useMapProjection(960, 600).path}
              data={data}
              onHover={handleHover}
              onLeave={hideTooltip}
            />
            <CountryBoundaries
              mapGroup={d3.select(svgRef.current).select("g")}
              path={useMapProjection(960, 600).path}
            />
          </>
        )}
      </svg>
    </div>
  );
};

export default MapVisualization;