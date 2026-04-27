import type { FaceShape, HairStyle } from "../../avatar/avatarTypes";
import { getHeadMetrics } from "../../avatar/avatarGeometry";

type HairProps = {
  faceShape: FaceShape;
  style: HairStyle;
  color: string;
  variant: number;
};

type HairFit = {
  center: number;
  left: number;
  right: number;
  width: number;
  top: number;
  archY: number;
  hairline: number;
  templeY: number;
  rootY: number;
};

function getFit(faceShape: FaceShape): HairFit {
  const metrics = getHeadMetrics(faceShape);
  const center = 100;
  const widthBoost =
    faceShape === "oval" || faceShape === "heart"
      ? 1.16
      : faceShape === "slim" || faceShape === "long"
        ? 1.12
        : 1.1;
  const width = metrics.headWidth * widthBoost;
  const left = center - width / 2;
  const right = center + width / 2;
  const top = metrics.browY - 40 - Math.max(0, metrics.headHeight - 100) * 0.02;

  return {
    center,
    left,
    right,
    width,
    top,
    archY: top + 8,
    hairline: metrics.browY - 8,
    templeY: metrics.eyeY - 14,
    rootY: metrics.browY - 11,
  };
}

function capPath(fit: HairFit, options?: { topLift?: number; hairlineLift?: number; sideInset?: number }) {
  const topLift = options?.topLift ?? 0;
  const hairlineLift = options?.hairlineLift ?? 0;
  const sideInset = options?.sideInset ?? 0;
  const left = fit.left + sideInset;
  const right = fit.right - sideInset;
  const center = fit.center;

  return `
    M${left} ${fit.templeY}
    C${left + 2} ${fit.archY}, ${left + fit.width * 0.18} ${fit.top + topLift}, ${center} ${fit.top + topLift}
    C${right - fit.width * 0.18} ${fit.top + topLift}, ${right - 2} ${fit.archY}, ${right} ${fit.templeY}
    C${right - fit.width * 0.1} ${fit.hairline - 2 + hairlineLift}, ${center + fit.width * 0.18} ${fit.hairline - 5 + hairlineLift}, ${center} ${fit.hairline - 5 + hairlineLift}
    C${center - fit.width * 0.18} ${fit.hairline - 5 + hairlineLift}, ${left + fit.width * 0.1} ${fit.hairline - 2 + hairlineLift}, ${left} ${fit.templeY}
    Z
  `;
}

function waveLine(x1: number, y1: number, x2: number, y2: number, bend: number) {
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1}C${mid - bend} ${y1 - 3}, ${mid + bend} ${y2 - 3}, ${x2} ${y2}`;
}

function locPath(x: number, top: number, length: number, sway: number) {
  return `M${x} ${top}C${x + sway} ${top + 5}, ${x + sway * 1.25} ${top + length * 0.55}, ${x + sway * 0.5} ${top + length}`;
}

function braidPath(x: number, top: number, length: number, sway: number) {
  return `M${x} ${top}C${x + sway} ${top + 7}, ${x + sway * 0.8} ${top + length * 0.6}, ${x + sway} ${top + length}`;
}

function renderTempleAttachments(fit: HairFit, color: string, options?: { inset?: number; drop?: number }) {
  const inset = options?.inset ?? 0;
  const drop = options?.drop ?? 7;
  const left = fit.left + inset;
  const right = fit.right - inset;

  return (
    <>
      <path
        d={`M${left} ${fit.templeY}C${left + 1.5} ${fit.templeY + 2}, ${left + 3} ${fit.templeY + drop - 2}, ${left + 5.5} ${fit.templeY + drop}C${left + 7.2} ${fit.templeY + drop - 3}, ${left + 7.2} ${fit.templeY + 1}, ${left + 5.8} ${fit.templeY - 2}C${left + 4} ${fit.templeY - 1}, ${left + 2} ${fit.templeY - 0.5}, ${left} ${fit.templeY}Z`}
        fill={color}
      />
      <path
        d={`M${right} ${fit.templeY}C${right - 1.5} ${fit.templeY + 2}, ${right - 3} ${fit.templeY + drop - 2}, ${right - 5.5} ${fit.templeY + drop}C${right - 7.2} ${fit.templeY + drop - 3}, ${right - 7.2} ${fit.templeY + 1}, ${right - 5.8} ${fit.templeY - 2}C${right - 4} ${fit.templeY - 1}, ${right - 2} ${fit.templeY - 0.5}, ${right} ${fit.templeY}Z`}
        fill={color}
      />
    </>
  );
}

function renderBaseShort(fit: HairFit, color: string, variant: number) {
  const sideInset = variant % 2 === 0 ? 0 : 2;
  return (
    <>
      <path d={capPath(fit, { sideInset })} fill={color} />
      {renderTempleAttachments(fit, color, { inset: sideInset, drop: 7 })}
      <path
        d={waveLine(fit.left + 10, fit.hairline - 1, fit.right - 10, fit.hairline - 3, 8)}
        stroke="#000"
        strokeOpacity="0.12"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={waveLine(fit.left + 14, fit.archY + 1, fit.center + 12, fit.archY - 2, 7)}
        stroke="#fff"
        strokeOpacity="0.08"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

export function Hair({ faceShape, style, color, variant }: HairProps) {
  const fit = getFit(faceShape);
  const hairVariant = variant % 5;
  const rootXs = [fit.left + fit.width * 0.12, fit.left + fit.width * 0.3, fit.center, fit.right - fit.width * 0.3, fit.right - fit.width * 0.12];

  if (style === "buzz") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 7, hairlineLift: 3, sideInset: 5 })} fill={color} />
        {renderTempleAttachments(fit, color, { inset: 5, drop: 5 })}
        <path
          d={waveLine(fit.left + 16, fit.archY + 5, fit.right - 16, fit.archY + 4, 6)}
          stroke="#fff"
          strokeOpacity="0.08"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (style === "fade") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 4, hairlineLift: 1, sideInset: 2 })} fill={color} />
        {renderTempleAttachments(fit, color, { inset: 2, drop: 6 })}
        <path d={capPath(fit, { topLift: 6, hairlineLift: 2, sideInset: 10 })} fill={color} opacity={0.35} />
        <path
          d={waveLine(fit.left + 12, fit.hairline - 2, fit.right - 12, fit.hairline - 4, 8)}
          stroke="#000"
          strokeOpacity="0.12"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (style === "curly") {
    const curls = [
      { cx: fit.left + fit.width * 0.12, cy: fit.archY + 8, r: fit.width * 0.11 },
      { cx: fit.left + fit.width * 0.27, cy: fit.archY + 2, r: fit.width * 0.12 },
      { cx: fit.left + fit.width * 0.43, cy: fit.top + 1, r: fit.width * 0.13 },
      { cx: fit.center, cy: fit.top, r: fit.width * 0.14 },
      { cx: fit.right - fit.width * 0.43, cy: fit.top + 1, r: fit.width * 0.13 },
      { cx: fit.right - fit.width * 0.27, cy: fit.archY + 2, r: fit.width * 0.12 },
      { cx: fit.right - fit.width * 0.12, cy: fit.archY + 8, r: fit.width * 0.11 },
    ];

    return (
      <g>
        <path d={capPath(fit, { hairlineLift: -1 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 8 })}
        {curls.map((curl, index) => (
          <circle key={`curl-${index}`} cx={curl.cx} cy={curl.cy} r={curl.r} fill={color} />
        ))}
        {curls.map((curl, index) => (
          <circle key={`curl-highlight-${index}`} cx={curl.cx - curl.r * 0.22} cy={curl.cy - curl.r * 0.2} r={curl.r * 0.24} fill="#fff" opacity={0.06} />
        ))}
      </g>
    );
  }

  if (style === "ringlets") {
    return (
      <g>
        <path d={capPath(fit, { hairlineLift: -1 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 7 })}
        {rootXs.map((x, index) => (
          <g key={`ringlet-${index}`}>
            <circle cx={x} cy={fit.rootY} r={4.4} fill={color} />
            <path
              d={locPath(x, fit.rootY + 2, 13 + (index % 2) * 3, index % 2 === 0 ? -1.6 : 1.6)}
              stroke={color}
              strokeWidth="4.1"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={locPath(x - 0.8, fit.rootY + 3, 11 + (index % 2) * 3, index % 2 === 0 ? -1.2 : 1.2)}
              stroke="#fff"
              strokeOpacity="0.06"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ))}
      </g>
    );
  }

  if (style === "afro") {
    const puffs = [
      { cx: fit.left + fit.width * 0.06, cy: fit.archY + 8, r: fit.width * 0.13 },
      { cx: fit.left + fit.width * 0.19, cy: fit.archY + 2, r: fit.width * 0.14 },
      { cx: fit.left + fit.width * 0.35, cy: fit.top - 1, r: fit.width * 0.15 },
      { cx: fit.center, cy: fit.top - 3, r: fit.width * 0.16 },
      { cx: fit.right - fit.width * 0.35, cy: fit.top - 1, r: fit.width * 0.15 },
      { cx: fit.right - fit.width * 0.19, cy: fit.archY + 2, r: fit.width * 0.14 },
      { cx: fit.right - fit.width * 0.06, cy: fit.archY + 8, r: fit.width * 0.13 },
    ];

    return (
      <g>
        {renderTempleAttachments(fit, color, { inset: 1, drop: 8 })}
        {puffs.map((puff, index) => (
          <circle key={`puff-${index}`} cx={puff.cx} cy={puff.cy} r={puff.r} fill={color} />
        ))}
        {puffs.map((puff, index) => (
          <circle key={`puff-shine-${index}`} cx={puff.cx - puff.r * 0.16} cy={puff.cy - puff.r * 0.16} r={puff.r * 0.2} fill="#fff" opacity={0.05} />
        ))}
        <path d={capPath(fit, { topLift: 1, hairlineLift: -1, sideInset: 2 })} fill={color} opacity={0.85} />
      </g>
    );
  }

  if (style === "locs") {
    const locCount = hairVariant % 2 === 0 ? 5 : 6;
    const locXs = Array.from({ length: locCount }, (_, index) => fit.left + fit.width * (0.12 + (index * 0.76) / Math.max(1, locCount - 1)));
    return (
      <g>
        <path d={capPath(fit, { topLift: -1, hairlineLift: -2 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 8 })}
        <path
          d={`M${fit.left + 5} ${fit.rootY - 2}C${fit.left + 18} ${fit.rootY - 11}, ${fit.right - 18} ${fit.rootY - 11}, ${fit.right - 5} ${fit.rootY - 2}L${fit.right - 8} ${fit.rootY + 4}C${fit.right - 20} ${fit.rootY - 1}, ${fit.left + 20} ${fit.rootY - 1}, ${fit.left + 8} ${fit.rootY + 4}Z`}
          fill={color}
        />
        {locXs.map((x, index) => {
          const sway = index < locXs.length / 2 ? -1.6 : 1.6;
          const length = 15 + (index % 2) * 3;
          return (
            <g key={`loc-${index}`}>
              <ellipse cx={x} cy={fit.rootY + 1} rx="4.8" ry="5.5" fill={color} />
              <path d={locPath(x, fit.rootY + 4, length, sway)} stroke={color} strokeWidth="4.7" strokeLinecap="round" fill="none" />
              <path d={locPath(x - 0.8, fit.rootY + 5, length - 1, sway * 0.75)} stroke="#fff" strokeOpacity="0.05" strokeWidth="0.9" strokeLinecap="round" fill="none" />
            </g>
          );
        })}
      </g>
    );
  }

  if (style === "mohawk") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 6, hairlineLift: 2, sideInset: 10 })} fill={color} opacity={0.35} />
        {renderTempleAttachments(fit, color, { inset: 10, drop: 5 })}
        <path
          d={`M${fit.center - fit.width * 0.12} ${fit.hairline - 4}C${fit.center - fit.width * 0.1} ${fit.archY - 2}, ${fit.center - fit.width * 0.06} ${fit.top - 12}, ${fit.center} ${fit.top - 14}C${fit.center + fit.width * 0.06} ${fit.top - 12}, ${fit.center + fit.width * 0.1} ${fit.archY - 2}, ${fit.center + fit.width * 0.12} ${fit.hairline - 4}C${fit.center + 5} ${fit.hairline - 7}, ${fit.center - 5} ${fit.hairline - 7}, ${fit.center - fit.width * 0.12} ${fit.hairline - 4}Z`}
          fill={color}
        />
      </g>
    );
  }

  if (style === "braids") {
    const braidXs = [fit.center - fit.width * 0.16, fit.center - fit.width * 0.05, fit.center + fit.width * 0.05, fit.center + fit.width * 0.16];
    return (
      <g>
        <path d={capPath(fit, { topLift: 1, hairlineLift: -1 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 7 })}
        {braidXs.map((x, index) => {
          const sway = index % 2 === 0 ? -2 : 2;
          const length = 18 + (index % 2) * 2;
          return (
            <g key={`braid-${index}`}>
              <ellipse cx={x} cy={fit.rootY + 1} rx="3.8" ry="4.6" fill={color} />
              <path d={braidPath(x, fit.rootY + 4, length, sway)} stroke={color} strokeWidth="4.2" strokeLinecap="round" fill="none" />
              <path d={braidPath(x - 0.8, fit.rootY + 5, length - 1, sway * 0.7)} stroke="#fff" strokeOpacity="0.05" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            </g>
          );
        })}
      </g>
    );
  }

  if (style === "slickback") {
    return (
      <g>
        <path d={capPath(fit, { topLift: -2, hairlineLift: -1 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 6 })}
        {[0, 1, 2].map((line) => (
          <path
            key={`slick-${line}`}
            d={waveLine(fit.left + 16 + line * 5, fit.archY + 6 - line, fit.right - 20 + line * 2, fit.hairline - 2 + line, 10)}
            stroke="#fff"
            strokeOpacity="0.08"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    );
  }

  if (style === "pompadour") {
    return (
      <g>
        <path d={capPath(fit, { topLift: -1, hairlineLift: -1 })} fill={color} />
        {renderTempleAttachments(fit, color, { drop: 7 })}
        <path
          d={`M${fit.center - fit.width * 0.28} ${fit.archY + 7}C${fit.center - fit.width * 0.16} ${fit.top - 14}, ${fit.center + fit.width * 0.08} ${fit.top - 16}, ${fit.center + fit.width * 0.3} ${fit.archY + 3}C${fit.center + 10} ${fit.archY + 2}, ${fit.center + 5} ${fit.hairline - 8}, ${fit.center - 2} ${fit.hairline - 7}C${fit.center - 10} ${fit.archY + 2}, ${fit.center - 18} ${fit.archY + 4}, ${fit.center - fit.width * 0.28} ${fit.archY + 7}Z`}
          fill={color}
        />
        <path
          d={waveLine(fit.center - 14, fit.archY + 4, fit.center + 18, fit.archY + 5, 7)}
          stroke="#fff"
          strokeOpacity="0.08"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }

  if (style === "topknot") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 0, hairlineLift: 0, sideInset: 2 })} fill={color} />
        {renderTempleAttachments(fit, color, { inset: 2, drop: 7 })}
        <path
          d={`M${fit.center - 10} ${fit.archY + 2}C${fit.center - 6} ${fit.top - 3}, ${fit.center + 6} ${fit.top - 3}, ${fit.center + 10} ${fit.archY + 2}`}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx={fit.center} cy={fit.top - 7} rx="10" ry="8" fill={color} />
        <path d={waveLine(fit.center - 6, fit.top - 8, fit.center + 7, fit.top - 8, 3)} stroke="#fff" strokeOpacity="0.08" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (style === "cornrows") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 1, hairlineLift: 0, sideInset: 2 })} fill={color} />
        {renderTempleAttachments(fit, color, { inset: 2, drop: 7 })}
        {[0.18, 0.34, 0.5, 0.66, 0.82].map((ratio, index) => {
          const x = fit.left + fit.width * ratio;
          return (
            <path
              key={`cornrow-${index}`}
              d={`M${x} ${fit.top + 3}C${x + (index % 2 === 0 ? 1.3 : -1.3)} ${fit.archY + 4}, ${x + (index % 2 === 0 ? 1 : -1)} ${fit.hairline - 1}, ${x} ${fit.hairline + 10}`}
              stroke="#fff"
              strokeOpacity="0.11"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  }

  if (style === "flattop") {
    const left = fit.left + 5;
    const right = fit.right - 5;
    const top = fit.top - 2;
    return (
      <g>
        <path
          d={`M${left} ${fit.templeY}L${left + 3} ${fit.archY - 3}L${left + 8} ${top}H${right - 8}L${right - 3} ${fit.archY - 3}L${right} ${fit.templeY}C${right - 7} ${fit.hairline - 2}, ${left + 7} ${fit.hairline - 2}, ${left} ${fit.templeY}Z`}
          fill={color}
        />
        {renderTempleAttachments({ ...fit, left, right }, color, { drop: 6 })}
        <path d={`M${left + 10} ${top + 1}H${right - 10}`} stroke="#fff" strokeOpacity="0.08" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (style === "curtains") {
    const partX = fit.center + (hairVariant % 2 === 0 ? -2 : 2);
    return (
      <g>
        <path
          d={`M${fit.left + 4} ${fit.templeY}C${fit.left + 10} ${fit.archY + 1}, ${fit.left + fit.width * 0.22} ${fit.top + 3}, ${partX} ${fit.top + 5}C${partX - 5} ${fit.hairline - 2}, ${fit.center - 11} ${fit.hairline + 7}, ${fit.center - 16} ${fit.hairline + 14}C${fit.left + 12} ${fit.hairline + 7}, ${fit.left + 6} ${fit.hairline + 1}, ${fit.left + 4} ${fit.templeY}Z`}
          fill={color}
        />
        <path
          d={`M${fit.right - 4} ${fit.templeY}C${fit.right - 10} ${fit.archY + 1}, ${fit.right - fit.width * 0.22} ${fit.top + 3}, ${partX} ${fit.top + 5}C${partX + 5} ${fit.hairline - 2}, ${fit.center + 11} ${fit.hairline + 7}, ${fit.center + 16} ${fit.hairline + 14}C${fit.right - 12} ${fit.hairline + 7}, ${fit.right - 6} ${fit.hairline + 1}, ${fit.right - 4} ${fit.templeY}Z`}
          fill={color}
        />
        {renderTempleAttachments(fit, color, { inset: 4, drop: 7 })}
        <path d={`M${partX} ${fit.top + 4}C${partX - 1} ${fit.archY + 3}, ${partX - 1} ${fit.hairline + 2}, ${partX} ${fit.hairline + 10}`} stroke="#fff" strokeOpacity="0.07" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  if (style === "quiff") {
    return (
      <g>
        {renderBaseShort(fit, color, hairVariant)}
        <path
          d={`M${fit.center - fit.width * 0.26} ${fit.archY + 7}C${fit.center - fit.width * 0.14} ${fit.top - 8}, ${fit.center + fit.width * 0.02} ${fit.top - 12}, ${fit.center + fit.width * 0.24} ${fit.archY + 2}C${fit.center + 6} ${fit.archY + 3}, ${fit.center + 1} ${fit.hairline - 7}, ${fit.center - 5} ${fit.hairline - 5}C${fit.center - 12} ${fit.archY + 3}, ${fit.center - 18} ${fit.archY + 5}, ${fit.center - fit.width * 0.26} ${fit.archY + 7}Z`}
          fill={color}
        />
      </g>
    );
  }

  if (style === "waves") {
    return (
      <g>
        <path d={capPath(fit, { topLift: 5, hairlineLift: 2, sideInset: 3 })} fill={color} />
        {renderTempleAttachments(fit, color, { inset: 3, drop: 6 })}
        {[0, 1, 2].map((line) => (
          <path
            key={`wave-${line}`}
            d={waveLine(fit.left + 12 + line * 2, fit.archY + 5 + line * 3, fit.right - 12 - line * 2, fit.archY + 4 + line * 3, 7)}
            stroke="#fff"
            strokeOpacity="0.08"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    );
  }

  if (style === "short") {
    return <g>{renderBaseShort(fit, color, hairVariant)}</g>;
  }

  return <g>{renderBaseShort(fit, color, hairVariant)}</g>;
}
