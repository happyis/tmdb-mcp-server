import OpenAI from 'openai';
import { loadConfig } from '../utils/config.js';

export interface SearchParameters {
  query: string;
  genre?: string;
  year?: number;
  minRating?: number;
  sortBy?: 'popularity' | 'rating' | 'release_date';
  type?: 'movie' | 'tv' | 'person';
  country?: string;
  keywords?: string[];
  season?: string;
  setting?: string;
}

export class GPTService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    // OpenAI API 키 설정
    const config = loadConfig();
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY || config.openaiApiKey;
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or add openaiApiKey to config.json');
    }

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  /**
   * 자연어 검색어를 구조화된 파라미터로 변환
   */
  async parseNaturalLanguageQuery(input: string): Promise<SearchParameters> {
    console.log(`🤖 GPT API 호출 시작: "${input}"`);
    
    try {
      const prompt = `
다음 자연어 검색어를 영화 검색에 적합한 구조화된 파라미터로 변환해주세요.

사용자 입력: "${input}"

다음 JSON 형식으로 응답해주세요:
{
  "query": "검색할 키워드",
  "genre": "장르 (액션, 코미디, 드라마, 공포, SF, 로맨스, 스릴러, 범죄, 판타지, 모험, 애니메이션, 다큐멘터리, 가족, 역사, 음악, 미스터리, 전쟁, 서부 중 하나)",
  "year": 연도 (숫자),
  "minRating": 최소 평점 (1-10),
  "sortBy": "정렬 기준 (popularity, rating, release_date 중 하나)",
  "type": "검색 유형 (movie, tv, person 중 하나)",
  "country": "국가 (한국, 미국, 일본, 중국 등)",
  "keywords": ["추가 검색 키워드 배열"],
  "season": "계절 (봄, 여름, 가을, 겨울 중 하나)",
  "setting": "배경 설정 (자연, 도시, 시골, 학교, 직장 등)"
}

규칙:
- 장르는 한국어로 입력된 경우 영어로 변환
- 연도가 언급되지 않으면 null
- 평점이 언급되지 않으면 null
- 정렬 기준이 명시되지 않으면 "popularity"
- 기본적으로 "movie" 타입으로 설정
- TV 프로그램이나 드라마가 언급되면 "tv"
- 배우나 감독이 언급되면 "person"

예시:
- "좀비 영화 추천해줘" → {"query": "zombie", "genre": "Horror", "type": "movie", "sortBy": "popularity"}
- "2023년 액션 영화" → {"query": "action", "genre": "Action", "year": 2023, "type": "movie"}
- "평점 높은 로맨스 영화" → {"query": "romance", "genre": "Romance", "minRating": 7, "sortBy": "rating", "type": "movie"}
- "톰 크루즈" → {"query": "Tom Cruise", "type": "person"}
- "한국 드라마" → {"query": "korean", "type": "tv", "country": "한국"}
- "한국 영화" → {"query": "korean", "type": "movie", "country": "한국"}
- "가을 배경이 나온 한국 영화" → {"query": "autumn korean", "type": "movie", "country": "한국", "season": "가을", "keywords": ["autumn", "fall"], "setting": "자연"}
- "봄에 나온 로맨스 영화" → {"query": "spring romance", "genre": "Romance", "season": "봄", "keywords": ["spring", "romance"]}
- "학교 배경의 한국 영화" → {"query": "school korean", "type": "movie", "country": "한국", "setting": "학교", "keywords": ["school", "student"]}

응답은 반드시 JSON 형식만 반환하세요.
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 영화 검색 파라미터 변환 전문가입니다. 자연어 입력을 구조화된 검색 파라미터로 변환합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('GPT 응답을 받지 못했습니다.');
      }

      // JSON 파싱
      const parsed = JSON.parse(content);
      
      // 기본값 설정
      const searchParams: SearchParameters = {
        query: parsed.query || input,
        genre: parsed.genre || undefined,
        year: parsed.year || undefined,
        minRating: parsed.minRating || undefined,
        sortBy: parsed.sortBy || 'popularity',
        type: parsed.type || 'movie',
        country: parsed.country || undefined,
        keywords: parsed.keywords || undefined,
        season: parsed.season || undefined,
        setting: parsed.setting || undefined
      };

      return searchParams;

    } catch (error) {
      console.error('GPT 파싱 오류:', error);
      // 오류 시 기본 파라미터 반환
      return {
        query: input,
        sortBy: 'popularity',
        type: 'movie'
      };
    }
  }

  /**
   * 영화 추천 설명 생성
   */
  async generateMovieRecommendation(movies: any[], originalQuery: string): Promise<string> {
    try {
      const movieList = movies.slice(0, 5).map(movie => 
        `- ${movie.title} (${movie.release_date?.split('-')[0] || '연도 미상'}): ${movie.overview || '설명 없음'}`
      ).join('\n');

      const prompt = `
사용자가 "${originalQuery}"라고 검색했을 때 다음 영화들을 추천받았습니다:

${movieList}

이 영화들을 바탕으로 자연스럽고 친근한 톤으로 추천 설명을 작성해주세요.
- 왜 이 영화들이 사용자의 검색어에 적합한지 설명
- 각 영화의 특징을 간략히 소개
- 추천 이유 포함
- 한국어로 작성
- 200자 이내로 작성

응답 형식: 추천 설명 텍스트만 반환 (JSON 형식 아님)
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '당신은 친근하고 전문적인 영화 추천 전문가입니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0]?.message?.content || '추천 영화를 찾았습니다!';

    } catch (error) {
      console.error('추천 설명 생성 오류:', error);
      return `"${originalQuery}" 검색 결과를 찾았습니다!`;
    }
  }

  /**
   * 장르 이름을 한국어에서 영어로 변환
   */
  private translateGenreToEnglish(koreanGenre: string): string {
    const genreMap: { [key: string]: string } = {
      '액션': 'Action',
      '모험': 'Adventure',
      '애니메이션': 'Animation',
      '코미디': 'Comedy',
      '범죄': 'Crime',
      '다큐멘터리': 'Documentary',
      '드라마': 'Drama',
      '가족': 'Family',
      '판타지': 'Fantasy',
      '역사': 'History',
      '공포': 'Horror',
      '음악': 'Music',
      '미스터리': 'Mystery',
      '로맨스': 'Romance',
      'SF': 'Science Fiction',
      '스릴러': 'Thriller',
      '전쟁': 'War',
      '서부': 'Western'
    };

    return genreMap[koreanGenre] || koreanGenre;
  }
} 