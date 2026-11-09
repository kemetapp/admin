import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'pin'
  | 'search'
  | 'bell'
  | 'chevronDown'
  | 'chevronRight'
  | 'chevronLeft'
  | 'arrowLeft'
  | 'heart'
  | 'star'
  | 'clock'
  | 'plus'
  | 'minus'
  | 'cart'
  | 'home'
  | 'receipt'
  | 'user'
  | 'filter'
  | 'check'
  | 'tag'
  | 'cash'
  | 'card'
  | 'wallet'
  | 'phone'
  | 'message'
  | 'scooter'
  | 'lock'
  | 'eye';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  style?: object;
};

export function Icon({
  name,
  size = 20,
  color = colors.ink,
  strokeWidth = 1.8,
  filled = false,
  style,
}: Props) {
  const stroke = filled ? 'none' : color;
  const fill = filled ? color : 'none';
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style} fill="none">
      {name === 'pin' && (
        <>
          <Path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" {...common} />
          <Circle cx={12} cy={10} r={2.5} {...common} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...common} />
          <Path d="M16.5 16.5 21 21" {...common} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...common} />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" {...common} />
        </>
      )}
      {name === 'chevronDown' && <Path d="m6 9 6 6 6-6" {...common} />}
      {name === 'chevronRight' && <Path d="m9 6 6 6-6 6" {...common} />}
      {name === 'chevronLeft' && <Path d="m15 6-6 6 6 6" {...common} />}
      {name === 'arrowLeft' && (
        <>
          <Path d="M5 12h14" {...common} />
          <Path d="m13 6 6 6-6 6" {...common} />
        </>
      )}
      {name === 'heart' && (
        <Path
          d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fill}
        />
      )}
      {name === 'star' && (
        <Path
          d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z"
          fill={filled ? color : 'none'}
          stroke={filled ? 'none' : color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}
      {name === 'clock' && (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      )}
      {name === 'plus' && (
        <>
          <Path d="M12 5v14" {...common} />
          <Path d="M5 12h14" {...common} />
        </>
      )}
      {name === 'minus' && <Path d="M5 12h14" {...common} />}
      {name === 'cart' && (
        <>
          <Path d="M3 4h2.1" {...common} />
          <Path
            d="M5.1 4l2.5 10.1a1.9 1.9 0 0 0 1.84 1.44h8.2a1.9 1.9 0 0 0 1.85-1.44L21 7.3H6.2"
            {...common}
          />
          <Circle cx={10} cy={19.6} r={1.4} {...common} />
          <Circle cx={17.4} cy={19.6} r={1.4} {...common} />
        </>
      )}
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...common} />
          <Path d="M5.2 9.5V21h13.6V9.5" {...common} />
          <Path d="M9.5 21v-6h5v6" {...common} />
        </>
      )}
      {name === 'receipt' && (
        <>
          <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" {...common} />
          <Path d="M9 8h6M9 12h6" {...common} />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={3.5} {...common} />
          <Path d="M4.5 21a7.5 7.5 0 0 1 15 0" {...common} />
        </>
      )}
      {name === 'filter' && <Path d="M4 7h16M7 12h10M10 17h4" {...common} />}
      {name === 'check' && <Path d="m5 12 5 5 9-10" {...common} />}
      {name === 'tag' && (
        <>
          <Path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L3 13.8V3h10.8L21 11.2a2 2 0 0 1-.5 2.3z" {...common} />
          <Circle cx={7.5} cy={7.5} r={1.4} fill={color} stroke="none" />
        </>
      )}
      {name === 'cash' && (
        <>
          <Rect x={2.5} y={6} width={19} height={12} rx={2.5} {...common} />
          <Circle cx={12} cy={12} r={2.6} {...common} />
        </>
      )}
      {name === 'card' && (
        <>
          <Rect x={2.5} y={5} width={19} height={14} rx={3} {...common} />
          <Path d="M2.5 10h19" {...common} />
        </>
      )}
      {name === 'wallet' && (
        <>
          <Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a3 3 0 0 1 3 3v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17V7.5z" {...common} />
          <Path d="M3 9h18" {...common} />
          <Circle cx={17} cy={14.5} r={1.1} fill={color} stroke="none" />
        </>
      )}
      {name === 'phone' && (
        <Path
          d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3A2.5 2.5 0 0 1 18.5 20C10.5 20 4 13.5 4 5.5A2.5 2.5 0 0 1 6.5 3z"
          {...common}
        />
      )}
      {name === 'message' && (
        <>
          <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H8l-5 3V11.5A8.5 8.5 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z" {...common} />
          <Circle cx={8.5} cy={11.5} r={0.9} fill={color} stroke="none" />
          <Circle cx={12} cy={11.5} r={0.9} fill={color} stroke="none" />
          <Circle cx={15.5} cy={11.5} r={0.9} fill={color} stroke="none" />
        </>
      )}
      {name === 'scooter' && (
        <>
          <Circle cx={5.5} cy={18} r={2.6} {...common} />
          <Circle cx={18.5} cy={18} r={2.6} {...common} />
          <Path d="M8.1 18h5.4l2.6-9H19" {...common} />
          <Path d="M13.8 9h3.6l1.6 6" {...common} />
          <Path d="M4 6h3" {...common} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10} width={14} height={10.5} rx={3} {...common} />
          <Path d="M8 10V7a4 4 0 0 1 8 0v3" {...common} />
        </>
      )}
      {name === 'eye' && (
        <>
          <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" {...common} />
          <Circle cx={12} cy={12} r={2.5} {...common} />
        </>
      )}
    </Svg>
  );
}
