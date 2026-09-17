import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Same outline style as SportIcon/owner's icons.tsx (stroke, round caps/
// joins) so the footer's social row matches the rest of the app instead of
// looking like dropped-in brand-colored badges.
type IconProps = { size?: number; color: string };

export function InstagramIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3.5} y={3.5} width={17} height={17} rx={5} />
      <Circle cx={12} cy={12} r={4.2} />
      <Circle cx={16.8} cy={7.2} r={0.6} fill={color} stroke="none" />
    </Svg>
  );
}

export function XIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M8.3 8.3l7.4 7.4M15.7 8.3l-7.4 7.4" />
    </Svg>
  );
}

export function FacebookIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9.5} />
      <Path d="M14 8.5h-1.4c-.9 0-1.6.7-1.6 1.6V12h3l-.4 2.6h-2.6V21" />
    </Svg>
  );
}
