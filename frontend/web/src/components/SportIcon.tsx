import { ReactElement } from 'react';
import Svg, { Circle, Ellipse, Polygon, Rect } from 'react-native-svg';
import { colors } from '@kicko/shared';

// Same ring-and-inner-circle mark as the main Kicko logo, with the
// sport-specific inner shape ported from Kicko/docs/Images/kicko-icon-*.svg
// (same 400x400 coordinate system, so the points are copied verbatim).
export type Sport = 'football' | 'basketball' | 'padel' | 'tennis' | 'volleyball' | 'rugby';

const SHAPES: Record<Sport, ReactElement> = {
  football: <Polygon points="200,80 298,140 298,260 200,320 102,260 102,140" />,
  basketball: <Polygon points="200,72 328,200 200,328 72,200" />,
  padel: <Rect x={102} y={102} width={196} height={196} />,
  tennis: <Polygon points="200,90 310,200 200,310 90,200" />,
  volleyball: (
    <Polygon points="200,72 261,111 328,132 328,268 261,289 200,328 139,289 72,268 72,132 139,111" />
  ),
  // A tilted rugby ball, the one shape here not ported from the docs set.
  rugby: <Ellipse cx={200} cy={200} rx={112} ry={68} transform="rotate(-28 200 200)" />,
};

export function SportIcon({ sport, size = 36 }: { sport: Sport; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400" fill="none" stroke={colors.accent} strokeWidth={20} strokeLinejoin="round">
      <Circle cx={200} cy={200} r={128} />
      {SHAPES[sport]}
      <Circle cx={200} cy={200} r={46} />
    </Svg>
  );
}
