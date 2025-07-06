import axios from 'axios';
import {
  MovieSearchResponse,
  MovieDetailsResponse,
  MovieCreditsResponse,
  MovieImagesResponse,
  MovieVideosResponse,
  PersonSearchResponse,
  PersonDetailsResponse,
  PersonCreditsResponse,
  TVSearchResponse,
  TVDetailsResponse
} from '../types.js';

// TMDB API 클래스
export class TMDBService {
  private baseURL = 'https://api.themoviedb.org/3';
  private apiKey: string;
  private tmdb: any;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.tmdb = axios.create({
      baseURL: this.baseURL,
      params: {
        api_key: this.apiKey,
        language: 'ko-KR',
      },
    });
  }

  // 🔍 영화 제목/키워드로 검색
  async searchMovies(query: string, page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get('/search/movie', { params: { query, page } });
    return res.data;
  }

  // 🎬 영화 상세정보 조회
  async getMovieDetails(movieId: number): Promise<MovieDetailsResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}`);
    return res.data;
  }

  // 👥 영화의 배우, 감독 등 크레딧 정보
  async getMovieCredits(movieId: number): Promise<MovieCreditsResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}/credits`);
    return res.data;
  }

  // 🖼️ 영화 이미지 (포스터, 백드롭 등)
  async getMovieImages(movieId: number): Promise<MovieImagesResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}/images`);
    return res.data;
  }

  // ▶️ 예고편, 티저 영상
  async getMovieVideos(movieId: number): Promise<MovieVideosResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}/videos`);
    return res.data;
  }

  // 🔁 추천 영화 목록
  async getMovieRecommendations(movieId: number, page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}/recommendations`, { params: { page } });
    return res.data;
  }

  // 📎 비슷한 장르/스타일 영화 목록
  async getSimilarMovies(movieId: number, page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get(`/movie/${movieId}/similar`, { params: { page } });
    return res.data;
  }

  // 🎥 현재 극장에서 상영 중인 영화
  async getNowPlayingMovies(page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get('/movie/now_playing', { params: { page } });
    return res.data;
  }

  // 📅 개봉 예정 영화 목록
  async getUpcomingMovies(page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get('/movie/upcoming', { params: { page } });
    return res.data;
  }

  // 📊 인기 있는 영화 목록
  async getPopularMovies(page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get('/movie/popular', { params: { page } });
    return res.data;
  }

  // ⭐ 평점이 높은 영화 목록
  async getTopRatedMovies(page = 1): Promise<MovieSearchResponse> {
    const res = await this.tmdb.get('/movie/top_rated', { params: { page } });
    return res.data;
  }

  // 👤 배우/감독 등 인물 검색
  async searchPerson(query: string, page = 1): Promise<PersonSearchResponse> {
    const res = await this.tmdb.get('/search/person', { params: { query, page } });
    return res.data;
  }

  // 🔎 인물 상세 정보
  async getPersonDetails(personId: number): Promise<PersonDetailsResponse> {
    const res = await this.tmdb.get(`/person/${personId}`);
    return res.data;
  }

  // 🎬 출연/감독한 영화 목록
  async getPersonCredits(personId: number): Promise<PersonCreditsResponse> {
    const res = await this.tmdb.get(`/person/${personId}/movie_credits`);
    return res.data;
  }

  // 📺 TV 드라마/예능 검색
  async searchTV(query: string, page = 1): Promise<TVSearchResponse> {
    const res = await this.tmdb.get('/search/tv', { params: { query, page } });
    return res.data;
  }

  // TV 프로그램 상세정보
  async getTVDetails(tvId: number): Promise<TVDetailsResponse> {
    const res = await this.tmdb.get(`/tv/${tvId}`);
    return res.data;
  }
} 