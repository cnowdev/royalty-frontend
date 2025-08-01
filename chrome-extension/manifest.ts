import { readFileSync } from 'node:fs';
import  { autoApplyProductURLs, productURLs } from '@extension/shared'
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */

const checkoutUrls = [
  ...autoApplyProductURLs.map(url => {
    const domain = url.split('/')[0];
    return `*://${domain}/*`;
  }),
  ...productURLs.map(url => {
    const domain = url.split(/[*/]/)[0];
    return `*://www.${domain}/*`;
  })
];

const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: checkoutUrls,
  permissions: ['storage', 'scripting', 'sidePanel'],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  icons: {
    '128': 'icon-128.png',
  },
  content_scripts: [
    {
      matches: checkoutUrls,
      js: ['content-ui/index.iife.js'],
    },
    {
      matches: checkoutUrls,
      css: ['content.css'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
} satisfies chrome.runtime.ManifestV3;

export default manifest;
