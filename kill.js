import { execSync } from 'child_process';

console.log("Killing orphaned processes...");
try {
  execSync('pkill -f mongod');
  console.log("Killed mongod");
} catch (e) {
  console.log("No mongod processes found or failed to kill");
}

try {
  execSync('pkill -f "tsx server.ts"');
  console.log("Killed server.ts");
} catch (e) {
  console.log("No server.ts processes found or failed to kill");
}
