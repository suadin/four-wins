export interface RuntimeVersion {
  app: string;
  appVersion: string;
  standard: string;
}

export type UpdateState = 'current' | 'newer' | 'major' | 'unknown';

export const LATEST_URL = 'https://suadin.github.io/basic-specs/version.json';

export function parseVersion(value: string | null | undefined): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(value ?? '').trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export function compareVersions(left: string, right: string): number {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) {
    return 0;
  }
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] > b[index] ? 1 : -1;
    }
  }
  return 0;
}

export function updateState(pinned: string | null | undefined, latest: string | null | undefined): UpdateState {
  const current = parseVersion(pinned);
  const available = parseVersion(latest);
  if (!current || !available) {
    return 'unknown';
  }
  if (available[0] > current[0]) {
    return 'major';
  }
  return compareVersions(available.join('.'), current.join('.')) > 0 ? 'newer' : 'current';
}

export interface VersionView {
  appLabel: string;
  appTip: string;
  basicLabel: string;
  basicTip: string;
  outdated: boolean;
}

export function versionView(runtime: RuntimeVersion | null, latest: string | null): VersionView {
  const appLabel = runtime?.appVersion ?? '—';
  const basicLabel = runtime?.standard ?? '—';
  const state = updateState(runtime?.standard, latest);
  const appTip = runtime ? `${runtime.app} ${runtime.appVersion} — open SPECS` : 'App version — open SPECS';
  let basicTip = `Basic Specs ${basicLabel} — latest not checked`;
  if (state === 'current') {
    basicTip = `Basic Specs ${basicLabel} — current`;
  } else if (state === 'newer' || state === 'major') {
    basicTip = `Basic Specs ${basicLabel}\n${latest} available`;
  }
  return { appLabel, appTip, basicLabel, basicTip, outdated: state === 'major' };
}
