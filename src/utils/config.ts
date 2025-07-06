import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TMDBConfig } from '../types.js';

// __dirname을 ESM에서 사용하기 위한 방법
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로컬 개발 환경에서는 프로젝트 루트에서 config 로드
// 클로즈 데스크톱에서는 홈 디렉토리 등에서 로드할 수 있음
const getConfigPaths = (): string[] => {
  const paths = [
    // 프로젝트 루트의 config
    path.resolve(__dirname, '../../config/config.json'),
    // 홈 디렉토리의 config
    path.resolve(process.env.HOME || process.env.USERPROFILE || '', '.config/tmdbMCP/config.json'),
    // 현재 디렉토리의 config
    path.resolve(process.cwd(), 'config.json')
  ];
  
  return paths.filter(p => fs.existsSync(p));
};

export const loadConfig = (): TMDBConfig => {
  // 먼저 환경 변수에서 API 키 확인
  if (process.env.TMDB_API_KEY) {
    console.error('Loaded API key from environment variable.');
    return {
      tmdbApiKey: process.env.TMDB_API_KEY
    };
  }
  
  // 환경 변수가 없으면 설정 파일에서 로드
  const configPaths = getConfigPaths();
  
  if (configPaths.length === 0) {
    throw new Error('Config file not found and no environment variable set. Create a config.json file or set the TMDB_API_KEY environment variable.');
  }
  
  const configPath = configPaths[0];
  console.error(`Loading config file: ${configPath}`);
  
  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData) as TMDBConfig;
    
    if (!config.tmdbApiKey) {
      throw new Error('tmdbApiKey is missing in the config file.');
    }
    
    return config;
  } catch (error) {
    console.error('Error loading config file:', error);
    throw new Error('Unable to load config file.');
  }
};

const config = loadConfig();
export default config; 