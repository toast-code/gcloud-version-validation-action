import {wait} from '../src/wait';
import * as process from 'process';
import {execSync, ExecSyncOptions} from 'child_process';
import * as path from 'path';

test('throws invalid number', async () => {
  const input = parseInt('foo', 10);
  await expect(wait(input)).rejects.toThrow('milliseconds not a number');
});

test('wait 500 ms', async () => {
  const start = new Date();
  await wait(500);
  const end = new Date();
  const delta = Math.abs(end.getTime() - start.getTime());
  expect(delta).toBeGreaterThan(450);
});

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_CURRENT_VERSION'] = '1-0-0';
  process.env['INPUT_APP_YAML_FILE_PATH'] = 'app.yaml';
  const ip = path.join(__dirname, '..', 'lib', 'main.js');
  const options: ExecSyncOptions = {
    env: process.env
  };
  try {
    console.log(execSync(`node ${ip}`, options).toString());
  } catch (err) {
    console.error(err);
  }
});
