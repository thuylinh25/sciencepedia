interface SketchfabViewerProps {
  modelId: string;
  title?: string;
  description?: string;
}

export default function SketchfabViewer({
  modelId,
  title = "3D Model",
}: SketchfabViewerProps) {
  return (
    <figure className="overflow-hidden rounded-xl border bg-card">
      <div style={{ aspectRatio: "16 / 9" }}>
        <iframe
          title={title}
          src={`https://sketchfab.com/models/${modelId}/embed`}
          className="h-full w-full"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
        />
      </div>
    </figure>
  );
}
