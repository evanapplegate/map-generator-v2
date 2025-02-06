import * as d3 from 'd3';
import { useEffect } from 'react';
import { StateData } from '@/lib/types';
import { formatSalesNumber } from '@/lib/mapUtils';

export const useTooltip = () => {
  useEffect(() => {
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    return () => {
      tooltip.remove();
    };
  }, []);

  const showTooltip = (event: any, countryData: StateData | undefined) => {
    if (countryData) {
      d3.select(".tooltip")
        .style("visibility", "visible")
        .html(`
          <strong>${countryData.state}</strong><br/>
          GDP: ${formatSalesNumber(countryData.sales)}
        `)
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    }
  };

  const hideTooltip = () => {
    d3.select(".tooltip").style("visibility", "hidden");
  };

  return { showTooltip, hideTooltip };
};