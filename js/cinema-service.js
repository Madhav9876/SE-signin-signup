class CinemaService {
    constructor() {
        this.currentLocation = 'kathmandu';
        this.cinemas = this.initializeCinemas();
        this.userLocation = null;
        this.init();
    }

    init() {
        this.loadUserLocation();
        this.setupLocationSelector();
    }

    initializeCinemas() {
        return {
            kathmandu: [
                {
                    id: 'qfx_kumari',
                    name: 'QFX Kumari',
                    address: 'Kamaladi, Kathmandu',
                    phone: '01-1234567',
                    coordinates: { lat: 27.7061, lng: 85.3290 },
                    facilities: ['3D', 'Dolby Atmos', 'Premium Seats', 'Snack Bar', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 200,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B', 'C', 'D'], seatsPerRow: 15, price: 350 },
                                'Gold': { rows: ['E', 'F', 'G'], seatsPerRow: 15, price: 450 },
                                'Platinum': { rows: ['H', 'I'], seatsPerRow: 12, price: 650 }
                            }
                        },
                        {
                            id: 'screen2',
                            name: 'Screen 2',
                            type: '3D',
                            capacity: 150,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B', 'C'], seatsPerRow: 12, price: 400 },
                                'Gold': { rows: ['D', 'E'], seatsPerRow: 12, price: 500 },
                                'Platinum': { rows: ['F'], seatsPerRow: 8, price: 750 }
                            }
                        },
                        {
                            id: 'screen3',
                            name: 'Screen 3 (Premium)',
                            type: 'IMAX',
                            capacity: 100,
                            seatingCategories: {
                                'Gold': { rows: ['A', 'B'], seatsPerRow: 10, price: 800 },
                                'Platinum': { rows: ['C', 'D'], seatsPerRow: 8, price: 1200 }
                            }
                        }
                    ],
                    operatingHours: '10:00 AM - 10:00 PM',
                    description: 'Flagship cinema with state-of-the-art facilities and premium experience'
                },
                {
                    id: 'qfx_civil_mall',
                    name: 'QFX Civil Mall',
                    address: 'Civil Mall, New Baneshwor, Kathmandu',
                    phone: '01-1234568',
                    coordinates: { lat: 27.6915, lng: 85.3420 },
                    facilities: ['3D', 'Dolby Atmos', 'Food Court', 'Shopping', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 180,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B', 'C'], seatsPerRow: 14, price: 300 },
                                'Gold': { rows: ['D', 'E', 'F'], seatsPerRow: 14, price: 400 },
                                'Platinum': { rows: ['G'], seatsPerRow: 10, price: 600 }
                            }
                        },
                        {
                            id: 'screen2',
                            name: 'Screen 2',
                            type: '3D',
                            capacity: 120,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B'], seatsPerRow: 10, price: 350 },
                                'Gold': { rows: ['C', 'D'], seatsPerRow: 10, price: 450 },
                                'Platinum': { rows: ['E'], seatsPerRow: 8, price: 700 }
                            }
                        }
                    ],
                    operatingHours: '11:00 AM - 10:00 PM',
                    description: 'Conveniently located mall cinema with shopping and dining options'
                },
                {
                    id: 'qfx_bhrikutimandap',
                    name: 'QFX Bhrikutimandap',
                    address: 'Bhrikutimandap, Kathmandu',
                    phone: '01-1234569',
                    coordinates: { lat: 27.7049, lng: 85.3246 },
                    facilities: ['3D', 'Snack Bar', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 160,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B', 'C'], seatsPerRow: 13, price: 280 },
                                'Gold': { rows: ['D', 'E'], seatsPerRow: 13, price: 380 },
                                'Platinum': { rows: ['F'], seatsPerRow: 9, price: 550 }
                            }
                        }
                    ],
                    operatingHours: '10:30 AM - 9:30 PM',
                    description: 'Affordable cinema experience in the heart of the city'
                }
            ],
            pokhara: [
                {
                    id: 'qfx_lakeside',
                    name: 'QFX Lakeside',
                    address: 'Lakeside, Pokhara',
                    phone: '061-123456',
                    coordinates: { lat: 28.2096, lng: 83.9856 },
                    facilities: ['3D', 'Mountain View', 'Snack Bar', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 140,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B'], seatsPerRow: 12, price: 250 },
                                'Gold': { rows: ['C', 'D'], seatsPerRow: 12, price: 350 },
                                'Platinum': { rows: ['E'], seatsPerRow: 8, price: 500 }
                            }
                        }
                    ],
                    operatingHours: '11:00 AM - 9:00 PM',
                    description: 'Beautiful cinema with mountain views and relaxed atmosphere'
                }
            ],
            lalitpur: [
                {
                    id: 'qfx_patan',
                    name: 'QFX Patan',
                    address: 'Patan Dhoka, Lalitpur',
                    phone: '01-1234570',
                    coordinates: { lat: 27.6780, lng: 85.3228 },
                    facilities: ['3D', 'Heritage Location', 'Snack Bar', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 150,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B', 'C'], seatsPerRow: 12, price: 320 },
                                'Gold': { rows: ['D', 'E'], seatsPerRow: 12, price: 420 },
                                'Platinum': { rows: ['F'], seatsPerRow: 9, price: 650 }
                            }
                        }
                    ],
                    operatingHours: '10:00 AM - 10:00 PM',
                    description: 'Modern cinema in the historic city of Patan'
                }
            ],
            bhaktapur: [
                {
                    id: 'qfx_bhaktapur',
                    name: 'QFX Bhaktapur',
                    address: 'Bhaktapur Durbar Square Area',
                    phone: '01-1234571',
                    coordinates: { lat: 27.6710, lng: 85.4298 },
                    facilities: ['3D', 'Cultural Location', 'Snack Bar'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 120,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B'], seatsPerRow: 10, price: 280 },
                                'Gold': { rows: ['C', 'D'], seatsPerRow: 10, price: 380 },
                                'Platinum': { rows: ['E'], seatsPerRow: 7, price: 550 }
                            }
                        }
                    ],
                    operatingHours: '11:00 AM - 9:00 PM',
                    description: 'Intimate cinema experience in the ancient city of Bhaktapur'
                }
            ],
            biratnagar: [
                {
                    id: 'qfx_biratnagar',
                    name: 'QFX Biratnagar',
                    address: 'Bhatbhateni Area, Biratnagar',
                    phone: '021-123456',
                    coordinates: { lat: 26.4525, lng: 87.2718 },
                    facilities: ['3D', 'Snack Bar', 'Parking'],
                    screens: [
                        {
                            id: 'screen1',
                            name: 'Screen 1',
                            type: 'Standard',
                            capacity: 130,
                            seatingCategories: {
                                'Silver': { rows: ['A', 'B'], seatsPerRow: 11, price: 260 },
                                'Gold': { rows: ['C', 'D'], seatsPerRow: 11, price: 360 },
                                'Platinum': { rows: ['E'], seatsPerRow: 8, price: 520 }
                            }
                        }
                    ],
                    operatingHours: '10:30 AM - 9:30 PM',
                    description: 'Premier cinema experience in eastern Nepal'
                }
            ]
        };
    }

    loadUserLocation() {
        const savedLocation = localStorage.getItem('selectedLocation');
        if (savedLocation && this.cinemas[savedLocation]) {
            this.currentLocation = savedLocation;
        }

        // Try to get user's geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.findNearestCinema();
                },
                (error) => {
                    console.log('Could not get user location:', error);
                }
            );
        }
    }

    setupLocationSelector() {
        const selector = document.getElementById('locationSelector');
        if (selector) {
            selector.value = this.currentLocation;
            selector.addEventListener('change', (e) => {
                this.setLocation(e.target.value);
            });
        }
    }

    setLocation(location) {
        if (this.cinemas[location]) {
            this.currentLocation = location;
            localStorage.setItem('selectedLocation', location);

            // Update selector if it exists
            const selector = document.getElementById('locationSelector');
            if (selector) {
                selector.value = location;
            }

            // Trigger location change event
            this.onLocationChange(location);
        }
    }

    onLocationChange(location) {
        // This method can be overridden by other components
        // Reload movies for new location
        if (typeof movieService !== 'undefined') {
            movieService.loadMovies(location);
        }

        // Custom event that other components can listen to
        window.dispatchEvent(new CustomEvent('locationChanged', { detail: { location } }));
    }

    getCurrentLocation() {
        return this.currentLocation;
    }

    getCinemasByLocation(location = null) {
        const searchLocation = location || this.currentLocation;
        return this.cinemas[searchLocation] || [];
    }

    getCinemaById(cinemaId, location = null) {
        const cinemas = this.getCinemasByLocation(location);
        return cinemas.find(cinema => cinema.id === cinemaId);
    }

    getAllCinemas() {
        const allCinemas = [];
        Object.keys(this.cinemas).forEach(location => {
            this.cinemas[location].forEach(cinema => {
                allCinemas.push({ ...cinema, city: location });
            });
        });
        return allCinemas;
    }

    findNearestCinema() {
        if (!this.userLocation) return null;

        const allCinemas = this.getAllCinemas();
        let nearestCinema = null;
        let minDistance = Infinity;

        allCinemas.forEach(cinema => {
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                cinema.coordinates.lat,
                cinema.coordinates.lng
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestCinema = cinema;
            }
        });

        return nearestCinema;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula to calculate distance between two points
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    getDistanceFromUser(cinema) {
        if (!this.userLocation) return null;

        return this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            cinema.coordinates.lat,
            cinema.coordinates.lng
        );
    }

    getScreen(cinemaId, screenId) {
        const cinema = this.getCinemaById(cinemaId);
        if (!cinema) return null;

        return cinema.screens.find(screen => screen.id === screenId);
    }

    getSeatingLayout(cinemaId, screenId) {
        const screen = this.getScreen(cinemaId, screenId);
        if (!screen) return null;

        const layout = {};
        Object.entries(screen.seatingCategories).forEach(([category, config]) => {
            layout[category] = {
                ...config,
                totalSeats: config.rows.length * config.seatsPerRow,
                availableSeats: config.rows.length * config.seatsPerRow // In real app, this would come from booking data
            };
        });

        return layout;
    }

    calculateSeatPrice(cinemaId, screenId, category, seatCount = 1) {
        const screen = this.getScreen(cinemaId, screenId);
        if (!screen || !screen.seatingCategories[category]) return 0;

        const basePrice = screen.seatingCategories[category].price;
        return basePrice * seatCount;
    }

    getAvailableShowtimes(movieId, cinemaId, screenId, date) {
        // This would typically come from a database or API
        // For now, return sample showtimes
        const screen = this.getScreen(cinemaId, screenId);
        if (!screen) return [];

        const movie = typeof movieService !== 'undefined' ?
                      movieService.getMovieById(movieId) : null;

        if (!movie) return [];

        const showtimes = movie.showtimes?.[this.currentLocation]?.[cinemaId] || [];
        return showtimes.map(time => ({
            time: time,
            available: true, // In real app, this would be calculated based on current bookings
            screenId: screenId,
            screenType: screen.type
        }));
    }

    // Location-based features
    getCitiesWithCinemas() {
        return Object.keys(this.cinemas);
    }

    getCinemaCountByCity() {
        const counts = {};
        Object.entries(this.cinemas).forEach(([city, cinemas]) => {
            counts[city] = cinemas.length;
        });
        return counts;
    }

    searchCinemas(query) {
        const allCinemas = this.getAllCinemas();
        const lowerQuery = query.toLowerCase();

        return allCinemas.filter(cinema =>
            cinema.name.toLowerCase().includes(lowerQuery) ||
            cinema.address.toLowerCase().includes(lowerQuery) ||
            cinema.city.toLowerCase().includes(lowerQuery) ||
            cinema.facilities.some(facility => facility.toLowerCase().includes(lowerQuery))
        );
    }

    filterCinemasByFacility(facility) {
        const allCinemas = this.getAllCinemas();
        return allCinemas.filter(cinema =>
            cinema.facilities.includes(facility)
        );
    }

    // User preferences
    saveFavoriteCinema(cinemaId) {
        const favoriteCinemas = this.getFavoriteCinemas();
        if (!favoriteCinemas.includes(cinemaId)) {
            favoriteCinemas.push(cinemaId);
            localStorage.setItem('favoriteCinemas', JSON.stringify(favoriteCinemas));
        }
    }

    removeFavoriteCinema(cinemaId) {
        let favoriteCinemas = this.getFavoriteCinemas();
        favoriteCinemas = favoriteCinemas.filter(id => id !== cinemaId);
        localStorage.setItem('favoriteCinemas', JSON.stringify(favoriteCinemas));
    }

    getFavoriteCinemas() {
        try {
            return JSON.parse(localStorage.getItem('favoriteCinemas') || '[]');
        } catch (error) {
            return [];
        }
    }

    isFavoriteCinema(cinemaId) {
        return this.getFavoriteCinemas().includes(cinemaId);
    }
}

// Initialize the cinema service
const cinemaService = new CinemaService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CinemaService;
}