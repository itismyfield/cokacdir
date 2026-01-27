import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export const APP_NAME = 'COKACDIR';
export const APP_VERSION = pkg.version as string;
export const APP_TITLE = `${APP_NAME} v${APP_VERSION}`;
