import * as core from '@actions/core';
import fs from 'fs';
import {execSync} from 'child_process';

export const authenticateGCloudCli = (
  projectId: string,
  credentials: string
): void => {
  core.debug('Starting to authenticate gcloud');
  const isBase64 = (str: string): boolean => {
    const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    return !!str && base64Regex.test(str);
  };

  const writeData = isBase64(credentials)
    ? Buffer.from(credentials, 'base64')
    : credentials;

  core.debug('Writing authentication file');
  fs.writeFileSync('/tmp/account.json', writeData, {encoding: 'utf8'});

  // authenticate
  core.info('Authenticating with gcloud');
  execSync(`gcloud auth activate-service-account --key-file=/tmp/account.json`);
  // set project
  core.info('Setting gcloud project');
  execSync(`gcloud config set project "${projectId}"`);
};
