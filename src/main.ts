import * as core from '@actions/core';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {exec, execSync} from 'child_process';
import semverGt from 'semver/functions/gt';
import semverCoerce from 'semver/functions/coerce';
import {IServiceVersion} from './common';

const appToSemverVersion = (version: string) => {
  return semverCoerce(String(version).split('-').join('.'));
};

const authenticateGCloudCli = (
  projectId: string,
  credentials: string
): void => {
  const isBase64 = (str: string): boolean => {
    const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    return !!str && base64Regex.test(str);
  };

  const writeData = isBase64(credentials)
    ? Buffer.from(credentials, 'base64')
    : credentials;

  fs.writeFileSync('/tmp/account.json', writeData, {encoding: 'utf8'});

  // authenticate
  execSync(`gcloud auth activate-service-account --key-file=/tmp/account.json`);
  // set project
  execSync(`gcloud config set project "${projectId}"`);
};

async function run(): Promise<void> {
  try {
    // variables
    const currentSemverVersion = appToSemverVersion(
      core.getInput('current_version')
    );
    const appYamlFilePath = core.getInput('app_yaml_file_path');
    // environment variables
    const projectId = String(process.env.GCLOUD_PROJECT_ID);
    const applicationCredentials = String(
      process.env.GCLOUD_APPLICATION_CREDENTIALS
    );

    authenticateGCloudCli(projectId, applicationCredentials);

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
