import * as d3 from 'd3';
import { formatSalesNumber } from '@/lib/mapUtils';
import { StateData } from '@/lib/types';

export const createTooltip = () => {
  return d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");
};

export const handleMouseOver = (event: any, d: any, tooltip: d3.Selection<any, any, any, any>, countryData: StateData | undefined) => {
  if (countryData) {
    tooltip
      .style("visibility", "visible")
      .html(`
        <strong>${countryData.state}</strong><br/>
        GDP: ${formatSalesNumber(countryData.sales)}
      `);
  }
};

export const handleMouseMove = (event: any, tooltip: d3.Selection<any, any, any, any>) => {
  tooltip
    .style("top", (event.pageY - 10) + "px")
    .style("left", (event.pageX + 10) + "px");
};

export const handleMouseOut = (tooltip: d3.Selection<any, any, any, any>) => {
  tooltip.style("visibility", "hidden");
};