import skylerOfficialLogo from './skyler_official_logo.jpg';
import admimatrixLogoFallback from './images/logo.jpg';
import uochLogoPng from './images/uoch-logo.png';
import uochLogoJpg from './images/uoch-logo.jpg';

export const LOGO_IMAGE_NAME = 'skyler_official_logo.jpg';
export const LOGO_FILENAME = 'skyler_official_logo.jpg';
export const LOGO_ASSET_NAME = 'skyler_official_logo.jpg';
export const DEFAULT_LOGO_URL = '/skyler_official_logo.jpg';

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
    id: 'skyler-official',
    name: 'Skyler Official Logo',
    filename: 'skyler_official_logo.jpg',
    src: skylerOfficialLogo,
    tag: 'Official Emblem',
    description: 'Future Skills Fellow Skyler course navigator badge'
  },
  {
    id: 'admimatrix-clean',
    name: 'AdmiMatrix Minimal Mark',
    filename: 'logo.jpg',
    src: admimatrixLogoFallback,
    tag: 'Minimal Asset',
    description: 'Compact vector-style matrix emblem from assets'
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
    tag: 'Official Emblem',
    description: 'Traditional University of Chitral insignia (JPG)'
  }
];

export {
  skylerOfficialLogo,
  skylerOfficialLogo as admimatrixLogo,
  admimatrixLogoFallback,
  skylerOfficialLogo as logo,
  uochLogoPng,
  uochLogoJpg
};

export default skylerOfficialLogo;

