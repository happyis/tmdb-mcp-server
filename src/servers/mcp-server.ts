import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { TMDBService } from '../services/tmdb.js';
import { Movie, Person, TVShow, Genre, ProductionCompany } from '../types.js';
import { loadConfig } from '../utils/config.js';

export async function startMCPServer() {
  try {
    // 설정 로드
    const config = loadConfig();
    
    // TMDB 서비스 초기화
    const tmdbService = new TMDBService(config.tmdbApiKey);
    
    // MCP 서버 생성
    const server = new McpServer({
      name: 'TMDB Movie API',
      version: '1.0.0'
    });
    
    // 영화 ID로 영화 조회 리소스
    server.resource(
      'movie-by-id',
      'movie://{movieId}',
      async (uri) => {
        // URI에서 영화 ID 파라미터 추출
        const parts = uri.href.split('/');
        const movieId = parseInt(parts[parts.length - 1]);
        
        const movie = await tmdbService.getMovieDetails(movieId);
        
        return {
          contents: [{
            uri: uri.href,
            text: `제목: ${movie.title}
원제: ${movie.original_title}
개봉일: ${movie.release_date}
상영시간: ${movie.runtime}분
장르: ${movie.genres?.map((g: Genre) => g.name).join(', ') || '정보 없음'}
평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)
줄거리: ${movie.overview}
제작비: ${movie.budget ? `$${movie.budget.toLocaleString()}` : '정보 없음'}
박스오피스: ${movie.revenue ? `$${movie.revenue.toLocaleString()}` : '정보 없음'}
제작사: ${movie.production_companies?.map((c: ProductionCompany) => c.name).join(', ') || '정보 없음'}
TMDB 링크: https://www.themoviedb.org/movie/${movieId}`
          }]
        };
      }
    );

    // 🔍 영화 검색 툴 - 모든 영화 관련 질문의 시작점
    server.tool(
      'search-movies',
      '영화 제목, 키워드, 장르로 영화를 검색합니다. 한국영화, 외국영화, 최신영화, 개봉영화 등 모든 영화 검색에 사용됩니다.',
      {
        query: z.string().min(1, '검색어를 입력해주세요.'),
        page: z.number().positive().default(1)
      },
      async ({ query, page }) => {
        const response = await tmdbService.searchMovies(query, page);
        
        if (!response.results || response.results.length === 0) {
          return {
            content: [{ 
              type: 'text', 
              text: `"${query}"에 대한 검색 결과가 없습니다.` 
            }]
          };
        }

        const resultText = response.results.map((movie: Movie, idx: number) => {
          return `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)
   개요: ${movie.overview || '개요 없음'}
   TMDB ID: ${movie.id}
`;
        }).join('\n');

        return {
          content: [{ 
            type: 'text', 
            text: `"${query}" 검색 결과 (총 ${response.total_results}개 중 ${page}페이지)\n\n${resultText}` 
          }]
        };
      }
    );

    // 🎥 현재 상영 중인 영화 툴
    server.tool(
      'get-now-playing-movies',
      '현재 극장에서 상영 중인 영화 목록을 가져옵니다. 최신 개봉작, 현재 상영작 정보를 제공합니다.',
      {
        page: z.number().positive().default(1)
      },
      async ({ page }) => {
        const response = await tmdbService.getNowPlayingMovies(page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '현재 상영 중인 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 현재 상영 중인 영화\n${movies}` 
          }]
        };
      }
    );

    // 📅 개봉 예정 영화 툴
    server.tool(
      'get-upcoming-movies',
      '개봉 예정인 영화 목록을 가져옵니다. 앞으로 개봉할 영화, 예정작 정보를 제공합니다.',
      {
        page: z.number().positive().default(1)
      },
      async ({ page }) => {
        const response = await tmdbService.getUpcomingMovies(page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '개봉 예정 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 개봉 예정 영화\n${movies}` 
          }]
        };
      }
    );

    // 📊 인기 영화 툴
    server.tool(
      'get-popular-movies',
      '현재 인기 있는 영화 순위를 가져옵니다. 화제작, 인기작, 트렌딩 영화 정보를 제공합니다.',
      {
        page: z.number().positive().default(1)
      },
      async ({ page }) => {
        const response = await tmdbService.getPopularMovies(page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '인기 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 인기 영화\n${movies}` 
          }]
        };
      }
    );

    // ⭐ 평점 높은 영화 툴
    server.tool(
      'get-top-rated-movies',
      '평점이 높은 영화 순위를 가져옵니다. 명작, 고평점 영화, 추천작 정보를 제공합니다.',
      {
        page: z.number().positive().default(1)
      },
      async ({ page }) => {
        const response = await tmdbService.getTopRatedMovies(page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '평점 높은 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 평점 높은 영화\n${movies}` 
          }]
        };
      }
    );

    // 🎬 영화 상세 정보 툴
    server.tool(
      'get-movie-details',
      '특정 영화의 상세 정보를 가져옵니다. 줄거리, 출연진, 제작진, 평점, 박스오피스 등 자세한 정보를 제공합니다.',
      {
        movieId: z.number().positive()
      },
      async ({ movieId }) => {
        const movie = await tmdbService.getMovieDetails(movieId);
        
        const details = `# ${movie.title}

## 기본 정보
- 원제: ${movie.original_title}
- 개봉일: ${movie.release_date}
- 상영시간: ${movie.runtime}분
- 장르: ${movie.genres?.map((g: Genre) => g.name).join(', ') || '정보 없음'}
- 평점: ${movie.vote_average}/10 (${movie.vote_count}명 평가)
- 제작비: ${movie.budget ? `$${movie.budget.toLocaleString()}` : '정보 없음'}
- 박스오피스: ${movie.revenue ? `$${movie.revenue.toLocaleString()}` : '정보 없음'}

## 줄거리
${movie.overview || '줄거리 정보 없음'}

## 제작사
${movie.production_companies?.map((c: ProductionCompany) => c.name).join(', ') || '정보 없음'}

## 링크
- TMDB: https://www.themoviedb.org/movie/${movieId}
- IMDb: ${movie.imdb_id ? `https://www.imdb.com/title/${movie.imdb_id}` : '정보 없음'}`;

        return {
          content: [{ 
            type: 'text', 
            text: details 
          }]
        };
      }
    );

    // 👥 영화 출연진 및 제작진 정보 툴
    server.tool(
      'get-movie-credits',
      '영화의 출연진과 제작진 정보를 가져옵니다. 배우, 감독, 제작자 등의 정보를 제공합니다.',
      {
        movieId: z.number().positive()
      },
      async ({ movieId }) => {
        const credits = await tmdbService.getMovieCredits(movieId);
        
        const cast = credits.cast?.slice(0, 10).map((actor: any, idx: number) => 
          `${idx + 1}. ${actor.name} - ${actor.character}`
        ).join('\n') || '출연진 정보 없음';

        const crew = credits.crew?.filter((person: any) => ['Director', 'Producer', 'Writer'].includes(person.job))
          .slice(0, 10).map((person: any) => 
            `${person.name} - ${person.job}`
          ).join('\n') || '제작진 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 주요 출연진\n${cast}\n\n## 주요 제작진\n${crew}` 
          }]
        };
      }
    );

    // 🖼️ 영화 이미지 툴
    server.tool(
      'get-movie-images',
      '영화의 이미지를 가져옵니다. 포스터, 백드롭 등의 이미지 정보를 제공합니다.',
      {
        movieId: z.number().positive()
      },
      async ({ movieId }) => {
        const images = await tmdbService.getMovieImages(movieId);
        
        const posters = images.posters?.slice(0, 5).map((img: any, idx: number) => 
          `${idx + 1}. https://image.tmdb.org/t/p/w500${img.file_path}`
        ).join('\n') || '포스터 이미지 없음';

        const backdrops = images.backdrops?.slice(0, 5).map((img: any, idx: number) => 
          `${idx + 1}. https://image.tmdb.org/t/p/w1280${img.file_path}`
        ).join('\n') || '백드롭 이미지 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 포스터\n${posters}\n\n## 백드롭\n${backdrops}` 
          }]
        };
      }
    );

    // ▶️ 영화 비디오 툴
    server.tool(
      'get-movie-videos',
      '영화의 예고편, 티저, 클립 등의 비디오 정보를 가져옵니다.',
      {
        movieId: z.number().positive()
      },
      async ({ movieId }) => {
        const videos = await tmdbService.getMovieVideos(movieId);
        
        const videoList = videos.results?.slice(0, 10).map((video: any, idx: number) => 
          `${idx + 1}. ${video.name} (${video.type})
   - 사이트: ${video.site}
   - 링크: ${video.site === 'YouTube' ? `https://www.youtube.com/watch?v=${video.key}` : video.key}`
        ).join('\n') || '비디오 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 비디오\n${videoList}` 
          }]
        };
      }
    );

    // 🔁 추천 영화 툴
    server.tool(
      'get-movie-recommendations',
      '특정 영화를 기반으로 추천 영화 목록을 가져옵니다. 비슷한 취향의 영화를 제안합니다.',
      {
        movieId: z.number().positive(),
        page: z.number().positive().default(1)
      },
      async ({ movieId, page }) => {
        const response = await tmdbService.getMovieRecommendations(movieId, page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '추천 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 추천 영화\n${movies}` 
          }]
        };
      }
    );

    // 📎 비슷한 영화 툴
    server.tool(
      'get-similar-movies',
      '특정 영화와 비슷한 장르나 스타일의 영화 목록을 가져옵니다.',
      {
        movieId: z.number().positive(),
        page: z.number().positive().default(1)
      },
      async ({ movieId, page }) => {
        const response = await tmdbService.getSimilarMovies(movieId, page);
        
        const movies = response.results?.slice(0, 10).map((movie: Movie, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'})
   평점: ${movie.vote_average}/10`
        ).join('\n') || '비슷한 영화 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 비슷한 영화\n${movies}` 
          }]
        };
      }
    );

    // 👤 인물 검색 툴
    server.tool(
      'search-person',
      '배우, 감독, 제작자 등 영화 관련 인물을 검색합니다. 출연작, 필모그래피 정보를 제공합니다.',
      {
        query: z.string().min(1, '검색어를 입력해주세요.'),
        page: z.number().positive().default(1)
      },
      async ({ query, page }) => {
        const response = await tmdbService.searchPerson(query, page);
        
        if (!response.results || response.results.length === 0) {
          return {
            content: [{ 
              type: 'text', 
              text: `"${query}"에 대한 인물 검색 결과가 없습니다.` 
            }]
          };
        }

        const resultText = response.results.map((person: Person, idx: number) => {
          return `${idx + 1}. ${person.name}
   전문분야: ${person.known_for_department}
   인기도: ${person.popularity}
   TMDB ID: ${person.id}`;
        }).join('\n');

        return {
          content: [{ 
            type: 'text', 
            text: `"${query}" 인물 검색 결과 (총 ${response.total_results}개 중 ${page}페이지)\n\n${resultText}` 
          }]
        };
      }
    );

    // 🔎 인물 상세 정보 툴
    server.tool(
      'get-person-details',
      '특정 인물의 상세 정보를 가져옵니다. 생년월일, 출생지, 경력 등을 제공합니다.',
      {
        personId: z.number().positive()
      },
      async ({ personId }) => {
        const person = await tmdbService.getPersonDetails(personId);
        
        const details = `# ${person.name}

## 기본 정보
- 본명: ${person.original_name || person.name}
- 생년월일: ${person.birthday || '정보 없음'}
- 출생지: ${person.place_of_birth || '정보 없음'}
- 전문분야: ${person.known_for_department}
- 인기도: ${person.popularity}

## 약력
${person.biography || '약력 정보 없음'}

## 링크
- TMDB: https://www.themoviedb.org/person/${personId}
- IMDb: ${person.imdb_id ? `https://www.imdb.com/name/${person.imdb_id}` : '정보 없음'}`;

        return {
          content: [{ 
            type: 'text', 
            text: details 
          }]
        };
      }
    );

    // 🎬 인물 출연작 툴
    server.tool(
      'get-person-credits',
      '특정 인물의 출연작이나 참여작 목록을 가져옵니다. 배우의 필모그래피나 감독의 작품 목록을 제공합니다.',
      {
        personId: z.number().positive()
      },
      async ({ personId }) => {
        const credits = await tmdbService.getPersonCredits(personId);
        
        const cast = credits.cast?.slice(0, 10).map((movie: any, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'}) - ${movie.character}`
        ).join('\n') || '출연작 정보 없음';

        const crew = credits.crew?.slice(0, 10).map((movie: any, idx: number) => 
          `${idx + 1}. ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'}) - ${movie.job}`
        ).join('\n') || '참여작 정보 없음';

        return {
          content: [{ 
            type: 'text', 
            text: `## 출연작\n${cast}\n\n## 참여작\n${crew}` 
          }]
        };
      }
    );

    // 📺 TV 프로그램 검색 툴
    server.tool(
      'search-tv',
      'TV 드라마, 예능, 다큐멘터리 등을 검색합니다. 제목이나 키워드로 TV 프로그램을 찾을 수 있습니다.',
      {
        query: z.string().min(1, '검색어를 입력해주세요.'),
        page: z.number().positive().default(1)
      },
      async ({ query, page }) => {
        const response = await tmdbService.searchTV(query, page);
        
        if (!response.results || response.results.length === 0) {
          return {
            content: [{ 
              type: 'text', 
              text: `"${query}"에 대한 TV 프로그램 검색 결과가 없습니다.` 
            }]
          };
        }

        const resultText = response.results.map((tv: TVShow, idx: number) => {
          return `${idx + 1}. ${tv.name} (${tv.first_air_date?.split('-')[0] || '연도 미상'})
   평점: ${tv.vote_average}/10 (${tv.vote_count}명 평가)
   개요: ${tv.overview || '개요 없음'}
   TMDB ID: ${tv.id}`;
        }).join('\n');

        return {
          content: [{ 
            type: 'text', 
            text: `"${query}" TV 프로그램 검색 결과 (총 ${response.total_results}개 중 ${page}페이지)\n\n${resultText}` 
          }]
        };
      }
    );

    // 📺 TV 프로그램 상세 정보 툴
    server.tool(
      'get-tv-details',
      '특정 TV 프로그램의 상세 정보를 가져옵니다. 줄거리, 출연진, 방영 정보 등을 제공합니다.',
      {
        tvId: z.number().positive()
      },
      async ({ tvId }) => {
        const tv = await tmdbService.getTVDetails(tvId);
        
        const details = `# ${tv.name}

## 기본 정보
- 원제: ${tv.original_name}
- 첫 방영일: ${tv.first_air_date}
- 마지막 방영일: ${tv.last_air_date || '방영 중'}
- 시즌 수: ${tv.number_of_seasons || '정보 없음'}
- 에피소드 수: ${tv.number_of_episodes || '정보 없음'}
- 평점: ${tv.vote_average}/10 (${tv.vote_count}명 평가)
- 상태: ${tv.status || '정보 없음'}

## 줄거리
${tv.overview || '줄거리 정보 없음'}

## 링크
- TMDB: https://www.themoviedb.org/tv/${tvId}`;

        return {
          content: [{ 
            type: 'text', 
            text: details 
          }]
        };
      }
    );

    // 서버 실행
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('TMDB MCP 서버가 시작되었습니다.');
    
  } catch (error) {
    console.error('MCP 서버 실행 중 오류 발생:', error);
    process.exit(1);
  }
} 