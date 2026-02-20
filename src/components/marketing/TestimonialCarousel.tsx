import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
    id: number;
    quote: string;
    author: string;
    role: string;
    stars: number;
}

const testimonials: Testimonial[] = [
    {
        id: 1,
        quote: "I slept great after a fun practice. It's exactly the kind of organized, no-contact run I was looking for.",
        author: "James M.",
        role: "Weekend Warrior",
        stars: 5
    },
    {
        id: 2,
        quote: "Great to be back on the court without the drama. Just good exercise and good people.",
        author: "Robert T.",
        role: "Forward",
        stars: 5
    },
    {
        id: 3,
        quote: "Perfect for getting some shots up and breaking a sweat. Organized and professional.",
        author: "David R.",
        role: "Guard",
        stars: 5
    }
];

export const TestimonialCarousel: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    // Auto-play
    useEffect(() => {
        const timer = setInterval(nextSlide, 8000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="w-full max-w-4xl mx-auto bg-black/40 backdrop-blur-md rounded-3xl border border-white/5 py-10 px-6 mt-8 mb-6 relative">
            <div className="relative">
                {/* Header */}
                <div className="text-center mb-6 animate-fade-in">
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        ))}
                    </div>
                </div>

                {/* Carousel Content */}
                <div className="relative overflow-hidden min-h-[140px] flex items-center justify-center">
                    <div
                        className="transition-opacity duration-500 ease-in-out text-center max-w-2xl px-8"
                        key={testimonials[currentIndex].id}
                    >
                        <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed mb-4 font-heading">
                            "{testimonials[currentIndex].quote}"
                        </p>

                        <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold text-white tracking-wide">
                                {testimonials[currentIndex].author}
                            </span>
                            <span className="text-sm font-bold text-primary uppercase tracking-widest">
                                {testimonials[currentIndex].role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md hidden md:block"
                    aria-label="Previous testimonial"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all backdrop-blur-md hidden md:block"
                    aria-label="Next testimonial"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Dots */}
                <div className="flex justify-center gap-3 mt-8">
                    {testimonials.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary w-8' : 'bg-white/20 hover:bg-white/40'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
};
