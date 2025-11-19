class MovieService {
    constructor() {
        this.movies = null;
        this.currentLocation = 'kathmandu';
        this.init();
    }

    async init() {
        try {
            await this.loadMovieData();
        } catch (error) {
            console.error('Failed to initialize movie service:', error);
        }
    }

    async loadMovieData() {
        try {
            const response = await fetch('data/movies.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.movies = await response.json();
        } catch (error) {
            console.error('Error loading movie data:', error);
            // Fallback to cached data or empty structure
            this.movies = { now_showing: [], coming_soon: [] };
        }
    }

    loadMovies(location = null) {
        this.currentLocation = location || this.currentLocation;

        if (!this.movies) {
            // Show loading state
            document.getElementById('nowShowingGrid').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading movies...</p>
                </div>
            `;
            document.getElementById('comingSoonGrid').innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading upcoming movies...</p>
                </div>
            `;

            // Retry loading
            setTimeout(() => this.loadMovieData().then(() => this.loadMovies(location)), 1000);
            return;
        }

        this.renderMovies('nowShowingGrid', this.movies.now_showing);
        this.renderMovies('comingSoonGrid', this.movies.coming_soon);
    }

    renderMovies(gridId, movieList) {
        const grid = document.getElementById(gridId);

        if (!movieList || movieList.length === 0) {
            grid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1;">No movies available</p>';
            return;
        }

        grid.innerHTML = movieList.map(movie => this.createMovieCard(movie)).join('');
    }

    createMovieCard(movie) {
        const genres = movie.genre.slice(0, 2).map(g => `<span class="movie-genre">${g}</span>`).join('');
        const hasShowtimes = movie.showtimes && movie.showtimes[this.currentLocation];

        return `
            <div class="movie-card" onclick="movieService.viewMovieDetails('${movie.id}')">
                <div class="movie-poster" style="background-image: url('${movie.poster_url}')">
                    <div class="movie-rating">⭐ ${movie.imdb_rating || 'N/A'}</div>
                    <div class="movie-actions">
                        <button class="action-btn" onclick="event.stopPropagation(); movieService.watchTrailer('${movie.id}')">
                            🎬 Trailer
                        </button>
                        ${hasShowtimes ? `<button class="action-btn" onclick="event.stopPropagation(); movieService.bookMovie('${movie.id}')">
                            🎫 Book
                        </button>` : ''}
                    </div>
                </div>
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-meta-info">${movie.duration} • ${movie.rating} • ${movie.language}</div>
                    <div class="movie-meta-info">🎬 ${movie.director}</div>
                    <div style="margin-top: 8px;">
                        ${genres}
                    </div>
                </div>
            </div>
        `;
    }

    getMovieById(movieId) {
        if (!this.movies) return null;

        const allMovies = [
            ...this.movies.now_showing,
            ...this.movies.coming_soon
        ];

        return allMovies.find(movie => movie.id === movieId);
    }

    getMoviesByGenre(genre, location = null) {
        if (!this.movies) return [];

        const allMovies = [
            ...this.movies.now_showing,
            ...this.movies.coming_soon
        ];

        return allMovies.filter(movie =>
            movie.genre.includes(genre)
        );
    }

    searchMovies(query, location = null) {
        if (!this.movies) return [];

        const allMovies = [
            ...this.movies.now_showing,
            ...this.movies.coming_soon
        ];

        const lowerQuery = query.toLowerCase();
        return allMovies.filter(movie =>
            movie.title.toLowerCase().includes(lowerQuery) ||
            movie.director.toLowerCase().includes(lowerQuery) ||
            movie.cast.some(actor => actor.toLowerCase().includes(lowerQuery)) ||
            movie.genre.some(g => g.toLowerCase().includes(lowerQuery))
        );
    }

    getMoviesByRating(minRating, location = null) {
        if (!this.movies) return [];

        const allMovies = [
            ...this.movies.now_showing,
            ...this.movies.coming_soon
        ];

        return allMovies.filter(movie =>
            (movie.imdb_rating || 0) >= minRating
        );
    }

    getMovieShowtimes(movieId, location = null) {
        const movie = this.getMovieById(movieId);
        if (!movie || !movie.showtimes) return [];

        const searchLocation = location || this.currentLocation;
        return movie.showtimes[searchLocation] || {};
    }

    viewMovieDetails(movieId) {
        window.location.href = `movie-details.html?id=${movieId}`;
    }

    watchTrailer(movieId) {
        const movie = this.getMovieById(movieId);
        if (movie && movie.trailer_url) {
            // For now, just show an alert - in a real app, this would open a modal
            alert(`Opening trailer for ${movie.title}\n\nTrailer URL: ${movie.trailer_url}\n\nIn a full implementation, this would open a video modal.`);
        } else {
            alert('Trailer not available for this movie');
        }
    }

    bookMovie(movieId) {
        localStorage.setItem('selectedMovie', movieId);
        localStorage.setItem('selectedLocation', this.currentLocation);
        window.location.href = `movie-details.html?id=${movieId}`;
    }

    // Helper methods for filtering and sorting
    sortMoviesByRating(movies, ascending = false) {
        return movies.sort((a, b) => {
            const ratingA = a.imdb_rating || 0;
            const ratingB = b.imdb_rating || 0;
            return ascending ? ratingA - ratingB : ratingB - ratingA;
        });
    }

    sortMoviesByReleaseDate(movies, ascending = false) {
        return movies.sort((a, b) => {
            const dateA = new Date(a.release_date || 0);
            const dateB = new Date(b.release_date || 0);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    getNowShowing(location = null) {
        if (!this.movies) return [];

        const searchLocation = location || this.currentLocation;
        return this.movies.now_showing.filter(movie =>
            movie.showtimes && movie.showtimes[searchLocation]
        );
    }

    getComingSoon() {
        return this.movies ? this.movies.coming_soon : [];
    }

    // Save user preferences
    saveUserPreference(key, value) {
        try {
            localStorage.setItem(`movie_${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving user preference:', error);
        }
    }

    getUserPreference(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(`movie_${key}`);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('Error getting user preference:', error);
            return defaultValue;
        }
    }

    // Recently viewed movies
    addToRecentlyViewed(movieId) {
        let recentlyViewed = this.getUserPreference('recently_viewed', []);

        // Remove if already exists
        recentlyViewed = recentlyViewed.filter(id => id !== movieId);

        // Add to beginning
        recentlyViewed.unshift(movieId);

        // Keep only last 10
        recentlyViewed = recentlyViewed.slice(0, 10);

        this.saveUserPreference('recently_viewed', recentlyViewed);
    }

    getRecentlyViewed() {
        const recentlyViewedIds = this.getUserPreference('recently_viewed', []);
        return recentlyViewedIds.map(id => this.getMovieById(id)).filter(movie => movie);
    }

    // Watchlist functionality
    addToWatchlist(movieId) {
        let watchlist = this.getUserPreference('watchlist', []);

        if (!watchlist.includes(movieId)) {
            watchlist.push(movieId);
            this.saveUserPreference('watchlist', watchlist);
            return true;
        }

        return false;
    }

    removeFromWatchlist(movieId) {
        let watchlist = this.getUserPreference('watchlist', []);
        watchlist = watchlist.filter(id => id !== movieId);
        this.saveUserPreference('watchlist', watchlist);
        return true;
    }

    getWatchlist() {
        const watchlistIds = this.getUserPreference('watchlist', []);
        return watchlistIds.map(id => this.getMovieById(id)).filter(movie => movie);
    }

    isInWatchlist(movieId) {
        const watchlist = this.getUserPreference('watchlist', []);
        return watchlist.includes(movieId);
    }
}

// Initialize the movie service
const movieService = new MovieService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MovieService;
}