import logoImage from './logo.jpg';

export const LOGO_IMAGE_NAME = 'logo.jpg';
export const LOGO_FILENAME = 'logo.jpg';
export const LOGO_ASSET_NAME = 'logo.jpg';
export const DEFAULT_LOGO_URL = '/logo.jpg';
export const DEFAULT_LOGO_SRC = logoImage;

export interface AssetLogoItem {
  id: string;
  name: string;
  filename: string;
  src: string;
  tag: string;
  description: string;
}

export const ASSET_LOGOS: AssetLogoItem[] = [
  {
    id: 'admimatrix-brand',
    name: 'AdmiMatrix Brand Mark',
    filename: 'logo.jpg',
    src: DEFAULT_LOGO_SRC,
    tag: 'Primary Brand',
    description: 'Official AdmiMatrix logo used across the platform'
  }
];

export const skylerOfficialLogo = logoImage;
export const admimatrixLogoFallback = logoImage;
export const uochLogoPng = logoImage;
export const uochLogoJpg = logoImage;
export const admimatrixLogo = logoImage;
export const logo = logoImage;

export default logoImage;

