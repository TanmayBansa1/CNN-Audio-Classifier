export default function Waveform({
  data,
  title,
}: {
  data: number[];
  title: string;
}) {
  if (!data?.length) return null;

  const width = 600;
  const height = 300;

  const centerY = height / 2;
  const validData = data.filter((val) => !isNaN(val) && isFinite(val));

  if (validData.length === 0) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min;

  const scaleY = (height * 0.45) / range;

  const pathData = validData.map((sample, i) => {
    const x = (i / (validData.length - 1)) * width;
    let y = centerY;

    if (range > 0) {
      const normalisedSample = (sample - min) / range; // 0 and 1 --> -0.5 and 0.5

      y = centerY - (normalisedSample - 0.5)*2 * scaleY;
    }

    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return <div className="flex h-full w-full flex-col">
    <div className="flex flex-1 items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full block max-w-full rounded border border-stone-200 max-h-[300px]">
            <path d={`M 0 ${centerY} H ${width}`} stroke="#e7e5e4" strokeWidth="1"></path>
            <path d={pathData.join(" ")} fill="none" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    </div>
        <p className="mt-2 text-sm text-gray-400 text-center">{title}</p>
        
  </div>;
}
