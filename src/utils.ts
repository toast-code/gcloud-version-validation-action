import SemVer from 'semver/classes/semver';
import valid from 'semver/functions/valid';
import coerce from 'semver/functions/coerce';

export const convertSemverToServiceVersion = (version: SemVer): string => {
  return String(valid(coerce(version)))
    .split('.')
    .join('-');
};

export const convertServiceVersionToSemver = (version: string): SemVer => {
  return coerce(String(version).split('-').join('.'))!;
};
