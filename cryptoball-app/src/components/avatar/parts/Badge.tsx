export function Badge({ text }: { text: string }) {
  return (
    <g transform="translate(137 184)">
      <circle cx="0" cy="0" r="14" fill="#F7F7F7" opacity={0.96} />
      <circle cx="0" cy="0" r="11.2" fill="#111827" />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
      >
        {text.slice(0, 3).toUpperCase()}
      </text>
    </g>
  );
}