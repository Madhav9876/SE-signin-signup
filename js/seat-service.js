class SeatService {
    constructor() {
        this.currentSeatMap = null;
        this.selectedSeats = [];
        this.bookingSession = null;
        this.lockTimeout = null;
        this.init();
    }

    init() {
        this.loadBookingSession();
        this.setupEventListeners();
    }

    loadBookingSession() {
        try {
            const sessionData = localStorage.getItem('seatBookingSession');
            if (sessionData) {
                this.bookingSession = JSON.parse(sessionData);
                // Check if session is still valid (5 minutes)
                if (Date.now() - this.bookingSession.timestamp > 5 * 60 * 1000) {
                    this.clearBookingSession();
                }
            }
        } catch (error) {
            console.error('Error loading booking session:', error);
        }
    }

    setupEventListeners() {
        // Listen for page visibility changes to handle seat locking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.selectedSeats.length > 0) {
                this.extendSeatLock();
            }
        });

        // Listen for page unload to release seats
        window.addEventListener('beforeunload', () => {
            this.releaseSeatLock();
        });
    }

    // Seat map generation
    async generateSeatMap(cinemaId, screenId, date, time) {
        try {
            const cinema = typeof cinemaService !== 'undefined' ?
                           cinemaService.getCinemaById(cinemaId) : null;
            const screen = cinema ? cinema.screens.find(s => s.id === screenId) : null;

            if (!screen) {
                throw new Error('Screen not found');
            }

            // Get existing booking data
            const existingBookings = await this.getExistingBookings(screenId, date, time);

            const categories = {};
            const occupiedSeats = new Set(existingBookings);

            Object.entries(screen.seatingCategories).forEach(([categoryName, config]) => {
                const rows = [];

                config.rows.forEach(rowName => {
                    const seats = [];
                    for (let i = 1; i <= config.seatsPerRow; i++) {
                        const seatId = `${categoryName}-${rowName}-${i}`;
                        const isOccupied = occupiedSeats.has(seatId) || this.isSeatBlocked(rowName, i, config);

                        seats.push({
                            id: seatId,
                            category: categoryName,
                            row: rowName,
                            number: i,
                            available: !isOccupied,
                            selected: false,
                            isPremium: categoryName === 'Platinum',
                            isWheelchair: this.isWheelchairSeat(rowName, i, config),
                            price: config.price,
                            blocked: this.isSeatBlocked(rowName, i, config)
                        });
                    }

                    rows.push({
                        name: rowName,
                        seats: seats
                    });
                });

                categories[categoryName] = {
                    basePrice: config.price,
                    rows: rows,
                    totalSeats: config.rows.length * config.seatsPerRow,
                    availableSeats: rows.reduce((sum, row) =>
                        sum + row.seats.filter(seat => seat.available && !seat.blocked).length, 0
                    )
                };
            });

            const seatMap = {
                screenId,
                cinemaId,
                date,
                time,
                categories,
                totalSeats: Object.values(categories).reduce((sum, cat) => sum + cat.totalSeats, 0),
                availableSeats: Object.values(categories).reduce((sum, cat) => sum + cat.availableSeats, 0),
                generatedAt: new Date().toISOString()
            };

            this.currentSeatMap = seatMap;
            return seatMap;

        } catch (error) {
            console.error('Error generating seat map:', error);
            throw error;
        }
    }

    isWheelchairSeat(rowName, seatNumber, config) {
        // Typically first few seats in first row or designated accessible seats
        return (rowName === 'A' && seatNumber <= 2) || seatNumber === Math.floor(config.seatsPerRow / 2);
    }

    isSeatBlocked(rowName, seatNumber, config) {
        // Block seats that would leave single seats (avoid social isolation)
        const rowIndex = config.rows.indexOf(rowName);
        const totalSeats = config.seatsPerRow;

        // Block seats that would create isolated single seats
        if (seatNumber > 1 && seatNumber < totalSeats) {
            // Check if seat would leave isolated seats
            const seatsLeft = seatNumber - 1;
            const seatsRight = totalSeats - seatNumber;

            if (seatsLeft < 3 && seatsRight < 3 && totalSeats > 6) {
                return true; // Block middle seats that would isolate others
            }
        }

        return false;
    }

    async getExistingBookings(screenId, date, time) {
        // In a real implementation, this would fetch from a database
        // For now, simulate some existing bookings
        const mockBookings = this.generateMockBookings(screenId, date, time);
        return mockBookings;
    }

    generateMockBookings(screenId, date, time) {
        const bookings = [];
        const showtimeDateTime = new Date(`${date}T${this.convertTimeTo24Hour(time)}`);
        const now = new Date();
        const hoursUntilShow = (showtimeDateTime - now) / (1000 * 60 * 60);

        // Generate more bookings for shows that are sooner
        const bookingPercentage = Math.max(0.1, Math.min(0.8, (48 - hoursUntilShow) / 60));
        const totalSeatsToBook = Math.floor(200 * bookingPercentage); // Assume ~200 seats per screen

        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        const categories = ['Silver', 'Gold', 'Platinum'];

        for (let i = 0; i < totalSeatsToBook; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const row = rows[Math.floor(Math.random() * Math.min(6, rows.length))];
            const seat = Math.floor(Math.random() * 15) + 1;
            bookings.push(`${category}-${row}-${seat}`);
        }

        return [...new Set(bookings)]; // Remove duplicates
    }

    convertTimeTo24Hour(timeString) {
        const [time, period] = timeString.split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        let hours24 = hours;
        if (period === 'PM' && hours !== 12) {
            hours24 += 12;
        } else if (period === 'AM' && hours === 12) {
            hours24 = 0;
        }

        return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Seat selection management
    selectSeat(seatId) {
        if (!this.currentSeatMap) {
            throw new Error('No seat map loaded');
        }

        const seat = this.findSeat(seatId);
        if (!seat) {
            throw new Error('Seat not found');
        }

        if (!seat.available || seat.blocked) {
            throw new Error('Seat not available');
        }

        if (this.selectedSeats.length >= 8) {
            throw new Error('Maximum 8 seats allowed per booking');
        }

        // Check seat selection rules
        if (!this.validateSeatSelection(seat)) {
            throw new Error('Invalid seat selection');
        }

        // Lock the seat
        this.lockSeat(seatId);

        seat.selected = true;
        this.selectedSeats.push(seat);

        this.saveBookingSession();
        return seat;
    }

    deselectSeat(seatId) {
        const seatIndex = this.selectedSeats.findIndex(seat => seat.id === seatId);
        if (seatIndex === -1) {
            return false;
        }

        const seat = this.selectedSeats[seatIndex];
        seat.selected = false;
        this.selectedSeats.splice(seatIndex, 1);

        // Release the seat lock
        this.releaseSeatLock(seatId);

        this.saveBookingSession();
        return true;
    }

    findSeat(seatId) {
        if (!this.currentSeatMap) return null;

        for (const category of Object.values(this.currentSeatMap.categories)) {
            for (const row of category.rows) {
                const seat = row.seats.find(s => s.id === seatId);
                if (seat) return seat;
            }
        }

        return null;
    }

    validateSeatSelection(seat) {
        if (this.selectedSeats.length === 0) {
            return true; // First seat can be any available seat
        }

        // Check if seats are in the same row or adjacent rows
        const firstSelectedSeat = this.selectedSeats[0];

        // Allow seats in the same category and same or adjacent rows
        if (seat.category !== firstSelectedSeat.category) {
            return false; // Different categories not allowed
        }

        const firstRowIndex = this.getRowIndex(firstSelectedSeat.row);
        const newRowIndex = this.getRowIndex(seat.row);

        // Allow same row or adjacent rows
        return Math.abs(firstRowIndex - newRowIndex) <= 1;
    }

    getRowIndex(rowName) {
        return rowName.charCodeAt(0) - 'A'.charCodeAt(0);
    }

    // Seat locking mechanism
    lockSeat(seatId) {
        // In a real implementation, this would make an API call to lock the seat
        console.log(`Locking seat: ${seatId}`);

        // Set lock timeout
        this.resetLockTimeout();
    }

    releaseSeatLock(seatId = null) {
        if (seatId) {
            console.log(`Releasing seat lock: ${seatId}`);
        } else {
            console.log('Releasing all seat locks');
            this.selectedSeats.forEach(seat => {
                seat.selected = false;
            });
            this.selectedSeats = [];
        }

        this.clearLockTimeout();
    }

    extendSeatLock() {
        if (this.selectedSeats.length > 0) {
            console.log('Extending seat lock timeout');
            this.resetLockTimeout();
        }
    }

    resetLockTimeout() {
        this.clearLockTimeout();
        this.lockTimeout = setTimeout(() => {
            console.log('Seat lock timeout reached');
            this.releaseSeatLock();
            this.clearBookingSession();
        }, 5 * 60 * 1000); // 5 minutes
    }

    clearLockTimeout() {
        if (this.lockTimeout) {
            clearTimeout(this.lockTimeout);
            this.lockTimeout = null;
        }
    }

    // Booking session management
    saveBookingSession() {
        try {
            this.bookingSession = {
                selectedSeats: this.selectedSeats.map(seat => ({
                    id: seat.id,
                    category: seat.category,
                    row: seat.row,
                    number: seat.number,
                    price: seat.price
                })),
                timestamp: Date.now(),
                seatMap: this.currentSeatMap
            };

            localStorage.setItem('seatBookingSession', JSON.stringify(this.bookingSession));
        } catch (error) {
            console.error('Error saving booking session:', error);
        }
    }

    clearBookingSession() {
        this.bookingSession = null;
        localStorage.removeItem('seatBookingSession');
        this.releaseSeatLock();
    }

    // Price calculation
    calculateTotalPrice() {
        if (this.selectedSeats.length === 0) {
            return 0;
        }

        let baseTotal = 0;
        let premiumCharge = 0;

        this.selectedSeats.forEach(seat => {
            baseTotal += seat.price;

            if (seat.isPremium) {
                premiumCharge += Math.round(seat.price * 0.5);
            }

            if (seat.isWheelchair) {
                // No extra charge for wheelchair accessible seats
            }
        });

        const convenienceFee = 25; // Fixed convenience fee

        return {
            basePrice: baseTotal,
            premiumCharge: premiumCharge,
            convenienceFee: convenienceFee,
            total: baseTotal + premiumCharge + convenienceFee,
            seatCount: this.selectedSeats.length
        };
    }

    // Seat availability checking
    getAvailableSeatsCount() {
        if (!this.currentSeatMap) return 0;

        return Object.values(this.currentSeatMap.categories)
            .reduce((total, category) => total + category.availableSeats, 0);
    }

    getOccupancyPercentage() {
        if (!this.currentSeatMap) return 0;

        const occupiedSeats = this.currentSeatMap.totalSeats - this.currentSeatMap.availableSeats;
        return Math.round((occupiedSeats / this.currentSeatMap.totalSeats) * 100);
    }

    getBestAvailableSeats(count = 1) {
        if (!this.currentSeatMap) return [];

        const availableSeats = [];

        Object.values(this.currentSeatMap.categories).forEach(category => {
            category.rows.forEach(row => {
                row.seats.forEach(seat => {
                    if (seat.available && !seat.blocked) {
                        availableSeats.push(seat);
                    }
                });
            });
        });

        // Sort by row (front to back) and seat number (center first)
        availableSeats.sort((a, b) => {
            const rowComparison = a.row.localeCompare(b.row);
            if (rowComparison !== 0) return rowComparison;

            // Prefer middle seats
            const aDistance = Math.abs(a.number - 8);
            const bDistance = Math.abs(b.number - 8);
            return aDistance - bDistance;
        });

        return availableSeats.slice(0, count);
    }

    // Adjacent seat finding
    findAdjacentSeats(count, preferredCategory = 'Silver') {
        if (!this.currentSeatMap) return [];

        const category = this.currentSeatMap.categories[preferredCategory];
        if (!category) return [];

        for (const row of category.rows) {
            const availableSeats = row.seats.filter(seat => seat.available && !seat.blocked);

            for (let i = 0; i <= availableSeats.length - count; i++) {
                const seats = availableSeats.slice(i, i + count);

                // Check if seats are adjacent
                let isAdjacent = true;
                for (let j = 1; j < seats.length; j++) {
                    if (seats[j].number - seats[j - 1].number !== 1) {
                        isAdjacent = false;
                        break;
                    }
                }

                if (isAdjacent) {
                    return seats;
                }
            }
        }

        return [];
    }

    // Analytics and reporting
    getSeatStatistics() {
        if (!this.currentSeatMap) return null;

        const stats = {
            totalSeats: this.currentSeatMap.totalSeats,
            availableSeats: this.currentSeatMap.availableSeats,
            occupiedSeats: this.currentSeatMap.totalSeats - this.currentSeatMap.availableSeats,
            occupancyRate: this.getOccupancyPercentage(),
            selectedSeats: this.selectedSeats.length,
            categoryStats: {}
        };

        Object.entries(this.currentSeatMap.categories).forEach(([categoryName, category]) => {
            const occupiedInCategory = category.totalSeats - category.availableSeats;
            stats.categoryStats[categoryName] = {
                total: category.totalSeats,
                available: category.availableSeats,
                occupied: occupiedInCategory,
                occupancyRate: Math.round((occupiedInCategory / category.totalSeats) * 100),
                basePrice: category.basePrice
            };
        });

        return stats;
    }

    // Validation methods
    validateBooking() {
        if (this.selectedSeats.length === 0) {
            throw new Error('No seats selected');
        }

        if (this.selectedSeats.length > 8) {
            throw new Error('Too many seats selected');
        }

        if (!this.currentSeatMap) {
            throw new Error('No seat map loaded');
        }

        // Check if any selected seats are no longer available
        const unavailableSeats = this.selectedSeats.filter(seat => {
            const currentSeat = this.findSeat(seat.id);
            return !currentSeat || !currentSeat.available;
        });

        if (unavailableSeats.length > 0) {
            throw new Error('Some selected seats are no longer available');
        }

        return true;
    }

    // Cleanup and reset
    reset() {
        this.currentSeatMap = null;
        this.selectedSeats = [];
        this.clearBookingSession();
        this.clearLockTimeout();
    }
}

// Initialize the seat service
const seatService = new SeatService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeatService;
}