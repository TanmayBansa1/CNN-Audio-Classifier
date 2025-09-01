
import type { VisualizationData, LayerData } from "./types";

export function splitLayers(visualizationData: VisualizationData) {
    const mainLayers = Object.keys(visualizationData).filter(layer => !layer.includes('block'));
    const residualLayers = Object.keys(visualizationData).filter(layer => layer.includes('block'));

    const mainLayersData: VisualizationData = {};
    const residualLayersData: Record<string, [string, LayerData][]> = {};

    mainLayers.forEach(layer => {
        mainLayersData[layer] = visualizationData[layer]!;
    });

    residualLayers.forEach(layer => {
        const residualParent = layer.split('.')[0]!;
        const residualBlock = layer.split('.')[1]+"."+layer.split('.')[2]!;
        console.log(residualBlock,"-->", residualParent)
        residualLayersData[residualParent]= [...(residualLayersData[residualParent] ?? []), [residualBlock, visualizationData[layer]!]];
    });

    return { mainLayersData, residualLayersData };
}