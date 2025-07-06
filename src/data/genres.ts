// TMDB 장르 정보
export interface TMDBGenre {
  id: number;
  name: string;
  nameKo: string; // 한국어 이름
}

// 영화 장르 목록 (TMDB API 기준)
export const movieGenres: TMDBGenre[] = [
  { id: 28, name: "Action", nameKo: "액션" },
  { id: 12, name: "Adventure", nameKo: "모험" },
  { id: 16, name: "Animation", nameKo: "애니메이션" },
  { id: 35, name: "Comedy", nameKo: "코미디" },
  { id: 80, name: "Crime", nameKo: "범죄" },
  { id: 99, name: "Documentary", nameKo: "다큐멘터리" },
  { id: 18, name: "Drama", nameKo: "드라마" },
  { id: 10751, name: "Family", nameKo: "가족" },
  { id: 14, name: "Fantasy", nameKo: "판타지" },
  { id: 36, name: "History", nameKo: "역사" },
  { id: 27, name: "Horror", nameKo: "공포" },
  { id: 10402, name: "Music", nameKo: "음악" },
  { id: 9648, name: "Mystery", nameKo: "미스터리" },
  { id: 10749, name: "Romance", nameKo: "로맨스" },
  { id: 878, name: "Science Fiction", nameKo: "SF" },
  { id: 10770, name: "TV Movie", nameKo: "TV 영화" },
  { id: 53, name: "Thriller", nameKo: "스릴러" },
  { id: 10752, name: "War", nameKo: "전쟁" },
  { id: 37, name: "Western", nameKo: "서부" }
];

// TV 프로그램 장르 목록 (TMDB API 기준)
export const tvGenres: TMDBGenre[] = [
  { id: 10759, name: "Action & Adventure", nameKo: "액션 & 모험" },
  { id: 16, name: "Animation", nameKo: "애니메이션" },
  { id: 35, name: "Comedy", nameKo: "코미디" },
  { id: 80, name: "Crime", nameKo: "범죄" },
  { id: 99, name: "Documentary", nameKo: "다큐멘터리" },
  { id: 18, name: "Drama", nameKo: "드라마" },
  { id: 10751, name: "Family", nameKo: "가족" },
  { id: 10762, name: "Kids", nameKo: "어린이" },
  { id: 9648, name: "Mystery", nameKo: "미스터리" },
  { id: 10763, name: "News", nameKo: "뉴스" },
  { id: 10764, name: "Reality", nameKo: "리얼리티" },
  { id: 10765, name: "Sci-Fi & Fantasy", nameKo: "SF & 판타지" },
  { id: 10766, name: "Soap", nameKo: "연속극" },
  { id: 10767, name: "Talk", nameKo: "토크쇼" },
  { id: 10768, name: "War & Politics", nameKo: "전쟁 & 정치" },
  { id: 37, name: "Western", nameKo: "서부" }
];

// 전체 장르 목록 (중복 제거)
export const allGenres: TMDBGenre[] = [
  ...movieGenres,
  ...tvGenres.filter(tvGenre => !movieGenres.some(movieGenre => movieGenre.id === tvGenre.id))
];

// 장르 ID로 장르 정보 찾기
export const getGenreById = (id: number): TMDBGenre | undefined => {
  return allGenres.find(genre => genre.id === id);
};

// 장르 이름으로 장르 정보 찾기
export const getGenreByName = (name: string): TMDBGenre | undefined => {
  return allGenres.find(genre => 
    genre.name.toLowerCase() === name.toLowerCase() || 
    genre.nameKo === name
  );
};

// 장르 ID 배열을 한국어 이름 배열로 변환
export const getGenreNamesKo = (genreIds: number[]): string[] => {
  return genreIds
    .map(id => getGenreById(id)?.nameKo)
    .filter(name => name !== undefined) as string[];
};

// 장르 ID 배열을 영어 이름 배열로 변환
export const getGenreNamesEn = (genreIds: number[]): string[] => {
  return genreIds
    .map(id => getGenreById(id)?.name)
    .filter(name => name !== undefined) as string[];
};

// 인기 장르 (한국 기준)
export const popularGenres: TMDBGenre[] = [
  { id: 18, name: "Drama", nameKo: "드라마" },
  { id: 35, name: "Comedy", nameKo: "코미디" },
  { id: 28, name: "Action", nameKo: "액션" },
  { id: 10749, name: "Romance", nameKo: "로맨스" },
  { id: 53, name: "Thriller", nameKo: "스릴러" },
  { id: 80, name: "Crime", nameKo: "범죄" },
  { id: 14, name: "Fantasy", nameKo: "판타지" },
  { id: 878, name: "Science Fiction", nameKo: "SF" },
  { id: 27, name: "Horror", nameKo: "공포" },
  { id: 16, name: "Animation", nameKo: "애니메이션" }
]; 