// TMDB API 기본 설정 타입
export interface TMDBConfig {
  tmdbApiKey: string;
}

// 기본 응답 타입
export interface TMDBBaseResponse {
  page: number;
  total_pages: number;
  total_results: number;
}

// 영화 타입
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  video: boolean;
  original_language: string;
  genre_ids: number[];
  // 상세 정보에만 포함되는 필드들
  runtime?: number;
  budget?: number;
  revenue?: number;
  homepage?: string;
  imdb_id?: string;
  status?: string;
  tagline?: string;
  genres?: Genre[];
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  spoken_languages?: SpokenLanguage[];
  belongs_to_collection?: Collection | null;
}

// 장르 타입
export interface Genre {
  id: number;
  name: string;
}

// 제작사 타입
export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

// 제작 국가 타입
export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

// 언어 타입
export interface SpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name: string;
}

// 컬렉션 타입
export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

// 인물 타입
export interface Person {
  id: number;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  adult: boolean;
  known_for_department: string;
  gender: number; // 0: 정보 없음, 1: 여성, 2: 남성, 3: 기타
  // 상세 정보에만 포함되는 필드들
  also_known_as?: string[];
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  homepage?: string | null;
  imdb_id?: string | null;
}

// 캐스트 타입
export interface Cast {
  id: number;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
}

// 제작진 타입
export interface Crew {
  id: number;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
  adult: boolean;
  gender: number;
  known_for_department: string;
}

// TV 프로그램 타입
export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  original_language: string;
  genre_ids: number[];
  origin_country: string[];
  // 상세 정보에만 포함되는 필드들
  created_by?: Creator[];
  episode_run_time?: number[];
  genres?: Genre[];
  homepage?: string;
  in_production?: boolean;
  languages?: string[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  seasons?: Season[];
  spoken_languages?: SpokenLanguage[];
  status?: string;
  tagline?: string;
  type?: string;
}

// TV 프로그램 제작자 타입
export interface Creator {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  credit_id: string;
  gender: number;
}

// 시즌 타입
export interface Season {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average: number;
}

// 이미지 타입
export interface TMDBImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

// 비디오 타입
export interface TMDBVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  size: number;
  type: string;
}

// API 응답 타입들
export interface MovieSearchResponse extends TMDBBaseResponse {
  results: Movie[];
}

export interface MovieDetailsResponse extends Movie {}

export interface MovieCreditsResponse {
  id: number;
  cast: Cast[];
  crew: Crew[];
}

export interface MovieImagesResponse {
  id: number;
  backdrops: TMDBImage[];
  logos: TMDBImage[];
  posters: TMDBImage[];
}

export interface MovieVideosResponse {
  id: number;
  results: TMDBVideo[];
}

export interface PersonSearchResponse extends TMDBBaseResponse {
  results: Person[];
}

export interface PersonDetailsResponse extends Person {}

export interface PersonCreditsResponse {
  id: number;
  cast: MovieCredit[];
  crew: MovieCredit[];
}

export interface MovieCredit {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  adult: boolean;
  video: boolean;
  original_language: string;
  genre_ids: number[];
  character?: string; // cast에만 있음
  job?: string; // crew에만 있음
  department?: string; // crew에만 있음
  credit_id: string;
  order?: number; // cast에만 있음
}

export interface TVSearchResponse extends TMDBBaseResponse {
  results: TVShow[];
}

export interface TVDetailsResponse extends TVShow {}

// 에러 타입
export interface TMDBError {
  status_code: number;
  status_message: string;
  success: boolean;
} 