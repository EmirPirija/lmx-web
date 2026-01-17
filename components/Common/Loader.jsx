export default function Loader({ size = 220, className = "" }) {
  const height = Math.round((size * 140) / 220);

  return (
    <div
      className={`${className}`.trim()}
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
      }}
      aria-label="Loading"
      role="status"
    >
      <img
        src="/assets/lmx-loader.svg"
        width={size}
        height={height}
        alt="Loading…"
        style={{ display: "block" }}
        draggable={false}
      />
    </div>
  );
}
