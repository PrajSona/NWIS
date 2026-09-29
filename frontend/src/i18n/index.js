import en from './en';
import hi from './hi';
import as_ from './as';
import brx from './brx';
import mni from './mni';

export const LANGUAGES = {
  en: { label: 'English', native: 'English', translations: en },
  hi: { label: 'Hindi', native: 'हिन्दी', translations: hi },
  as: { label: 'Assamese', native: 'অসমীয়া', translations: as_ },
  brx: { label: 'Bodo', native: 'बड़ो', translations: brx },
  mni: { label: 'Manipuri', native: 'মৈতৈলোন্', translations: mni },
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES);
export const DEFAULT_LANGUAGE = 'en';
