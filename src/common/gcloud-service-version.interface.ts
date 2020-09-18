export interface IServiceVersion {
  environment: {
    name: string;
    value: number;
  };
  id: string;
  last_deployed_time: {
    datetime: string; // e.g. '2020-09-14 23:07:39+02:00';
    day: number;
    hour: number;
    microsecond: number;
    minute: number;
    month: number;
    second: number;
    year: number;
  };
  project: string; // project name e.g. 'your-project-id';
  service: string; // e.g. 'default';
  traffic_split: number; // e.g. 1.0 => 100% split;
  version: {
    createTime: string; // e.g. '2020-09-14T21:07:39Z';
    createdBy: string; // e.g. 'your-project-id@appspot.gserviceaccount.com';
    diskUsageBytes: string; // e.g. '1343316';
    env: string; // 'standard';
    id: string; // e.g. '1-0-0';
    instanceClass: string; // e.g. 'F1';
    name: string; // e.g. 'apps/your-project-id/services/default/versions/1-0-0';
    network: {};
    runtime: string; // e.g. 'nodejs12';
    runtimeChannel: string; // e.g. 'default';
    servingStatus: string; // e.g. 'SERVING';
    threadsafe: boolean;
    versionUrl: string; // 'https://1-0-0-dot-your-project-id.appspot.com';
  };
}
