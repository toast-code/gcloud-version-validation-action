import SemVer from 'semver/classes/semver';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

export const convertSemverToServiceVersion = (
  version: SemVer,
  suffix?: string
): string => {
  let serviceVersion = String(valid(coerce(version)))
    .split('.')
    .join('-');

  if (suffix && suffix.length > 0) {
    serviceVersion += `-${suffix}`;
  }
  return serviceVersion;
};

export const convertServiceVersionToSemver = (version: string): SemVer => {
  return coerce(String(version).split('-').join('.'))!;
};

export const getRandomSuffix = (characterLength: number): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  return new Array(characterLength)
    .fill(0)
    .map(() => characters.charAt(Math.floor(Math.random() * charactersLength)))
    .join('');
};
