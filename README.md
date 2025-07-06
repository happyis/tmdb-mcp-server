# TMDB 영화 API MCP 서버 ![NPM Version](https://img.shields.io/npm/v/tmdb-mcp-server) ![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)

이 프로젝트는 TMDB(The Movie Database) API를 Model Context Protocol(MCP) 서버로 제공합니다. MCP는 LLM(Large Language Model) 애플리케이션이 다양한 데이터 소스와 도구를 통합할 수 있는 표준 프로토콜입니다.

## 기능

- 영화 제목/키워드로 영화 검색
- 영화 상세 정보 조회 (줄거리, 평점, 장르, 제작사 등)
- 영화 출연진 및 제작진 정보 조회
- 현재 상영 중인 영화 목록
- 개봉 예정 영화 목록
- 인기 영화 순위
- 평점 높은 영화 목록
- 배우, 감독 등 인물 검색
- TV 프로그램 검색 (기본 기능)

## 설치

### 글로벌 설치

```bash
npm install -g tmdb-mcp-server
```

### 프로젝트에 설치

```bash
npm install tmdb-mcp-server
```

### 소스에서 설치

```bash
git clone https://github.com/your-repo/tmdb-mcp-server.git
cd tmdb-mcp-server
npm install
npm run build
```

## 설정

다음 두 가지 방법 중 하나로 TMDB API 키를 설정할 수 있습니다:

### 1. 설정 파일 사용

`config/config.json` 파일을 생성하고 TMDB API 키를 설정합니다:

```json
{
  "tmdbApiKey": "your_tmdb_api_key_here"
}
```

또는 다음 위치에 config.json 파일을 생성할 수 있습니다:
- `~/.config/tmdbMCP/config.json` (사용자 홈 디렉토리)
- 현재 작업 디렉토리의 `config.json`

### 2. 환경 변수 사용

`TMDB_API_KEY` 환경 변수에 API 키를 설정할 수 있습니다:

```bash
export TMDB_API_KEY=your_tmdb_api_key_here
```

TMDB API 키는 [TMDB 웹사이트](https://www.themoviedb.org/settings/api)에서 무료로 발급받을 수 있습니다.

## 실행

### 글로벌 설치 후 실행

```bash
tmdb-mcp-server
```

### 소스에서 실행

```bash
npm run build
npm start
```

## 개발

개발 모드로 실행하려면:

```bash
npm run dev
```

## Usage

### Claude Desktop과 함께 사용하기

Claude Desktop 앱에서 이 MCP 서버를 사용하는 가장 안정적인 방법은 로컬에서 소스 코드를 실행하는 것입니다:

```json
{
  "mcpServers": {
    "tmdb": {
      "command": "node",
      "args": [
        "/절대/경로/tmdb-mcp-server/dist/index.js"
      ],
      "env": {
        "TMDB_API_KEY": "your_tmdb_api_key_here"
      }
    }
  }
}
```

주의사항:
- `/절대/경로/tmdb-mcp-server/dist/index.js`를 서버 파일의 실제 절대 경로로 변경하세요.
- Windows에서는 경로를 `C:\\경로\\tmdb-mcp-server\\dist\\index.js` 형식으로 사용하세요.
- 환경 변수 대신 config.json 파일을 사용할 경우, 해당 파일이 이 README의 [설정](#설정) 섹션에 나열된 위치 중 하나에 생성되어 있는지 확인하세요.

**참고**: 다음 방법들도 시도해볼 수 있으나, 환경에 따라 작동하지 않을 수 있습니다.

1. 패키지를 전역으로 설치한 후 직접 실행:

```bash
npm install -g tmdb-mcp-server
```

```json
{
  "mcpServers": {
    "tmdb": {
      "command": "tmdb-mcp-server",
      "env": {
        "TMDB_API_KEY": "your_tmdb_api_key_here"
      }
    }
  }
}
```

2. Node require 방식:

```json
{
  "mcpServers": {
    "tmdb": {
      "command": "node",
      "args": [
        "-e",
        "require('tmdb-mcp-server')"
      ],
      "env": {
        "TMDB_API_KEY": "your_tmdb_api_key_here"
      }
    }
  }
}
```

## MCP 도구

### 영화 검색 및 정보 조회

- `search-movies` - 영화 검색
  - 매개변수:
    - `query`: 검색어 (영화 제목, 키워드)
    - `page`: 페이지 번호 (기본값: 1)

- `get-movie-details` - 영화 상세 정보 조회
  - 매개변수:
    - `movieId`: TMDB 영화 ID

- `get-movie-credits` - 영화 출연진 및 제작진 정보
  - 매개변수:
    - `movieId`: TMDB 영화 ID

### 영화 목록 조회

- `get-now-playing-movies` - 현재 상영 중인 영화 목록
  - 매개변수:
    - `page`: 페이지 번호 (기본값: 1)

- `get-upcoming-movies` - 개봉 예정 영화 목록
  - 매개변수:
    - `page`: 페이지 번호 (기본값: 1)

- `get-popular-movies` - 인기 영화 목록
  - 매개변수:
    - `page`: 페이지 번호 (기본값: 1)

- `get-top-rated-movies` - 평점 높은 영화 목록
  - 매개변수:
    - `page`: 페이지 번호 (기본값: 1)

### 인물 검색

- `search-person` - 배우, 감독 등 인물 검색
  - 매개변수:
    - `query`: 검색어 (인물 이름)
    - `page`: 페이지 번호 (기본값: 1)

## 사용 예시

### 영화 검색
```
사용자: "어벤져스 영화를 찾아줘"
AI: search-movies 도구를 사용하여 "어벤져스" 관련 영화를 검색하고 결과를 표시합니다.
```

### 영화 상세 정보
```
사용자: "영화 ID 299536의 상세 정보를 알려줘"
AI: get-movie-details 도구를 사용하여 해당 영화의 상세 정보를 제공합니다.
```

### 현재 상영작 확인
```
사용자: "지금 극장에서 상영 중인 영화 목록을 보여줘"
AI: get-now-playing-movies 도구를 사용하여 현재 상영 중인 영화 목록을 제공합니다.
```

### 인기 영화 순위
```
사용자: "요즘 인기 있는 영화 순위를 알려줘"
AI: get-popular-movies 도구를 사용하여 인기 영화 목록을 제공합니다.
```

### 배우 검색
```
사용자: "톰 행크스가 나온 영화를 찾아줘"
AI: search-person 도구로 톰 행크스를 검색하고 관련 영화 정보를 제공합니다.
```

## API 제한 사항

- TMDB API는 일일 요청 제한이 있습니다 (무료 계정: 1,000 요청/일)
- 과도한 요청을 방지하기 위해 적절한 지연 시간을 두는 것이 좋습니다
- 상용 사용 시 TMDB의 이용 약관을 확인하세요

## 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 라이센스

이 프로젝트는 ISC 라이센스 하에 배포됩니다.

## 지원

문제가 있거나 도움이 필요한 경우:
1. 이 README의 설정 섹션을 다시 확인하세요
2. TMDB API 키가 올바르게 설정되었는지 확인하세요
3. GitHub Issues에 문제를 보고하세요

---

**참고**: 이 서버는 TMDB API를 사용하며, TMDB의 이용 약관을 준수합니다. 영화 데이터의 저작권은 해당 권리자에게 있습니다. 