import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { EditBookingModal, type BookingData } from '../components/venue/EditBookingModal';
import { CreateBookingModal } from '../components/venue/CreateBookingModal';

export const VenueCalendarView: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
    const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
    const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
    const [createDefaults, setCreateDefaults] = useState<{ date: Date, time: string } | undefined>(undefined);

    // Helpers
    const getDaysInWeek = (date: Date) => {
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay()); // Start on Sunday
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const days = getDaysInWeek(currentDate);
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

    // Mock Data
    const generateBooking = (dayOffset: number, hour: number, duration: number, title: string, coach: string): BookingData => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + dayOffset);
        d.setHours(hour, 0, 0, 0);
        const end = new Date(d);
        end.setHours(hour + duration);

        return {
            id: `booking-${dayOffset}-${hour}`,
            title,
            coach,
            startTime: d.toISOString(),
            endTime: end.toISOString(),
            courtName: 'Main Court' // Simplified for demo
        };
    };

    const [bookings, setBookings] = useState<BookingData[]>([
        generateBooking(1, 18, 2, 'Varsity Practice', 'Coach Carter'), // Mon 6-8 PM
        generateBooking(3, 19, 1.5, 'Skills Clinic', 'Coach Sarah'),   // Wed 7-8:30 PM
        generateBooking(5, 17, 1, 'Private Lesson', 'Coach Mike'),     // Fri 5-6 PM
        generateBooking(6, 10, 2, 'Morning Scrimmage', 'Coach J'),     // Sat 10-12 PM
    ]);

    const handleBookingClick = (booking: BookingData) => {
        setSelectedBooking(booking);
        setIsEditBookingOpen(true);
    };

    const handleOpenCreate = (date?: Date, time?: string) => {
        setCreateDefaults(date && time ? { date, time } : undefined);
        setIsCreateBookingOpen(true);
    };

    const handlePreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const getBookingsForCell = (day: Date, hour: number) => {
        return bookings.filter(b => {
            const start = new Date(b.startTime);
            return start.getDate() === day.getDate() &&
                start.getMonth() === day.getMonth() &&
                start.getHours() === hour;
        });
    };

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-7xl mx-auto flex flex-col">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/venue')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-white">Schedule</h1>
                        <p className="text-text-muted text-sm tracking-widest uppercase">Master Calendar</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onClick={handlePreviousWeek} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className="text-white font-bold text-sm">
                            {days[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-lg hover:bg-white/10 transition-colors uppercase tracking-wider flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                    <button
                        onClick={() => handleOpenCreate()}
                        className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wider flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Booking
                    </button>
                </div>
            </header>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-x-auto bg-black/40 border border-white/10 rounded-2xl animate-fade-in-up">
                <div className="min-w-[800px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-8 border-b border-white/10">
                        <div className="p-4 border-r border-white/10 bg-white/5">
                            <span className="text-xs font-bold text-text-muted uppercase">Time</span>
                        </div>
                        {days.map((day, i) => (
                            <div key={i} className={`p-4 border-r border-white/10 bg-white/5 text-center ${day.toDateString() === new Date().toDateString() ? 'bg-primary/10' : ''}`}>
                                <p className="text-xs font-bold text-text-muted uppercase mb-1">{day.toLocaleDateString([], { weekday: 'short' })}</p>
                                <p className={`text-xl font-black ${day.toDateString() === new Date().toDateString() ? 'text-primary' : 'text-white'}`}>
                                    {day.getDate()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    {hours.map((hour) => (
                        <div key={hour} className="grid grid-cols-8 border-b border-white/5">
                            {/* Time Label */}
                            <div className="p-3 border-r border-white/10 text-right text-text-muted text-xs font-medium">
                                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                            </div>

                            {/* Days */}
                            {days.map((day, dayIndex) => {
                                const bookingsForSlot = getBookingsForCell(day, hour);
                                return (
                                    <div key={dayIndex} className="relative border-r border-white/5 h-20 group hover:bg-white/5 transition-colors">
                                        {bookingsForSlot.map(booking => (
                                            <div
                                                key={booking.id}
                                                onClick={() => handleBookingClick(booking)}
                                                className="absolute top-1 left-1 right-1 p-2 rounded-lg bg-primary/20 border border-primary/50 cursor-pointer hover:bg-primary/30 transition-colors z-10"
                                                style={{
                                                    height: `${(new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60) * 100 - 10}%` // Approximate height calc
                                                }}
                                            >
                                                <p className="text-[10px] font-bold text-primary truncate">{booking.coach}</p>
                                                <p className="text-[10px] text-white/80 truncate">{booking.title}</p>
                                            </div>
                                        ))}

                                        {/* Add Button on Hover */}
                                        <button
                                            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            onClick={() => handleOpenCreate(day, hour.toString())}
                                        >
                                            <Plus className="w-4 h-4 text-white/40" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <EditBookingModal
                isOpen={isEditBookingOpen}
                onClose={() => setIsEditBookingOpen(false)}
                booking={selectedBooking}
                onUpdate={(b) => console.log('Update', b)}
                onCancel={() => {
                    showToast("Booking cancelled", "info");
                    setIsEditBookingOpen(false);
                }}
            />

            <CreateBookingModal
                isOpen={isCreateBookingOpen}
                onClose={() => setIsCreateBookingOpen(false)}
                onCreate={(newBooking) => setBookings([...bookings, newBooking])}
                initialDate={createDefaults?.date}
                initialTime={createDefaults?.time}
            />
        </div>
    );
};
