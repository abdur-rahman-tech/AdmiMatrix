import admimatrixOfficialLogo from './logo.jpg';

export const LOGO_IMAGE_NAME = 'logo.jpg';
export const LOGO_FILENAME = 'logo.jpg';
export const LOGO_ASSET_NAME = 'logo.jpg';
export const DEFAULT_LOGO_URL = admimatrixOfficialLogo;

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
    src: admimatrixOfficialLogo,
    tag: 'Official Logo',
    description: 'Official AdmiMatrix brand logo'
  }
];

export {
  admimatrixOfficialLogo,
  admimatrixOfficialLogo as skylerOfficialLogo,
  admimatrixOfficialLogo as admimatrixLogo,
  admimatrixOfficialLogo as logo
};

export default admimatrixOfficialLogo;

