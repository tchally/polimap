declare module 'react-simple-maps' {
  import { ReactNode, SVGProps, CSSProperties } from 'react';

  export interface ComposableMapProps {
    projection?: string | ((point: [number, number]) => [number, number]);
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
      [key: string]: any;
    };
    width?: number;
    height?: number;
    viewBox?: string;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography?: string | object;
    children: (params: {
      geographies: Array<{
        rsmKey: string | number;
        properties: any;
        geometry: any;
        id: string | number;
        [key: string]: any;
      }>;
    }) => ReactNode;
  }

  export interface GeographyProps extends SVGProps<SVGPathElement> {
    geography?: any;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    onClick?: (event: any) => void;
    onMouseMove?: (event: any) => void;
    onMouseLeave?: (event: any) => void;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<any>;
}
