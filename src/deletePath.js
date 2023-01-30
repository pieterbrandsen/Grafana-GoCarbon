const fs = require('fs');
const { join } = require('path');

const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
console.dir(argv);

const whisperPath = join(__dirname, '../whisper/');
let { statsPath } = argv;
if (!statsPath) {
  console.error('Please provide a path to the stats');
  process.exit(1);
}

if (!fs.existsSync(whisperPath)) {
  console.log('No whisper folder found, manually delete the stats are not working while whisper export is disabled.');
  process.exit(1);
} else if (statsPath.startsWith('.')) {
  console.log('Please provide a path without a leading dot');
  process.exit(1);
} else if (statsPath.endsWith('.')) {
  console.log('Please provide a path without a trailing dot');
  process.exit(1);
}
statsPath = statsPath.split('.').join('/');

function deletePath(path) {
  if (fs.existsSync(path)) {
    fs.rm(path, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Deleted ${path}`);
    });
    return;
  }
  console.log(`Path not found: ${path}`);
}
deletePath(join(whisperPath, statsPath));
