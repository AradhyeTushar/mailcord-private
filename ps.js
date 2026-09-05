import { execSync } from 'child_process';

try {
  const ps = execSync('ps aux').toString();
  console.log(ps);
} catch (e) {
  console.log(e);
}
