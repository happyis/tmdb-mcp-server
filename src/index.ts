#!/usr/bin/env node

import { startMCPServer } from './servers/mcp-server.js';
import { startWebServer } from './servers/web-server.js';

// 명령행 인수 파싱
const args = process.argv.slice(2);

async function main() {
  try {
    // 도움말 표시
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }

    // 버전 표시
    if (args.includes('--version') || args.includes('-v')) {
      console.error('TMDB MCP Server v1.0.0');
      return;
    }

    const isWebMode = args.includes('--web');
    const isBothMode = args.includes('--both');
    
    if (isBothMode) {
      // 둘 다 실행
      console.error('🚀 MCP 서버와 웹 서버를 모두 시작합니다...\n');
      
      // MCP 서버를 백그라운드에서 시작
      setTimeout(() => {
        startMCPServer().catch(error => {
          console.error('MCP 서버 오류:', error);
        });
      }, 1000);

      // 웹 서버 시작
      await startWebServer(3030);
      
    } else if (isWebMode) {
      // 웹 서버만 실행
      console.error('🌐 웹 서버를 시작합니다...\n');
      await startWebServer(3030);
      
    } else {
      // 기본값: MCP 서버만 실행 (Claude Desktop 호환)
      // MCP 서버 모드에서는 stdout에 출력하지 않음 (JSON RPC 통신 보호)
      await startMCPServer();
    }

  } catch (error) {
    console.error('서버 시작 오류:', error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🎬 TMDB MCP 서버 v1.0.0

사용법:
  tmdb-mcp-server [옵션]

옵션:
  (없음)       MCP 서버만 실행 (Claude Desktop 호환)
  --web        웹 서버만 실행 (브라우저에서 http://localhost:3030 접속)
  --both       MCP 서버와 웹 서버 모두 실행
  --help, -h   이 도움말 표시
  --version, -v 버전 정보 표시

예시:
  tmdb-mcp-server                # MCP 서버만 실행
  tmdb-mcp-server --web          # 웹 서버만 실행
  tmdb-mcp-server --both         # 둘 다 실행

환경 변수:
  TMDB_API_KEY    TMDB API 키 (필수)
  OPENAI_API_KEY  OpenAI API 키 (웹 서버의 자연어 검색용, 선택사항)

설정 파일:
  config/config.json 또는 ~/.config/tmdbMCP/config.json

자세한 정보: https://github.com/happyis/tmdb-mcp-server
  `);
}

// 메인 함수 실행
main(); 