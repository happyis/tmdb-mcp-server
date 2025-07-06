import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MovieSearchService } from '../services/movie-search.js';
import { loadConfig } from '../utils/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startWebServer(port: number = 3030) {
  try {
    // 설정 로드
    const config = loadConfig();
    
    // 영화 검색 서비스 초기화
    const movieSearchService = new MovieSearchService(
      config.tmdbApiKey,
      process.env.OPENAI_API_KEY || config.openaiApiKey
    );

    // Express 앱 생성
    const app = express();

    // 미들웨어 설정
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 정적 파일 서빙 (프론트엔드)
    app.use(express.static(path.join(__dirname, '../../public')));

    // API 라우트
    
    // 🔍 자연어 검색 API
    app.post('/api/search', async (req: any, res: any) => {
      try {
        const { query } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: '검색어가 필요합니다.' });
        }

        const result = await movieSearchService.searchByNaturalLanguage(query);
        res.json(result);
        
      } catch (error) {
        console.error('검색 오류:', error);
        res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
      }
    });

    // 📊 인기 영화 목록 API
    app.get('/api/movies/popular', async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const movies = await movieSearchService.getPopularMovies(page);
        res.json({ results: movies });
      } catch (error) {
        console.error('인기 영화 조회 오류:', error);
        res.status(500).json({ error: '인기 영화 조회 중 오류가 발생했습니다.' });
      }
    });

    // 🎥 현재 상영 중인 영화 API
    app.get('/api/movies/now-playing', async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const movies = await movieSearchService.getNowPlayingMovies(page);
        res.json({ results: movies });
      } catch (error) {
        console.error('현재 상영 영화 조회 오류:', error);
        res.status(500).json({ error: '현재 상영 영화 조회 중 오류가 발생했습니다.' });
      }
    });

    // ⭐ 평점 높은 영화 API
    app.get('/api/movies/top-rated', async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const movies = await movieSearchService.getTopRatedMovies(page);
        res.json({ results: movies });
      } catch (error) {
        console.error('평점 높은 영화 조회 오류:', error);
        res.status(500).json({ error: '평점 높은 영화 조회 중 오류가 발생했습니다.' });
      }
    });

    // 📅 개봉 예정 영화 API
    app.get('/api/movies/upcoming', async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const movies = await movieSearchService.getUpcomingMovies(page);
        res.json({ results: movies });
      } catch (error) {
        console.error('개봉 예정 영화 조회 오류:', error);
        res.status(500).json({ error: '개봉 예정 영화 조회 중 오류가 발생했습니다.' });
      }
    });

    // 🎬 영화 상세 정보 API
    app.get('/api/movies/:id', async (req, res) => {
      try {
        const movieId = parseInt(req.params.id);
        const movie = await movieSearchService.getMovieDetails(movieId);
        res.json(movie);
      } catch (error) {
        console.error('영화 상세 정보 조회 오류:', error);
        res.status(500).json({ error: '영화 상세 정보 조회 중 오류가 발생했습니다.' });
      }
    });

    // 👥 영화 출연진 정보 API
    app.get('/api/movies/:id/credits', async (req, res) => {
      try {
        const movieId = parseInt(req.params.id);
        const credits = await movieSearchService.getMovieCredits(movieId);
        res.json(credits);
      } catch (error) {
        console.error('영화 출연진 정보 조회 오류:', error);
        res.status(500).json({ error: '영화 출연진 정보 조회 중 오류가 발생했습니다.' });
      }
    });

    // 🖼️ 영화 이미지 API
    app.get('/api/movies/:id/images', async (req, res) => {
      try {
        const movieId = parseInt(req.params.id);
        const images = await movieSearchService.getMovieImages(movieId);
        res.json(images);
      } catch (error) {
        console.error('영화 이미지 조회 오류:', error);
        res.status(500).json({ error: '영화 이미지 조회 중 오류가 발생했습니다.' });
      }
    });

    // ▶️ 영화 비디오 API
    app.get('/api/movies/:id/videos', async (req, res) => {
      try {
        const movieId = parseInt(req.params.id);
        const videos = await movieSearchService.getMovieVideos(movieId);
        res.json(videos);
      } catch (error) {
        console.error('영화 비디오 조회 오류:', error);
        res.status(500).json({ error: '영화 비디오 조회 중 오류가 발생했습니다.' });
      }
    });

    // 메인 페이지 라우트
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });

    // 404 에러 핸들러
    app.use((req, res) => {
      res.status(404).json({ error: '페이지를 찾을 수 없습니다.' });
    });

    // 에러 핸들러
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('서버 오류:', err);
      res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
    });

    // 서버 시작
    const server = app.listen(port, () => {
      console.log(`🎬 TMDB 웹 서버가 http://localhost:${port} 에서 시작되었습니다.`);
      console.log(`🔍 자연어 검색: POST /api/search`);
      console.log(`📊 인기 영화: GET /api/movies/popular`);
      console.log(`🎥 현재 상영: GET /api/movies/now-playing`);
      console.log(`⭐ 평점 높은 영화: GET /api/movies/top-rated`);
      console.log(`📅 개봉 예정: GET /api/movies/upcoming`);
    });

    return server;

  } catch (error) {
    console.error('웹 서버 시작 오류:', error);
    throw error;
  }
} 