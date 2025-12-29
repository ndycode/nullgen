"use client";

/**
 * Floating particles background effect
 * Adds subtle animated dots for visual polish
 */
export function FloatingParticles() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Particle 1 */}
            <div
                className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
                style={{
                    left: "10%",
                    top: "20%",
                    animationDelay: "0s",
                    animationDuration: "4s",
                }}
            />
            {/* Particle 2 */}
            <div
                className="absolute w-1.5 h-1.5 bg-primary/15 rounded-full animate-float"
                style={{
                    left: "25%",
                    top: "60%",
                    animationDelay: "1s",
                    animationDuration: "5s",
                }}
            />
            {/* Particle 3 */}
            <div
                className="absolute w-1 h-1 bg-primary/25 rounded-full animate-float"
                style={{
                    left: "75%",
                    top: "30%",
                    animationDelay: "2s",
                    animationDuration: "3.5s",
                }}
            />
            {/* Particle 4 */}
            <div
                className="absolute w-2 h-2 bg-primary/10 rounded-full animate-float"
                style={{
                    left: "85%",
                    top: "70%",
                    animationDelay: "0.5s",
                    animationDuration: "6s",
                }}
            />
            {/* Particle 5 */}
            <div
                className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
                style={{
                    left: "50%",
                    top: "15%",
                    animationDelay: "1.5s",
                    animationDuration: "4.5s",
                }}
            />
            {/* Particle 6 */}
            <div
                className="absolute w-1.5 h-1.5 bg-primary/15 rounded-full animate-float"
                style={{
                    left: "40%",
                    top: "80%",
                    animationDelay: "3s",
                    animationDuration: "5.5s",
                }}
            />
        </div>
    );
}
