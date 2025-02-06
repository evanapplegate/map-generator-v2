import { MapData } from "@/lib/types";
import MapVisualization from "./MapVisualization";
import ExportButtons from "./ExportButtons";

interface MapContainerProps {
  mapData: MapData | null;
  detailLevel: string;
}

const MapContainer = ({ mapData, detailLevel }: MapContainerProps) => {
  if (!mapData) return null;

  return (
    <div className="space-y-6">
      <MapVisualization data={mapData} detailLevel={detailLevel} />
      <div className="flex justify-end">
        <ExportButtons />
      </div>
    </div>
  );
};

export default MapContainer;