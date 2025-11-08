import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    res.json({ version: packageJson.version });
  } catch (error) {
    res.status(500).json({ message: 'Error reading version information', error: error.message });
  }
});

export default router;
