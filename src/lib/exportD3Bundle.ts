import { MapData } from './types';
import JSZip from 'jszip';

export async function generateD3Bundle(data: MapData, geojsonData: any) {
  const zip = new JSZip();

  // Core visualization code
  const visualizationCode = `
const renderMap = (config, geojsonData) => {
  const width = 960;
  const height = 600;
  const isUSMap = config.mapType === 'us';

  const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height].join(" "))
    .attr("style", "max-width: 100%; height: auto;")
    .style("background-color", "#F9F5F1");

  const projection = isUSMap 
    ? d3.geoAlbersUsa().scale(1000).translate([width / 2, height / 2])
    : d3.geoEqualEarth().scale(180).translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw regions
  svg.append("g")
    .selectAll("path")
    .data(geojsonData.regions.features)
    .join("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const code = isUSMap 
        ? d.properties?.postal 
        : (d.properties?.ISO_A3 || d.properties?.iso_a3);
      return config.highlightColors?.[code] || config.defaultFill || "#f3f3f3";
    })
    .attr("stroke", "none")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const name = d.properties?.NAME || d.properties?.name || 'Unknown';
      const code = isUSMap 
        ? d.properties?.postal 
        : (d.properties?.ISO_A3 || d.properties?.iso_a3 || 'Unknown');
      tooltip.style("visibility", "visible")
        .html("<strong>" + name + "</strong> (" + code + ")");
    })
    .on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Draw bounds
  svg.append("path")
    .datum(geojsonData.bounds)
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#F9F5F1")
    .attr("stroke-width", "1");

  // Add labels
  if (config.showLabels) {
    svg.append("g")
      .selectAll("text")
      .data(geojsonData.regions.features)
      .join("text")
      .attr("transform", (d) => {
        const centroid = path.centroid(d);
        if (isNaN(centroid[0]) || isNaN(centroid[1])) return null;
        return "translate(" + centroid[0] + "," + centroid[1] + ")";
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d) => {
        const code = isUSMap 
          ? d.properties?.postal 
          : (d.properties?.ISO_A3 || d.properties?.iso_a3);
        const name = isUSMap ? code : (d.properties?.NAME || d.properties?.name || code);
        return config.highlightColors?.[code] ? name : "";
      })
      .attr("fill", "#000000")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none");
  }
};`;

  // HTML template
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>D3.js Map Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="map"></div>
  <script src="visualization.js"></script>
  <script>
    const config = ${JSON.stringify(data)};
    const geojsonData = ${JSON.stringify(geojsonData)};
    renderMap(config, geojsonData);
  </script>
</body>
</html>`;

  // CSS
  const css = `
body {
  background-color: #F9F5F1;
  color: #8d7a69;
  font-family: Optima, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  margin: 0;
  padding: 20px;
}
#map {
  max-width: 960px;
  margin: 0 auto;
}
.tooltip {
  position: absolute;
  visibility: hidden;
  background-color: #ffffff;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-size: 14px;
  pointer-events: none;
}`;

  // Add files to zip
  zip.file("index.html", html);
  zip.file("styles.css", css);
  zip.file("visualization.js", visualizationCode);
  zip.file("README.md", `# D3.js Map Visualization Bundle

A self-contained, embeddable map visualization generated with D3.js.

## Usage

### Method A: Standalone
1. Extract all files to a directory
2. Open \`index.html\` in your browser - that's it!

### Method B: Embed in Existing Page
1. Copy \`styles.css\` to your stylesheets
2. Add this div where you want the map:
   \`\`\`html
   <div id="map"></div>
   \`\`\`
3. Add these scripts to your page:
   \`\`\`html
   <script src="https://d3js.org/d3.v7.min.js"></script>
   <script src="visualization.js"></script>
   \`\`\`
4. Initialize the map:
    \`\`\`js
    const config = { /* Your map config */ };
    const geojsonData = { /* Your GeoJSON data */ };
    renderMap(config, geojsonData);
    \`\`\`
`);

  return await zip.generateAsync({ type: "blob" });
}
