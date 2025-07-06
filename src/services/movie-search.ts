import { GPTService, SearchParameters } from './gpt.js';
import { TMDBService } from './tmdb.js';
import { Movie, TVShow, Person } from '../types.js';

export interface SearchResult {
  type: 'movie' | 'tv' | 'person';
  results: Movie[] | TVShow[] | Person[];
  recommendation?: string;
  searchParams: SearchParameters;
  originalQuery: string;
}

export class MovieSearchService {
  private gptService: GPTService;
  private tmdbService: TMDBService;

  constructor(tmdbApiKey: string, openaiApiKey?: string) {
    this.tmdbService = new TMDBService(tmdbApiKey);
    this.gptService = new GPTService(openaiApiKey);
  }

  /**
   * 자연어 검색 실행
   */
  async searchByNaturalLanguage(input: string): Promise<SearchResult> {
    console.log(`🔍 자연어 검색 시작: "${input}"`);
    
    try {
      // 1. GPT로 자연어 파싱
      console.log('📝 GPT 파싱 시작...');
      const searchParams = await this.gptService.parseNaturalLanguageQuery(input);
      console.log('✅ GPT 파싱 완료:', searchParams);
      
      // 2. TMDB API 호출
      console.log('🎬 TMDB 검색 시작...');
      let results: Movie[] | TVShow[] | Person[] = [];
      
      switch (searchParams.type) {
        case 'movie':
          results = await this.searchMovies(searchParams);
          break;
        case 'tv':
          results = await this.searchTV(searchParams);
          break;
        case 'person':
          results = await this.searchPerson(searchParams);
          break;
        default:
          results = await this.searchMovies(searchParams);
      }
      
      console.log(`✅ TMDB 검색 완료: ${results.length}개 결과`);

      // 3. GPT로 추천 설명 생성 (영화인 경우에만)
      let recommendation: string | undefined;
      if (searchParams.type === 'movie' && results.length > 0) {
        try {
          console.log('💡 추천 설명 생성 시작...');
          recommendation = await this.gptService.generateMovieRecommendation(results as Movie[], input);
          console.log('✅ 추천 설명 생성 완료');
        } catch (recError) {
          console.error('⚠️ 추천 설명 생성 실패:', recError);
          recommendation = `"${input}" 검색 결과를 찾았습니다!`;
        }
      }

      return {
        type: searchParams.type || 'movie',
        results,
        recommendation,
        searchParams,
        originalQuery: input
      };

    } catch (error) {
      console.error('❌ 자연어 검색 오류:', error);
      
      // 오류 시 기본 영화 검색 실행
      console.log('🔄 기본 검색으로 폴백...');
      try {
        const fallbackResults = await this.tmdbService.searchMovies(input);
        console.log(`✅ 기본 검색 완료: ${fallbackResults.results?.length || 0}개 결과`);
        
        return {
          type: 'movie',
          results: fallbackResults.results || [],
          searchParams: { query: input, type: 'movie', sortBy: 'popularity' },
          originalQuery: input
        };
      } catch (fallbackError) {
        console.error('❌ 기본 검색도 실패:', fallbackError);
        return {
          type: 'movie',
          results: [],
          searchParams: { query: input, type: 'movie', sortBy: 'popularity' },
          originalQuery: input
        };
      }
    }
  }

  /**
   * 영화 검색 (고급 필터링 적용)
   */
  private async searchMovies(params: SearchParameters): Promise<Movie[]> {
    let movies: Movie[] = [];
    
    // discover API 사용 조건 확인
    let usedDiscoverAPI = false;
    
    // 한국 영화 전용 검색 먼저 시도
    if (params.country === '한국') {
      try {
        console.log('🇰🇷 한국 영화 discover 검색 시도...');
        const discoverOptions = {
          year: params.year,
          genre: params.genre ? this.getGenreId(params.genre) : undefined,
          sortBy: params.sortBy === 'rating' ? 'vote_average.desc' : 
                 params.sortBy === 'release_date' ? 'release_date.desc' : 
                 'popularity.desc'
        };
        console.log('📋 discover 옵션:', discoverOptions);
        
        const koreanResponse = await this.tmdbService.discoverKoreanMovies(discoverOptions);
        console.log(`📊 한국 영화 discover 결과: ${koreanResponse.results?.length || 0}개`);
        
        if (koreanResponse.results && koreanResponse.results.length > 0) {
          movies = koreanResponse.results;
          usedDiscoverAPI = true;
          console.log('✅ 한국 영화 discover 성공!');
        } else {
          console.log('⚠️ 한국 영화 discover 결과 없음, 일반 검색으로 진행...');
        }
      } catch (error) {
        console.error('❌ 한국 영화 discover 검색 실패:', error);
      }
    }
    
    // 연도 + 장르 조합 discover 검색
    if (!usedDiscoverAPI && params.year && params.genre) {
      try {
        console.log('🎬 연도 + 장르 discover 검색 시도...');
        const discoverOptions = {
          year: params.year,
          genre: this.getGenreId(params.genre),
          sortBy: params.sortBy === 'rating' ? 'vote_average.desc' : 
                 params.sortBy === 'release_date' ? 'release_date.desc' : 
                 'popularity.desc'
        };
        console.log('📋 discover 옵션:', discoverOptions);
        
        // TMDBService에 일반 discover API 추가 필요
        const response = await this.tmdbService.discoverMovies(discoverOptions);
        console.log(`📊 연도 + 장르 discover 결과: ${response.results?.length || 0}개`);
        
        if (response.results && response.results.length > 0) {
          movies = response.results;
          usedDiscoverAPI = true;
          console.log('✅ 연도 + 장르 discover 성공!');
        } else {
          console.log('⚠️ 연도 + 장르 discover 결과 없음, 일반 검색으로 진행...');
        }
      } catch (error) {
        console.error('❌ 연도 + 장르 discover 검색 실패:', error);
      }
    }
    
    // discover로 결과가 없으면 일반 검색 전략 시도
    if (movies.length === 0) {
      const searchStrategies = this.buildSearchStrategies(params);
      
      for (const strategy of searchStrategies) {
        try {
          console.log(`🔍 검색 전략 시도: ${strategy.query} (${strategy.description})`);
          const response = await this.tmdbService.searchMovies(strategy.query);
          const foundMovies = response.results || [];
          console.log(`📊 "${strategy.query}" 검색 결과: ${foundMovies.length}개`);
          
          if (foundMovies.length > 0) {
            movies = foundMovies;
            console.log(`✅ "${strategy.query}" 검색 성공!`);
            break; // 성공하면 다음 전략 시도하지 않음
          }
        } catch (error) {
          console.error(`❌ 검색 전략 실패: ${strategy.query}`, error);
          continue; // 다음 전략 시도
        }
      }
    }

    // 한국 영화 필터링 (discover API를 사용하지 않은 경우에만)
    if ((params.country === '한국' || params.country === 'korea' || params.country === 'korean') && movies.length > 0 && !usedDiscoverAPI) {
      console.log('🔍 한국 영화 필터링 시작...');
      const beforeCount = movies.length;
      movies = this.filterKoreanMovies(movies);
      console.log(`📊 한국 영화 필터링: ${beforeCount}개 → ${movies.length}개`);
    } else if (usedDiscoverAPI) {
      console.log('✅ discover API로 이미 한국 영화만 가져옴, 추가 필터링 생략');
    }

    // 장르 필터링 - discover에서 이미 장르 필터링 했으면 스킵
    if (params.genre && !(params.country === '한국' && movies.length > 0)) {
      console.log(`🎭 장르 필터링 시작: ${params.genre}`);
      const genreId = this.getGenreId(params.genre);
      console.log(`📋 장르 ID: ${genreId}`);
      const beforeCount = movies.length;
      
      movies = movies.filter(movie => {
        const hasGenre = movie.genre_ids?.some(id => id === genreId);
        if (hasGenre) {
          console.log(`✅ 장르 매치: ${movie.title} (${movie.genre_ids})`);
        }
        return hasGenre;
      });
      
      console.log(`📊 장르 필터링: ${beforeCount}개 → ${movies.length}개`);
    }

    // 연도 필터링
    if (params.year) {
      console.log(`📅 연도 필터링 시작: ${params.year}년`);
      const beforeCount = movies.length;
      movies = movies.filter(movie => {
        const movieYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 0;
        const match = movieYear === params.year;
        if (match) {
          console.log(`✅ 연도 매치: ${movie.title} (${movie.release_date})`);
        } else {
          console.log(`❌ 연도 불일치: ${movie.title} (${movie.release_date} → ${movieYear}년, 목표: ${params.year}년)`);
        }
        return match;
      });
      console.log(`📊 연도 필터링: ${beforeCount}개 → ${movies.length}개`);
    }

    // 평점 필터링
    if (params.minRating) {
      movies = movies.filter(movie => movie.vote_average >= params.minRating!);
    }

    // 계절/설정 기반 키워드 필터링 (discover API 사용 시 한국 키워드 필터링 제외)
    if (params.season || params.setting || (params.keywords && params.keywords.length > 0)) {
      // discover API로 한국 영화를 가져온 경우 "korean" 키워드 필터링 제외
      if (usedDiscoverAPI && params.keywords && params.keywords.includes('korean')) {
        const filteredKeywords = params.keywords.filter(keyword => keyword !== 'korean');
        if (filteredKeywords.length > 0 || params.season || params.setting) {
          const tempParams = { ...params, keywords: filteredKeywords };
          movies = this.filterBySemanticMatch(movies, tempParams);
        }
      } else {
        movies = this.filterBySemanticMatch(movies, params);
      }
    }

    // 정렬
    switch (params.sortBy) {
      case 'rating':
        movies.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case 'release_date':
        movies.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
        break;
      case 'popularity':
      default:
        movies.sort((a, b) => b.popularity - a.popularity);
        break;
    }

    return movies.slice(0, 20); // 최대 20개 결과
  }

  /**
   * 검색 전략 구성
   */
  private buildSearchStrategies(params: SearchParameters): { query: string; description: string }[] {
    const strategies: { query: string; description: string }[] = [];
    
    // 기본 검색어
    strategies.push({
      query: params.query,
      description: '기본 검색어'
    });

    // 애니메이션 특별 검색어 추가
    if (params.genre === 'Animation') {
      strategies.push(
        { query: 'animation', description: '애니메이션 영어 검색' },
        { query: 'animated', description: '애니메이티드 검색' },
        { query: 'cartoon', description: '카툰 검색' },
        { query: 'anime', description: '아니메 검색' }
      );
    }

    // 키워드 기반 검색
    if (params.keywords && params.keywords.length > 0) {
      for (const keyword of params.keywords) {
        strategies.push({
          query: keyword,
          description: `키워드: ${keyword}`
        });
      }
    }

    // 한국 영화 특별 검색 - discover API 사용
    if (params.country === '한국') {
      // discover API를 통한 한국 영화 검색을 별도로 시도
      strategies.push(
        { query: 'korean movie', description: '한국 영화 영어 검색' },
        { query: '한국영화', description: '한국영화 한글 검색' },
        { query: 'korea film', description: '한국 필름 검색' }
      );
    }

    // 계절 기반 검색
    if (params.season) {
      const seasonKeywords = this.getSeasonKeywords(params.season);
      seasonKeywords.forEach(keyword => {
        strategies.push({
          query: `${keyword} ${params.country === '한국' ? 'korean' : ''}`.trim(),
          description: `계절 키워드: ${keyword}`
        });
      });
    }

    // 설정 기반 검색
    if (params.setting) {
      const settingKeywords = this.getSettingKeywords(params.setting);
      settingKeywords.forEach(keyword => {
        strategies.push({
          query: `${keyword} ${params.country === '한국' ? 'korean' : ''}`.trim(),
          description: `설정 키워드: ${keyword}`
        });
      });
    }

    return strategies;
  }

  /**
   * 한국 영화 필터링
   */
  private filterKoreanMovies(movies: Movie[]): Movie[] {
    return movies.filter(movie => {
      const title = movie.title?.toLowerCase() || '';
      const originalTitle = movie.original_title?.toLowerCase() || '';
      const overview = movie.overview?.toLowerCase() || '';
      
      // 한국 관련 키워드 확인
      const koreanKeywords = ['korea', 'korean', '한국', 'south korea'];
      const hasKoreanKeyword = koreanKeywords.some(keyword => 
        title.includes(keyword) || 
        originalTitle.includes(keyword) || 
        overview.includes(keyword)
      );
      
      // 한국어 제목인 경우 (한글 포함)
      const hasKoreanCharacters = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title) || /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(originalTitle);
      
      return hasKoreanKeyword || hasKoreanCharacters;
    });
  }

  /**
   * 의미적 매칭 필터링
   */
  private filterBySemanticMatch(movies: Movie[], params: SearchParameters): Movie[] {
    return movies.filter(movie => {
      const title = movie.title?.toLowerCase() || '';
      const originalTitle = movie.original_title?.toLowerCase() || '';
      const overview = movie.overview?.toLowerCase() || '';
      const fullText = `${title} ${originalTitle} ${overview}`;
      
      let score = 0;
      
      // 계절 키워드 매칭
      if (params.season) {
        const seasonKeywords = this.getSeasonKeywords(params.season);
        seasonKeywords.forEach(keyword => {
          if (fullText.includes(keyword.toLowerCase())) {
            score += 2;
          }
        });
      }
      
      // 설정 키워드 매칭
      if (params.setting) {
        const settingKeywords = this.getSettingKeywords(params.setting);
        settingKeywords.forEach(keyword => {
          if (fullText.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
      }
      
      // 추가 키워드 매칭
      if (params.keywords) {
        params.keywords.forEach(keyword => {
          if (fullText.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
      }
      
      return score > 0; // 하나라도 매칭되면 포함
    });
  }

  /**
   * 계절 키워드 생성
   */
  private getSeasonKeywords(season: string): string[] {
    const seasonMap: { [key: string]: string[] } = {
      '봄': ['spring', '벚꽃', 'cherry blossom', '새싹', 'bloom'],
      '여름': ['summer', '바다', 'beach', 'vacation', 'hot'],
      '가을': ['autumn', 'fall', '단풍', 'maple', 'harvest', '낙엽'],
      '겨울': ['winter', '눈', 'snow', 'cold', 'christmas', '스키']
    };
    
    return seasonMap[season] || [season];
  }

  /**
   * 설정 키워드 생성
   */
  private getSettingKeywords(setting: string): string[] {
    const settingMap: { [key: string]: string[] } = {
      '자연': ['nature', 'forest', 'mountain', 'river', 'outdoor'],
      '도시': ['city', 'urban', 'building', 'street', 'downtown'],
      '시골': ['rural', 'countryside', 'village', 'farm', 'field'],
      '학교': ['school', 'student', 'teacher', 'classroom', 'campus'],
      '직장': ['office', 'work', 'company', 'business', 'corporate']
    };
    
    return settingMap[setting] || [setting];
  }

  /**
   * TV 프로그램 검색
   */
  private async searchTV(params: SearchParameters): Promise<TVShow[]> {
    const response = await this.tmdbService.searchTV(params.query);
    let tvShows = response.results || [];

    // 연도 필터링
    if (params.year) {
      tvShows = tvShows.filter(tv => {
        const tvYear = tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 0;
        return tvYear === params.year;
      });
    }

    // 평점 필터링
    if (params.minRating) {
      tvShows = tvShows.filter(tv => tv.vote_average >= params.minRating!);
    }

    // 정렬
    switch (params.sortBy) {
      case 'rating':
        tvShows.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case 'release_date':
        tvShows.sort((a, b) => new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime());
        break;
      case 'popularity':
      default:
        tvShows.sort((a, b) => b.popularity - a.popularity);
        break;
    }

    return tvShows.slice(0, 20); // 최대 20개 결과
  }

  /**
   * 인물 검색
   */
  private async searchPerson(params: SearchParameters): Promise<Person[]> {
    const response = await this.tmdbService.searchPerson(params.query);
    let people = response.results || [];

    // 인기도 정렬
    people.sort((a, b) => b.popularity - a.popularity);

    return people.slice(0, 20); // 최대 20개 결과
  }

  /**
   * 장르 이름을 장르 ID로 변환
   */
  private getGenreId(genreName: string): number {
    const genreMap: { [key: string]: number } = {
      'Action': 28,
      'Adventure': 12,
      'Animation': 16,
      'Comedy': 35,
      'Crime': 80,
      'Documentary': 99,
      'Drama': 18,
      'Family': 10751,
      'Fantasy': 14,
      'History': 36,
      'Horror': 27,
      'Music': 10402,
      'Mystery': 9648,
      'Romance': 10749,
      'Science Fiction': 878,
      'Thriller': 53,
      'War': 10752,
      'Western': 37
    };

    return genreMap[genreName] || 0;
  }

  /**
   * 인기 영화 목록 조회
   */
  async getPopularMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.tmdbService.getPopularMovies(page);
    return response.results || [];
  }

  /**
   * 현재 상영 중인 영화 목록 조회
   */
  async getNowPlayingMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.tmdbService.getNowPlayingMovies(page);
    return response.results || [];
  }

  /**
   * 평점 높은 영화 목록 조회
   */
  async getTopRatedMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.tmdbService.getTopRatedMovies(page);
    return response.results || [];
  }

  /**
   * 개봉 예정 영화 목록 조회
   */
  async getUpcomingMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.tmdbService.getUpcomingMovies(page);
    return response.results || [];
  }

  /**
   * 영화 상세 정보 조회
   */
  async getMovieDetails(movieId: number) {
    return await this.tmdbService.getMovieDetails(movieId);
  }

  /**
   * 영화 출연진 정보 조회
   */
  async getMovieCredits(movieId: number) {
    return await this.tmdbService.getMovieCredits(movieId);
  }

  /**
   * 영화 이미지 조회
   */
  async getMovieImages(movieId: number) {
    return await this.tmdbService.getMovieImages(movieId);
  }

  /**
   * 영화 비디오 조회
   */
  async getMovieVideos(movieId: number) {
    return await this.tmdbService.getMovieVideos(movieId);
  }
} 