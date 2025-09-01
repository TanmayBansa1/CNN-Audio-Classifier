"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import axios from "axios";
import { Badge } from "~/components/ui/badge";
import type { ApiResponse, LayerData, VisualizationData } from "~/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { splitLayers } from "~/lib/layer-utils";
import { getIcon } from "~/lib/icon-pack";
import { Progress } from "~/components/ui/progress";
import ColourScale from "~/components/ColourScale";
import FeatureMap from "~/components/FeatureMap";
import Waveform from "~/components/Waveform";


export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [visualizationData, setVisualizationData] = useState<ApiResponse | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError("");
    setVisualizationData(null);

    const reader = new FileReader();
    // reader.readAsArrayBuffer(file);
    // reader.onload = async()=>{
    //   const arrayBuffer = reader.result as ArrayBuffer;
    //   const base64String = btoa(
    //     new Uint8Array(arrayBuffer).reduce(
    //       (data,byte)=>data+String.fromCharCode(byte),
    //       "",
    //     ),
    //   );
    // } quite inefficient this one, goes to O(n^2)

    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64String = dataUrl.split(",")[1];

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_MODAL_ENDPOINT}`,
          JSON.stringify({
            audio_data: base64String,
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        if (response.status === 200) {
          const data: ApiResponse = response.data as ApiResponse;
          setVisualizationData(data);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the audio file");
      setIsLoading(false);
    };
  };

  let mainLayersData: VisualizationData = {};
  let residualLayersData: Record<string, [string, LayerData][]> = {};
  if(visualizationData){
    ({ mainLayersData, residualLayersData } = splitLayers(visualizationData.visualization));
  }
  return (
    <main className="flex min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] p-8 text-white">
      <div className="mx-auto max-w-[100%]">
        <div className="mb-12 text-center">
          <h1 className="text-bold text-4xl">SunoAI</h1>
          <p className="mt-4 text-gray-400">
            Upload your audio file in .wav format
          </p>
        </div>
        <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4">
          <Input
            type="file"
            accept=".wav"
            id="file-input"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileUpload}
          />
          <Button
            disabled={isLoading}
            className="rounded-md bg-transparent px-4 py-2 text-white hover:bg-transparent"
          >
            {isLoading ? "Analysing..." : "Select a file"}
          </Button>
        </div>
        {fileName && (
          <Badge variant={"secondary"} className="mt-4 bg-stone-400 text-black">
            {fileName}
          </Badge>
        )}
        {error && (
          <Card className="mt-4 bg-red-500 text-center">
            <CardContent>
              <p className="text-white">{error}</p>
            </CardContent>
          </Card>
        )}

        {visualizationData && (
          <div className="space-y-8">
            <Card>
              <CardHeader>Top Predictions</CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {visualizationData.predictions.slice(0, 3).map((pred, i) => {
                    return (
                      <div key={pred.class} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-md font-medium text-stone-700">
                            {getIcon(pred.class)}
                            <span>{pred.class.replaceAll("_", " ")}</span>
                          </div>
                          <Badge variant={i === 0 ? "default" : "secondary"}>
                            {(pred.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress
                          value={pred.confidence * 100}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Input Spectogram</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* feature maps */}
                    <FeatureMap
                      data={visualizationData.input_spectogram.values}
                      title={visualizationData.input_spectogram.shape.join(
                        " x ",
                      )}
                      spectogram
                    ></FeatureMap>
                    {/* colour scale */}
                    <ColourScale
                      width={200}
                      height={16}
                      min={-1}
                      max={1}
                    ></ColourScale>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Audio Waveform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Waveform
                      data={visualizationData.waveform.values}
                      title={`${visualizationData.waveform.duration.toFixed(2)}s * ${visualizationData.waveform.sample_rate}Hz`}
                    ></Waveform>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Maps */}
            <Card>
              <CardHeader>
                <CardTitle>Convolutional Layer Outputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-6">
                  {Object.entries(mainLayersData)
                    .filter(([key]) => typeof key === "string")
                    .map(([mainName, mainData]) => (
                      <div key={mainName} className="space-y-4">
                        <div>
                          <h4 className="mb-2 font-medium text-stone-700">
                            {mainName}
                          </h4>
                          <FeatureMap
                            data={mainData.values}
                            title={mainData.shape.join(" x ")}
                          ></FeatureMap>
                        </div>

                        {residualLayersData[mainName] ? (
                          <div className="h-80 overflow-y-auto rounded-md border border-stone-200 bg-stone-50">
                            {Object.entries(residualLayersData[mainName])
                              .filter(([key]) => typeof key === "string")
                              .sort((a, b) => a[0].localeCompare(b[0]))
                              .map(([_, residualData]) => (
                                <div
                                  key={residualData[0]}
                                  className="space-y-4"
                                >
                                  <FeatureMap
                                    data={residualData[1].values}
                                    title={residualData[0].replace(
                                      `${mainName}.`,
                                      "",
                                    )}
                                    internal
                                  ></FeatureMap>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="h-80 overflow-y-auto rounded-md border border-stone-200 bg-stone-50">
                            <p className="text-stone-700">No residual layers</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                <ColourScale
                  width={200}
                  height={16}
                  min={-1}
                  max={1}
                ></ColourScale>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
