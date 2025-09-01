export default function ColourScale({width, height, min, max}: {
    width?: number,
    height?: number,
    min?: number,
    max?: number
}) {
    const gradient = "linear-gradient(to right, rgb(255, 128, 51), rgb(255, 255, 255), rgb(51, 128, 255))";

    return <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300">{min}</span>
        <div className="rounded border border-stone-400" style={{width: width, height: height, background: gradient}}></div>
        <span className="text-sm text-gray-300">{max}</span>
    </div>

}