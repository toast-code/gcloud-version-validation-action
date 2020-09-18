import * as core from '@actions/core';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {exec} from 'child_process';
import semverGt from 'semver/functions/gt';
import semverCoerce from 'semver/functions/coerce';
import {IServiceVersion} from './common';

const appToSemverVersion = (version: string) => {
  return semverCoerce(String(version).split('-').join('.'));
};

async function run(): Promise<void> {
  try {
    const currentSemverVersion = appToSemverVersion(
      core.getInput('current_version')
    );

    const appYamlFilePath = core.getInput('app_yaml_file_path');
    let serviceName = 'default';

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

    const getGCloudVersions = exec(
      `gcloud app versions list --service="${serviceName}" --format="json"`,
      function (error, stdout, stderr) {
        if (error) {
          core.error(`Error stack: ${JSON.stringify(error.stack, null, 2)}`);
          core.error(`Error code: ${error.code}`);
          core.error(`Signal received: ${error.signal}`);
          core.setFailed(error);
          return;
        }

        const existingVersions: IServiceVersion[] = JSON.parse(stdout);

        const existingSemverVersions = existingVersions
          .map(version => String(version.id))
          .map(versionId => appToSemverVersion(versionId));
        const isValid = existingSemverVersions.every(semverVersion =>
          semverGt(currentSemverVersion!, semverVersion!)
        );

        if (!isValid) {
          core.setFailed(
            `Current semver version ${currentSemverVersion} is lower than existing versions: [${existingSemverVersions.join(
              ' , '
            )}] Update your version to publish another service version.`
          );
          return;
        }

        core.debug(`Child Process STDOUT: ${stdout}`);
        core.debug(`Child Process STDERR: ${stderr}`);
        core.setOutput('valid', isValid);
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
