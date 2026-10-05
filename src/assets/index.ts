import officialLogo from './logo.jpg';

// Official AdmiMatrix Emblem Asset
export const logo = officialLogo;
export const officialLogoAsset = officialLogo;
export const skylerOfficialLogo = officialLogo;
export const admimatrixLogo = officialLogo;
export const admimatrixLogoFallback = officialLogo;
export const uochLogoPng = '/uoch-logo.png';
export const uochLogoJpg = '/uoch-logo.jpg';

export const LOGO_IMAGE_NAME = 'logo.jpg';
export const LOGO_FILENAME = 'logo.jpg';
export const LOGO_ASSET_NAME = 'logo.jpg';
export const DEFAULT_LOGO_URL = officialLogo;

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
    id: 'admimatrix-official',
    name: 'AdmiMatrix Official Logo',
    filename: 'logo.jpg',
    src: officialLogo,
    tag: 'Official Emblem',
    description: 'Verified institutional admissions intelligence insignia'
  },
  {
    id: 'uoch-crest-png',
    name: 'University of Chitral Crest',
    filename: 'uoch-logo.png',
    src: uochLogoPng,
    tag: 'Official Crest',
    description: 'High-resolution official institutional seal (PNG)'
  },
  {
    id: 'uoch-seal-jpg',
    name: 'University of Chitral Seal',
    filename: 'uoch-logo.jpg',
    src: uochLogoJpg,
    tag: 'Official Seal',
    description: 'Traditional University of Chitral insignia'
  }
];

export {
  officialLogo,
  officialLogo as defaultLogo
};

export default officialLogo;

