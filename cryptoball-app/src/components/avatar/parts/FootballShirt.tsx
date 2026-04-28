import type { BodyStyle, KitStyle } from "../avatarTypes";

export function FootballShirt({
  style,
  primaryKitColor,
  secondaryKitColor,
  kitStyle,
  clipId,
}: {
  style: BodyStyle;
  primaryKitColor: string;
  secondaryKitColor: string;
  kitStyle: KitStyle;
  clipId?: string;
}) {
  const torso =
    style === "broad"
      ? "M53 134L76 124H124L147 134L152 240H48L53 134Z"
      : "M59 135L78 125H122L141 135L146 240H54L59 135Z";

  const leftSleeve =
    style === "broad"
      ? "M53 134L33 140L27 165L49 175L69 152L63 134Z"
      : "M59 135L42 140L36 162L54 171L71 153L66 136Z";

  const rightSleeve =
    style === "broad"
      ? "M147 134L167 140L173 165L151 175L131 152L137 134Z"
      : "M141 135L158 140L164 162L146 171L129 153L134 136Z";

  const collar =
    style === "broad"
      ? "M78 123C84 129 92 133 100 133C108 133 116 129 122 123"
      : "M81 124C86 129 92 132 100 132C108 132 114 129 119 124";

  const shoulderSeamLeft = style === "broad" ? "M55 135C62 137 67 142 70 149" : "M61 136C66 138 70 143 73 150";
  const shoulderSeamRight = style === "broad" ? "M145 135C138 137 133 142 130 149" : "M139 136C134 138 130 143 127 150";
  const bodySeamLeft = style === "broad" ? "M71 145C66 158 64 177 62 236" : "M76 144C72 158 70 177 68 236";
  const bodySeamRight = style === "broad" ? "M129 145C134 158 136 177 138 236" : "M124 144C128 158 130 177 132 236";
  const centerSeam = "M100 132V238";

  const bodyClip = clipId ? `url(#${clipId})` : undefined;

  return (
    <g>
      {clipId && (
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={torso} />
            <path d={leftSleeve} />
            <path d={rightSleeve} />
          </clipPath>
        </defs>
      )}

      <path d={leftSleeve} fill={primaryKitColor} />
      <path d={rightSleeve} fill={primaryKitColor} />
      <path d={torso} fill={primaryKitColor} />

      <path d={collar} stroke={secondaryKitColor} strokeWidth="4.4" strokeLinejoin="round" fill="none" />
      <path d="M92.5 144H107.5L103.5 154.5H96.5L92.5 144Z" fill={secondaryKitColor} opacity={0.98} />

      <g clipPath={bodyClip}>
        <path d={centerSeam} stroke="#000" strokeWidth="1" opacity={0.1} fill="none" />
        <path d={shoulderSeamLeft} stroke="#000" strokeWidth="1" opacity={0.1} fill="none" />
        <path d={shoulderSeamRight} stroke="#000" strokeWidth="1" opacity={0.1} fill="none" />
        <path d={bodySeamLeft} stroke="#000" strokeWidth="1" opacity={0.08} fill="none" />
        <path d={bodySeamRight} stroke="#000" strokeWidth="1" opacity={0.08} fill="none" />

        {kitStyle === "stripe" && (
          <>
            <rect x="89" y="133" width="5" height="107" fill={secondaryKitColor} opacity={0.94} />
            <rect x="98" y="133" width="4" height="107" fill={secondaryKitColor} opacity={0.96} />
            <rect x="108" y="133" width="5" height="107" fill={secondaryKitColor} opacity={0.94} />
          </>
        )}

        {kitStyle === "sash" && (
          <path d="M83 128L97 128L122 240H108L83 128Z" fill={secondaryKitColor} opacity={0.92} />
        )}

        <path d="M54 152H67" stroke={secondaryKitColor} strokeWidth="4" strokeLinecap="round" opacity={0.62} fill="none" />
        <path d="M146 152H133" stroke={secondaryKitColor} strokeWidth="4" strokeLinecap="round" opacity={0.62} fill="none" />

        {kitStyle === "plain" && (
          <path
            d="M87 136C92 134 96 133 100 133C104 133 108 134 113 136"
            stroke={secondaryKitColor}
            strokeWidth="1.1"
            opacity={0.16}
            fill="none"
            strokeLinecap="round"
          />
        )}

        <path
          d="M100 139C100 154 100 170 100 238"
          stroke={secondaryKitColor}
          strokeWidth="0.95"
          opacity={0.12}
          fill="none"
        />
      </g>

    </g>
  );
}
