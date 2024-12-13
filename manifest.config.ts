import { defineManifest } from '@crxjs/vite-plugin'
// @ts-ignore
import packageJson from './package.json'

const matches = ['*://admxt.yfway.com/*', '*://*.google.com/*']

const semver = packageJson.version as string

const [major, minor, patch, release] = semver.split('-').flatMap(item => item.split('.'))

// Chrome不支持语义化版本号
const version = `${major}.${minor}.${patch}`
const versionName = release ? `[${release.toLocaleUpperCase()}版本] ${version}` : version

export default defineManifest(async () => ({
  manifest_version: 3,
  name: '尚品宅配浏览器拓展',
  version,
  version_name: versionName,
  action: { default_popup: 'index.html' },
  content_scripts: [{
    js: ['src/bootstrap.ts'],
    matches,
  }],
  permissions: ['webRequest', 'tabs'],
  host_permissions: matches,
  background: {
    service_worker: 'src/core.ts',
    scripts: ['src/core.ts'],
  },
}))
