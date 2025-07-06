// 전역 변수
let currentSection = 'search';
let searchHistory = [];
let favoritesData = [];

// localStorage 데이터 안전하게 로드
function loadLocalStorageData() {
    try {
        const savedHistory = localStorage.getItem('searchHistory');
        searchHistory = savedHistory ? JSON.parse(savedHistory) : [];
        
        // 검색 기록이 배열이 아닌 경우 초기화
        if (!Array.isArray(searchHistory)) {
            searchHistory = [];
            localStorage.removeItem('searchHistory');
        }
    } catch (error) {
        console.error('검색 기록 로드 오류:', error);
        searchHistory = [];
        localStorage.removeItem('searchHistory');
    }
    
    try {
        const savedFavorites = localStorage.getItem('favorites');
        favoritesData = savedFavorites ? JSON.parse(savedFavorites) : [];
        
        // 찜 목록이 배열이 아닌 경우 초기화
        if (!Array.isArray(favoritesData)) {
            favoritesData = [];
            localStorage.removeItem('favorites');
        }
        
        // 찜 목록 데이터 유효성 검사
        favoritesData = favoritesData.filter(movie => 
            movie && typeof movie === 'object' && 
            movie.id && movie.title
        );
        
        // 유효하지 않은 데이터가 있었다면 정리된 데이터로 저장
        if (savedFavorites && favoritesData.length !== JSON.parse(savedFavorites).length) {
            localStorage.setItem('favorites', JSON.stringify(favoritesData));
        }
    } catch (error) {
        console.error('찜 목록 로드 오류:', error);
        favoritesData = [];
        localStorage.removeItem('favorites');
    }
}

// DOM 요소
const elements = {
    navBtns: document.querySelectorAll('.nav-btn'),
    sections: document.querySelectorAll('.section'),
    searchForm: document.getElementById('search-form'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchResults: document.getElementById('search-results'),
    historyTags: document.getElementById('history-tags'),
    suggestionTags: document.querySelectorAll('.suggestion-tag'),
    popularMovies: document.getElementById('popular-movies'),
    nowPlayingMovies: document.getElementById('now-playing-movies'),
    topRatedMovies: document.getElementById('top-rated-movies'),
    favoritesMovies: document.getElementById('favorites-movies'),
    emptyFavorites: document.getElementById('empty-favorites'),
    movieModal: document.getElementById('movie-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close'),
    loading: document.getElementById('loading'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// API 기본 설정
const API_BASE = '/api';

// 유틸리티 함수
const utils = {
    // API 호출
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    },

    // 로딩 표시/숨김
    showLoading() {
        elements.loading.classList.add('active');
    },

    hideLoading() {
        elements.loading.classList.remove('active');
    },

    // 토스트 메시지 표시
    showToast(message, duration = 3000) {
        elements.toastMessage.textContent = message;
        elements.toast.classList.add('show');
        
        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, duration);
    },

    // 이미지 URL 생성
    getImageUrl(path, size = 'w500') {
        return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
    },

    // 년도 추출
    getYear(dateString) {
        return dateString ? dateString.split('-')[0] : '연도 미상';
    },

    // 평점 포맷
    formatRating(rating) {
        return rating ? rating.toFixed(1) : '0.0';
    }
};

// 검색 기능
const search = {
    // 자연어 검색
    async performSearch(query) {
        if (!query.trim()) return;

        utils.showLoading();
        
        try {
            const result = await utils.fetchAPI('/search', {
                method: 'POST',
                body: JSON.stringify({ query })
            });

            this.displayResults(result);
            this.addToHistory(query);
            
        } catch (error) {
            utils.showToast('검색 중 오류가 발생했습니다.');
            console.error('검색 오류:', error);
        } finally {
            utils.hideLoading();
        }
    },

    // 검색 결과 표시
    displayResults(result) {
        const { results, recommendation, originalQuery, type } = result;
        
        let html = `
            <div class="search-results-header">
                <h3 class="search-results-title">"${originalQuery}" 검색 결과</h3>
                <p class="search-results-subtitle">${results.length}개의 ${type === 'movie' ? '영화' : type === 'tv' ? 'TV 프로그램' : '인물'}을 찾았습니다.</p>
            </div>
        `;

        if (recommendation) {
            html += `<div class="recommendation-text">${recommendation}</div>`;
        }

        if (results.length > 0) {
            html += '<div class="movies-grid">';
            results.forEach(item => {
                if (type === 'movie') {
                    html += this.createMovieCard(item);
                } else if (type === 'tv') {
                    html += this.createTVCard(item);
                } else if (type === 'person') {
                    html += this.createPersonCard(item);
                }
            });
            html += '</div>';
        } else {
            html += '<div class="empty-message">검색 결과가 없습니다.</div>';
        }

        elements.searchResults.innerHTML = html;
        this.attachCardEvents();
    },

    // 영화 카드 생성
    createMovieCard(movie) {
        const posterUrl = utils.getImageUrl(movie.poster_path);
        const isFavorited = favoritesData.some(fav => fav.id === movie.id);
        
        return `
            <div class="movie-card" data-movie-id="${movie.id}">
                <div class="movie-poster">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${movie.title}" loading="lazy">` : '<i class="fas fa-film"></i>'}
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${utils.getYear(movie.release_date)}</span>
                        <span class="movie-rating">
                            <i class="fas fa-star"></i>
                            ${utils.formatRating(movie.vote_average)}
                        </span>
                    </div>
                    <p class="movie-overview">${movie.overview || '줄거리 정보가 없습니다.'}</p>
                    <div class="movie-actions">
                        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" data-movie-id="${movie.id}">
                            <i class="fas fa-heart"></i>
                            ${isFavorited ? '찜 해제' : '찜하기'}
                        </button>
                        <button class="details-btn" data-movie-id="${movie.id}">
                            <i class="fas fa-info-circle"></i>
                            상세보기
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // TV 카드 생성 (간단하게)
    createTVCard(tv) {
        const posterUrl = utils.getImageUrl(tv.poster_path);
        
        return `
            <div class="movie-card">
                <div class="movie-poster">
                    ${posterUrl ? `<img src="${posterUrl}" alt="${tv.name}" loading="lazy">` : '<i class="fas fa-tv"></i>'}
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${tv.name}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${utils.getYear(tv.first_air_date)}</span>
                        <span class="movie-rating">
                            <i class="fas fa-star"></i>
                            ${utils.formatRating(tv.vote_average)}
                        </span>
                    </div>
                    <p class="movie-overview">${tv.overview || '줄거리 정보가 없습니다.'}</p>
                </div>
            </div>
        `;
    },

    // 인물 카드 생성 (간단하게)
    createPersonCard(person) {
        const profileUrl = utils.getImageUrl(person.profile_path);
        
        return `
            <div class="movie-card">
                <div class="movie-poster">
                    ${profileUrl ? `<img src="${profileUrl}" alt="${person.name}" loading="lazy">` : '<i class="fas fa-user"></i>'}
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${person.name}</h3>
                    <div class="movie-meta">
                        <span class="movie-year">${person.known_for_department}</span>
                        <span class="movie-rating">
                            <i class="fas fa-fire"></i>
                            ${Math.round(person.popularity)}
                        </span>
                    </div>
                    <p class="movie-overview">대표작: ${person.known_for?.map(work => work.title || work.name).slice(0, 3).join(', ') || '정보 없음'}</p>
                </div>
            </div>
        `;
    },

    // 검색 기록에 추가
    addToHistory(query) {
        // 중복 제거
        searchHistory = searchHistory.filter(item => item !== query);
        // 맨 앞에 추가
        searchHistory.unshift(query);
        // 최대 10개까지만 유지
        searchHistory = searchHistory.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        this.updateHistoryDisplay();
    },

    // 검색 기록 표시 업데이트
    updateHistoryDisplay() {
        if (searchHistory.length === 0) {
            elements.historyTags.innerHTML = '<p class="empty-message">검색 기록이 없습니다.</p>';
            return;
        }

        const historyHTML = searchHistory.map(query => 
            `<span class="history-tag" data-query="${query}">${query}</span>`
        ).join('');
        
        elements.historyTags.innerHTML = historyHTML;
        
        // 이벤트 리스너 추가
        elements.historyTags.querySelectorAll('.history-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const query = tag.dataset.query;
                elements.searchInput.value = query;
                search.performSearch(query);
            });
        });
    },

    // 카드 이벤트 연결
    attachCardEvents() {
        // 찜하기 버튼
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const movieId = parseInt(btn.dataset.movieId);
                
                // 버튼 비활성화하여 중복 클릭 방지
                btn.disabled = true;
                
                try {
                    await favorites.toggleFavorite(movieId, btn);
                } catch (error) {
                    console.error('찜하기 처리 중 오류:', error);
                    utils.showToast('찜하기 처리 중 오류가 발생했습니다.');
                } finally {
                    // 버튼 다시 활성화
                    btn.disabled = false;
                }
            });
        });

        // 상세보기 버튼
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const movieId = parseInt(btn.dataset.movieId);
                modal.showMovieDetails(movieId);
            });
        });
    }
};

// 영화 목록 기능
const movieLists = {
    // 인기 영화 로드
    async loadPopular() {
        utils.showLoading();
        
        try {
            const data = await utils.fetchAPI('/movies/popular');
            this.displayMovies(data.results, elements.popularMovies);
        } catch (error) {
            utils.showToast('인기 영화를 불러오는 중 오류가 발생했습니다.');
        } finally {
            utils.hideLoading();
        }
    },

    // 현재 상영 영화 로드
    async loadNowPlaying() {
        utils.showLoading();
        
        try {
            const data = await utils.fetchAPI('/movies/now-playing');
            this.displayMovies(data.results, elements.nowPlayingMovies);
        } catch (error) {
            utils.showToast('현재 상영 영화를 불러오는 중 오류가 발생했습니다.');
        } finally {
            utils.hideLoading();
        }
    },

    // 평점 높은 영화 로드
    async loadTopRated() {
        utils.showLoading();
        
        try {
            const data = await utils.fetchAPI('/movies/top-rated');
            this.displayMovies(data.results, elements.topRatedMovies);
        } catch (error) {
            utils.showToast('평점 높은 영화를 불러오는 중 오류가 발생했습니다.');
        } finally {
            utils.hideLoading();
        }
    },

    // 영화 목록 표시
    displayMovies(movies, container) {
        if (!movies || movies.length === 0) {
            container.innerHTML = '<div class="empty-message">영화 정보를 불러올 수 없습니다.</div>';
            return;
        }

        const moviesHTML = movies.map(movie => search.createMovieCard(movie)).join('');
        container.innerHTML = moviesHTML;
        search.attachCardEvents();
    }
};

// 찜 기능
const favorites = {
    // 찜 토글
    async toggleFavorite(movieId, buttonElement) {
        const existingIndex = favoritesData.findIndex(fav => fav.id === movieId);
        
        if (existingIndex > -1) {
            // 찜 해제
            favoritesData.splice(existingIndex, 1);
            buttonElement.classList.remove('favorited');
            buttonElement.innerHTML = '<i class="fas fa-heart"></i> 찜하기';
            utils.showToast('찜 목록에서 제거되었습니다.');
            
            // localStorage 저장 및 화면 업데이트
            localStorage.setItem('favorites', JSON.stringify(favoritesData));
            this.updateFavoritesDisplay();
        } else {
            // 찜 추가 - 영화 정보 가져오기
            await this.addToFavorites(movieId, buttonElement);
        }
    },

    // 찜 목록에 추가
    async addToFavorites(movieId, buttonElement) {
        try {
            const movie = await utils.fetchAPI(`/movies/${movieId}`);
            favoritesData.push({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                overview: movie.overview
            });
            
            buttonElement.classList.add('favorited');
            buttonElement.innerHTML = '<i class="fas fa-heart"></i> 찜 해제';
            utils.showToast('찜 목록에 추가되었습니다.');
            
            // localStorage 저장 및 화면 업데이트
            localStorage.setItem('favorites', JSON.stringify(favoritesData));
            this.updateFavoritesDisplay();
            
        } catch (error) {
            utils.showToast('찜하기 중 오류가 발생했습니다.');
            console.error('찜하기 오류:', error);
        }
    },

    // 찜 목록 표시 업데이트
    updateFavoritesDisplay() {
        if (favoritesData.length === 0) {
            elements.emptyFavorites.style.display = 'block';
            elements.favoritesMovies.innerHTML = '';
            return;
        }

        elements.emptyFavorites.style.display = 'none';
        const favoritesHTML = favoritesData.map(movie => search.createMovieCard(movie)).join('');
        elements.favoritesMovies.innerHTML = favoritesHTML;
        search.attachCardEvents();
    }
};

// 모달 기능
const modal = {
    // 영화 상세 정보 표시
    async showMovieDetails(movieId) {
        utils.showLoading();
        
        try {
            const [movie, credits, images, videos] = await Promise.all([
                utils.fetchAPI(`/movies/${movieId}`),
                utils.fetchAPI(`/movies/${movieId}/credits`),
                utils.fetchAPI(`/movies/${movieId}/images`),
                utils.fetchAPI(`/movies/${movieId}/videos`)
            ]);

            this.displayMovieDetails(movie, credits, images, videos);
            
        } catch (error) {
            utils.showToast('영화 상세 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            utils.hideLoading();
        }
    },

    // 영화 상세 정보 표시
    displayMovieDetails(movie, credits, images, videos) {
        elements.modalTitle.textContent = movie.title;
        
        const posterUrl = utils.getImageUrl(movie.poster_path);
        const backdropUrl = utils.getImageUrl(movie.backdrop_path, 'w1280');
        
        // 주요 출연진 (상위 5명)
        const mainCast = credits.cast?.slice(0, 5).map(actor => 
            `<span class="cast-member">${actor.name} (${actor.character})</span>`
        ).join('') || '정보 없음';

        // 감독
        const director = credits.crew?.find(person => person.job === 'Director');
        
        // 예고편 (YouTube)
        const trailer = videos.results?.find(video => 
            video.type === 'Trailer' && video.site === 'YouTube'
        );

        const modalHTML = `
            <div class="movie-detail">
                ${backdropUrl ? `<div class="movie-backdrop" style="background-image: url('${backdropUrl}')"></div>` : ''}
                
                <div class="movie-detail-content">
                    <div class="movie-detail-poster">
                        ${posterUrl ? `<img src="${posterUrl}" alt="${movie.title}">` : '<div class="no-poster"><i class="fas fa-film"></i></div>'}
                    </div>
                    
                    <div class="movie-detail-info">
                        <h2>${movie.title}</h2>
                        ${movie.original_title !== movie.title ? `<p class="original-title">${movie.original_title}</p>` : ''}
                        
                        <div class="movie-detail-meta">
                            <span class="detail-item"><i class="fas fa-calendar"></i> ${movie.release_date}</span>
                            <span class="detail-item"><i class="fas fa-clock"></i> ${movie.runtime}분</span>
                            <span class="detail-item"><i class="fas fa-star"></i> ${utils.formatRating(movie.vote_average)}</span>
                        </div>
                        
                        <div class="movie-genres">
                            ${movie.genres?.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('') || ''}
                        </div>
                        
                        <div class="movie-overview">
                            <h3>줄거리</h3>
                            <p>${movie.overview || '줄거리 정보가 없습니다.'}</p>
                        </div>
                        
                        <div class="movie-credits">
                            <h3>출연진</h3>
                            <div class="cast-list">${mainCast}</div>
                            
                            ${director ? `<h3>감독</h3><p>${director.name}</p>` : ''}
                        </div>
                        
                        ${trailer ? `
                            <div class="movie-trailer">
                                <h3>예고편</h3>
                                <a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-link">
                                    <i class="fas fa-play"></i> YouTube에서 보기
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        elements.modalBody.innerHTML = modalHTML;
        this.show();
    },

    // 모달 표시
    show() {
        elements.movieModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    // 모달 숨김
    hide() {
        elements.movieModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// 네비게이션 기능
const navigation = {
    // 섹션 전환
    switchSection(sectionName) {
        // 네비게이션 버튼 업데이트
        elements.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            }
        });

        // 섹션 표시/숨김
        elements.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionName}-section`) {
                section.classList.add('active');
            }
        });

        currentSection = sectionName;

        // 섹션별 데이터 로드
        this.loadSectionData(sectionName);
    },

    // 섹션별 데이터 로드
    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'popular':
                if (elements.popularMovies.children.length === 0) {
                    movieLists.loadPopular();
                }
                break;
            case 'now-playing':
                if (elements.nowPlayingMovies.children.length === 0) {
                    movieLists.loadNowPlaying();
                }
                break;
            case 'top-rated':
                if (elements.topRatedMovies.children.length === 0) {
                    movieLists.loadTopRated();
                }
                break;
            case 'favorites':
                favorites.updateFavoritesDisplay();
                break;
        }
    }
};

// 이벤트 리스너 설정
function setupEventListeners() {
    // 네비게이션 버튼
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            navigation.switchSection(section);
        });
    });

    // 검색 폼
    elements.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = elements.searchInput.value.trim();
        if (query) {
            search.performSearch(query);
        }
    });

    // 추천 검색어
    elements.suggestionTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const query = tag.dataset.query;
            elements.searchInput.value = query;
            search.performSearch(query);
        });
    });

    // 모달 닫기
    elements.modalClose.addEventListener('click', () => {
        modal.hide();
    });

    // 모달 외부 클릭시 닫기
    elements.movieModal.addEventListener('click', (e) => {
        if (e.target === elements.movieModal) {
            modal.hide();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.movieModal.classList.contains('active')) {
            modal.hide();
        }
    });
}

// 초기화
function init() {
    // localStorage 데이터 로드
    loadLocalStorageData();
    
    setupEventListeners();
    search.updateHistoryDisplay();
    favorites.updateFavoritesDisplay();
    
    // 기본 섹션 데이터 로드
    navigation.loadSectionData('search');
    
    console.log('🎬 TMDB 영화 검색 앱이 시작되었습니다!');
    console.log('📊 로드된 데이터:', {
        searchHistory: searchHistory.length,
        favorites: favoritesData.length
    });
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init); 