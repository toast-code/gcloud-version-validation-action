import * as core from '@actions/core';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {exec} from 'child_process';
import semverGt from 'semver/functions/gt';
import semverEq from 'semver/functions/eq';
import semverIncrement from 'semver/functions/inc';
import semverRSort from 'semver/functions/rsort';
import semverCoerce from 'semver/functions/coerce';
import {IServiceVersion} from './common';
import * as dotenv from 'dotenv';
import {
  convertSemverToServiceVersion,
  convertServiceVersionToSemver,
  getRandomSuffix
} from './utils';
import {authenticateGCloudCli} from './auth-gcloud';
import SemVer from 'semver/classes/semver';
// import variables
dotenv.config();

const getSemverFromPackageJson = (): SemVer => {
  const packageJsonFilePath = core.getInput('package_json_file_path');
  const packageJSON = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf8'));
  if (!packageJSON.version) {
    core.setFailed('package.json does not contain a version.');
  }
  const semverVersion = semverCoerce(packageJSON.version);

  if (!semverVersion) {
    core.setFailed('package.json version is not a valid semver version.');
  }

  return semverVersion!;
};

const getServiceName = (): string => {
  let serviceName = 'default';
  const appYamlFilePath = core.getInput('app_yaml_file_path');
  const gcpAppConfig = yaml.safeLoad(
    fs.readFileSync(appYamlFilePath, 'utf8')
  ) as {
    service: string;
  };

  if (gcpAppConfig && gcpAppConfig.service) {
    serviceName = gcpAppConfig.service;
  } else {
    core.warning(
      `App service is missing in configuration, using ${serviceName}`
    );
  }

  return serviceName;
};

async function run(): Promise<void> {
  try {
    // input variables
    const currentSemverVersion = getSemverFromPackageJson();
    const serviceName = getServiceName();
    // environment variables
    const projectId = String(process.env.GCLOUD_PROJECT_ID);
    const applicationCredentials = String(
      process.env.GCLOUD_APPLICATION_CREDENTIALS
    );

    core.debug('Setup all variables');

    // auth gcloud
    authenticateGCloudCli(projectId, applicationCredentials);

    const getGCloudVersions = exec(
      `gcloud app versions list --format="json"`,
      function (error, stdout) {
        if (error) {
          core.error(`Error stack: ${JSON.stringify(error.stack, null, 2)}`);
          core.error(`Error code: ${error.code}`);
          core.error(`Signal received: ${error.signal}`);
          core.setFailed(error);
          return;
        }

        const existingVersions: IServiceVersion[] = JSON.parse(stdout);

        // get all existing service versions
        const existingSemverVersions = existingVersions
          .filter(version => version.service === serviceName)
          .map(version => String(version.id))
          .map(versionId => convertServiceVersionToSemver(versionId));

        const latestSemverVersion = semverRSort(existingSemverVersions)[0];

        if (semverGt(latestSemverVersion, currentSemverVersion)) {
          core.setFailed(
            `Current semver version ${currentSemverVersion} is not greater than existing versions: [${existingSemverVersions.join(
              ' , '
            )}] Update your version to be at least "${semverIncrement(
              latestSemverVersion,
              'patch'
            )}" to publish another service version.`
          );
          return;
        }

        let suffix = '';

        if (semverEq(latestSemverVersion, currentSemverVersion)) {
          core.info(
            `Current version same as the latest published version. Adding a suffix to the version`
          );
          suffix = getRandomSuffix(3);
        }

        const gcloudAppServiceVersion = convertSemverToServiceVersion(
          currentSemverVersion,
          suffix
        );

        core.exportVariable(
          'GCLOUD_APP_SERVICE_VERSION',
          gcloudAppServiceVersion
        );

        core.info(
          `Exported valid gcloud version to $GCLOUD_APP_SERVICE_VERSION`
        );
      }
    );

    getGCloudVersions.on('exit', function (code) {
      core.debug(`Child process exited with exit code ${code}`);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
