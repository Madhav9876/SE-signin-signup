class ShowtimeService {
    constructor() {
        this.currentBooking = null;
        this.showtimes = new Map(); // Cache for showtime data
        this.init();
    }

    init() {
        this.loadCurrentBooking();
        this.setupEventListeners();
    }

    loadCurrentBooking() {
        try {
            const bookingData = localStorage.getItem('currentBooking');
            if (bookingData) {
                this.currentBooking = JSON.parse(bookingData);
            }
        } catch (error) {
            console.error('Error loading current booking:', error);
        }
    }

    setupEventListeners() {
        // Listen for location changes
        window.addEventListener('locationChanged', (event) => {
            this.clearShowtimeCache();
        });
    }

    clearShowtimeCache() {
        this.showtimes.clear();
    }

    // Showtime availability management
    getShowtimeAvailability(movieId, cinemaId, screenId, date, time) {
        const cacheKey = `${movieId}_${cinemaId}_${screenId}_${date}_${time}`;

        if (this.showtimes.has(cacheKey)) {
            return this.showtimes.get(cacheKey);
        }

        // Generate simulated availability data
        const availability = this.generateShowtimeAvailability(movieId, cinemaId, screenId, date, time);
        this.showtimes.set(cacheKey, availability);

        return availability;
    }

    generateShowtimeAvailability(movieId, cinemaId, screenId, date, time) {
        const cinema = typeof cinemaService !== 'undefined' ?
                       cinemaService.getCinemaById(cinemaId) : null;
        const screen = cinema ? cinema.screens.find(s => s.id === screenId) : null;

        if (!screen) {
            return {
                totalSeats: 0,
                availableSeats: 0,
                bookedSeats: [],
                availablePercentage: 0,
                status: 'unavailable'
            };
        }

        // Calculate total capacity
        let totalSeats = 0;
        Object.values(screen.seatingCategories).forEach(category => {
            totalSeats += category.rows.length * category.seatsPerRow;
        });

        // Simulate booking based on time and date
        const timeUntilShowtime = this.getTimeUntilShowtime(date, time);
        const bookedPercentage = this.calculateBookedPercentage(timeUntilShowtime);

        const bookedCount = Math.floor(totalSeats * bookedPercentage);
        const availableCount = totalSeats - bookedCount;

        // Generate some random booked seats
        const bookedSeats = this.generateRandomBookedSeats(screen, bookedCount);

        const availablePercentage = (availableCount / totalSeats) * 100;

        let status;
        if (availablePercentage >= 70) {
            status = 'available';
        } else if (availablePercentage >= 30) {
            status = 'filling-up';
        } else if (availablePercentage > 0) {
            status = 'almost-full';
        } else {
            status = 'full';
        }

        return {
            totalSeats,
            availableSeats: availableCount,
            bookedSeats,
            availablePercentage,
            status,
            screenType: screen.type,
            basePrice: Object.values(screen.seatingCategories)[0].price
        };
    }

    getTimeUntilShowtime(date, time) {
        const showtimeDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        return showtimeDateTime - now;
    }

    calculateBookedPercentage(timeUntilShowtime) {
        // Shows that are closer to being full if they're sooner
        const hoursUntil = timeUntilShowtime / (1000 * 60 * 60);

        if (hoursUntil < 0) {
            return 1; // Past showtime
        } else if (hoursUntil < 2) {
            return 0.7 + Math.random() * 0.2; // 70-90% booked
        } else if (hoursUntil < 24) {
            return 0.4 + Math.random() * 0.3; // 40-70% booked
        } else if (hoursUntil < 72) {
            return 0.2 + Math.random() * 0.3; // 20-50% booked
        } else {
            return 0.05 + Math.random() * 0.2; // 5-25% booked
        }
    }

    generateRandomBookedSeats(screen, bookedCount) {
        const bookedSeats = [];
        const allSeats = [];

        // Generate all possible seats
        Object.entries(screen.seatingCategories).forEach(([category, config]) => {
            config.rows.forEach(row => {
                for (let seat = 1; seat <= config.seatsPerRow; seat++) {
                    allSeats.push(`${category}-${row}-${seat}`);
                }
            });
        });

        // Randomly select seats to be booked
        const shuffled = allSeats.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(bookedCount, allSeats.length));
    }

    // Showtime filtering and searching
    getAvailableShowtimes(movieId, location = null, date = null) {
        if (typeof movieService === 'undefined') return [];

        const searchLocation = location || (this.currentBooking ? this.currentBooking.location : 'kathmandu');
        const searchDate = date || new Date().toISOString().split('T')[0];

        const movie = movieService.getMovieById(movieId);
        if (!movie || !movie.showtimes) return [];

        const locationShowtimes = movie.showtimes[searchLocation];
        if (!locationShowtimes) return [];

        const availableShowtimes = [];

        Object.entries(locationShowtimes).forEach(([cinemaId, times]) => {
            const cinema = typeof cinemaService !== 'undefined' ?
                          cinemaService.getCinemaById(cinemaId, searchLocation) : null;

            if (!cinema) return;

            times.forEach(time => {
                // Get first screen (in real app, this would be more sophisticated)
                const screen = cinema.screens[0];
                if (!screen) return;

                const availability = this.getShowtimeAvailability(
                    movieId, cinemaId, screen.id, searchDate, time
                );

                if (availability.status !== 'full' && availability.status !== 'unavailable') {
                    availableShowtimes.push({
                        time,
                        cinemaId,
                        cinemaName: cinema.name,
                        screenId: screen.id,
                        screenType: screen.type,
                        availability,
                        price: availability.basePrice
                    });
                }
            });
        });

        // Sort by time
        return availableShowtimes.sort((a, b) => {
            const timeA = this.timeStringToMinutes(a.time);
            const timeB = this.timeStringToMinutes(b.time);
            return timeA - timeB;
        });
    }

    timeStringToMinutes(timeString) {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        let hours24 = hours;
        if (period === 'PM' && hours !== 12) {
            hours24 += 12;
        } else if (period === 'AM' && hours === 12) {
            hours24 = 0;
        }

        return hours24 * 60 + minutes;
    }

    filterShowtimesByTime(showtimes, timeFilter) {
        const now = new Date();
        const currentHour = now.getHours();

        return showtimes.filter(showtime => {
            const showtimeHour = this.timeStringToMinutes(showtime.time) / 60;

            switch (timeFilter) {
                case 'morning':
                    return showtimeHour >= 6 && showtimeHour < 12;
                case 'afternoon':
                    return showtimeHour >= 12 && showtimeHour < 17;
                case 'evening':
                    return showtimeHour >= 17 && showtimeHour < 21;
                case 'night':
                    return showtimeHour >= 21 || showtimeHour < 2;
                default:
                    return true;
            }
        });
    }

    // Showtime booking flow
    selectShowtime(movieId, cinemaId, screenId, date, time) {
        const availability = this.getShowtimeAvailability(movieId, cinemaId, screenId, date, time);

        if (availability.status === 'full') {
            throw new Error('This showtime is full');
        }

        if (availability.status === 'unavailable') {
            throw new Error('This showtime is not available');
        }

        // Update current booking
        this.currentBooking = {
            movieId,
            cinemaId,
            screenId,
            date,
            time,
            location: this.currentBooking?.location || 'kathmandu'
        };

        this.saveCurrentBooking();

        return this.currentBooking;
    }

    saveCurrentBooking() {
        try {
            localStorage.setItem('currentBooking', JSON.stringify(this.currentBooking));
        } catch (error) {
            console.error('Error saving current booking:', error);
        }
    }

    clearCurrentBooking() {
        this.currentBooking = null;
        localStorage.removeItem('currentBooking');
    }

    // Price calculation
    calculatePrice(showtime, seats) {
        const basePrice = showtime.price;
        const screenMultiplier = this.getScreenTypeMultiplier(showtime.screenType);
        const timeMultiplier = this.getTimeMultiplier(showtime.time);

        let totalPrice = 0;

        seats.forEach(seat => {
            const categoryMultiplier = this.getCategoryMultiplier(seat.category);
            totalPrice += basePrice * screenMultiplier * timeMultiplier * categoryMultiplier;
        });

        return Math.round(totalPrice);
    }

    getScreenTypeMultiplier(screenType) {
        const multipliers = {
            'Standard': 1.0,
            '3D': 1.3,
            'IMAX': 1.8,
            'Premium': 1.5
        };
        return multipliers[screenType] || 1.0;
    }

    getTimeMultiplier(time) {
        const hour = this.timeStringToMinutes(time) / 60;

        // Peak hours (evening shows) cost more
        if ((hour >= 18 && hour <= 21) || (hour >= 22 && hour <= 23)) {
            return 1.2;
        } else if (hour >= 12 && hour <= 17) {
            return 1.1;
        } else {
            return 1.0;
        }
    }

    getCategoryMultiplier(category) {
        const multipliers = {
            'Silver': 1.0,
            'Gold': 1.3,
            'Platinum': 1.8
        };
        return multipliers[category] || 1.0;
    }

    // Showtime validation
    isValidShowtime(movieId, cinemaId, screenId, date, time) {
        const availability = this.getShowtimeAvailability(movieId, cinemaId, screenId, date, time);

        return availability.status !== 'unavailable' &&
               availability.status !== 'full' &&
               this.getTimeUntilShowtime(date, time) > 0;
    }

    isShowtimeInPast(date, time) {
        const showtimeDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        return showtimeDateTime <= now;
    }

    // Showtime recommendations
    getRecommendedShowtimes(movieId, maxResults = 5) {
        const allShowtimes = this.getAvailableShowtimes(movieId);

        // Score showtimes based on availability and time
        const scoredShowtimes = allShowtimes.map(showtime => {
            let score = 0;

            // Prefer shows with good availability
            if (showtime.availability.status === 'available') {
                score += 20;
            } else if (showtime.availability.status === 'filling-up') {
                score += 10;
            }

            // Prefer evening shows
            const hour = this.timeStringToMinutes(showtime.time) / 60;
            if (hour >= 18 && hour <= 21) {
                score += 15;
            } else if (hour >= 15 && hour < 18) {
                score += 10;
            }

            // Prefer premium screens for blockbusters
            if (showtime.screenType === 'IMAX' || showtime.screenType === '3D') {
                score += 5;
            }

            return { ...showtime, score };
        });

        return scoredShowtimes
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
    }

    // Showtime caching and performance
    preloadShowtimes(movieIds, location, date) {
        movieIds.forEach(movieId => {
            this.getAvailableShowtimes(movieId, location, date);
        });
    }

    // Analytics and reporting
    getShowtimeStats(movieId, cinemaId, date) {
        const allShowtimes = this.getAvailableShowtimes(movieId, cinemaService.getCurrentLocation(), date);
        const cinemaShowtimes = allShowtimes.filter(s => s.cinemaId === cinemaId);

        if (cinemaShowtimes.length === 0) {
            return null;
        }

        const totalSeats = cinemaShowtimes.reduce((sum, s) => sum + s.availability.totalSeats, 0);
        const availableSeats = cinemaShowtimes.reduce((sum, s) => sum + s.availability.availableSeats, 0);
        const averagePrice = cinemaShowtimes.reduce((sum, s) => sum + s.price, 0) / cinemaShowtimes.length;

        return {
            totalShowtimes: cinemaShowtimes.length,
            totalSeats,
            availableSeats,
            occupancyRate: ((totalSeats - availableSeats) / totalSeats) * 100,
            averagePrice,
            screenTypes: [...new Set(cinemaShowtimes.map(s => s.screenType))]
        };
    }

    // User preferences
    saveShowtimePreference(preference) {
        try {
            const preferences = this.getShowtimePreferences();
            preferences[preference.type] = preference.value;
            localStorage.setItem('showtimePreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving showtime preference:', error);
        }
    }

    getShowtimePreferences() {
        try {
            return JSON.parse(localStorage.getItem('showtimePreferences') || '{}');
        } catch (error) {
            return {};
        }
    }

    // Helper methods
    formatTime(timeString) {
        const [time, period] = timeString.split(' ');
        return time + ' ' + period;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    getShowtimeStatusDisplay(status) {
        const displays = {
            'available': { text: 'Available', color: '#22c55e' },
            'filling-up': { text: 'Filling Up', color: '#f59e0b' },
            'almost-full': { text: 'Almost Full', color: '#ef4444' },
            'full': { text: 'Full', color: '#6b7280' },
            'unavailable': { text: 'Unavailable', color: '#6b7280' }
        };
        return displays[status] || displays['unavailable'];
    }
}

// Initialize the showtime service
const showtimeService = new ShowtimeService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShowtimeService;
}