import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const statsPath = process.argv[2];
if (!statsPath) {
  console.error('Please provide a path to the stats');
  process.exit(1);
}
if (statsPath.includes('.')) {
  console.error('Please provide a path to the stats only, not outside of the db folder');
  process.exit(1);
}

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
deletePath(join(__dirname, '../whisper', statsPath));
