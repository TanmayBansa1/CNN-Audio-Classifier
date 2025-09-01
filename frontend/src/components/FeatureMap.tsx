import { getColour } from "~/lib/colours";
export default function FeatureMap({data,title, internal, spectogram}: {data: number[][], title: string, internal?: boolean, spectogram?: boolean}) {

    if(!data?.length || !data[0]?.length) return null;

    const mapHeight = data.length;
    const mapWidth = data[0].length;

    const mapMax = data.flat().reduce((max,val)=> Math.max(max, Math.abs(val ?? 0)),0);

    return (
        <div className="w-full text-center">
            <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" className={`mx-auto block rounded border border=stone-200 ${internal ? "w-full max-w-32" : spectogram ? " w-full object-contain" : " w-full max-w-[500px] max-h-[300px] object-contain"}`}>
                {data.flatMap((row,i)=>(row.map((value,j)=>{
                    const normalisedValue = mapMax === 0? 0 : value / mapMax;
                    const [r,g,b] = getColour(normalisedValue);
                    return (
                        <rect key={`${i}-${j}`} x={j} y={i} width={1} height={1} fill={`rgb(${r},${g},${b})`}></rect>
                    )
                })))}
            </svg>
            <p className="mt-1 text-xs text-gray-400">{title}</p>

        </div>
    )

}
