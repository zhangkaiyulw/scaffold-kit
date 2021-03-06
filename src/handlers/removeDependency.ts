import * as fs from 'fs';
import { spawn } from 'child-process-promise';
import isDependencyInstalled from '../utilities/isDependencyInstalled';
import Reporter from '../Reporter';
import InstallDependencyInfo from '../instructions/InstallDependencyInfo';

const mockRemoveDependency = (
  pkgFilePath: string,
  pkgName: string,
  version: string,
  dev: boolean
) => {
  if (!fs.existsSync(pkgFilePath)) {
    return;
  }
  const pkg = require(pkgFilePath);
  if (!dev) {
    if (pkg.dependencies && pkg.dependencies[pkgName]) {
      delete pkg.dependencies[pkgName];
    }
  } else {
    if (pkg.devDependencies && pkg.devDependencies[pkgName]) {
      delete pkg.devDependencies[pkgName];
    }
  }
  fs.writeFileSync(pkgFilePath, JSON.stringify(pkg, null, 2) + '\n');
};

const realRemoveDependency = async (
  pkgFilePath: string,
  pkgName: string,
  version: string,
  dev: boolean
) => {
  try {
    await spawn(
      'npm',
      ['remove', pkgName],
      { capture: [ 'stdout', 'stderr' ]}
    );
  } catch(e) {
    process.stderr.write(e.stderr);
  }
}

const removeDependency = async (
  params: InstallDependencyInfo,
  reporter: Reporter
) => {
  const packageName = params.package;
  const { version, dev, mock, wd } = params;
  const [installed, pkgFilePath] = isDependencyInstalled(wd as string, packageName, dev || false);
  if (installed) {
    reporter.push({
      message: 'remove',
      dependency: packageName
    });
    if (mock) {
      mockRemoveDependency(pkgFilePath, packageName, version, dev || false);
    } else {
      await realRemoveDependency(pkgFilePath, packageName, version, dev || false);
    }
  } else {
    reporter.push({
      message: 'uninstalled',
      dependency: packageName
    });
  }
};

export default removeDependency;
