import '../styles/ResultPage.css';

interface SongResultCardSkeletonProps {
    index: number;
}

export default function SongResultCardSkeleton({ index }: SongResultCardSkeletonProps) {
    return (
        <div key={`skeleton-${index}`} className="player-box skeleton-card">
            {/* Skeleton for song artwork */}
            <div className="song-artwork skeleton-image" />

            {/* Skeleton for song title */}
            <div className="skeleton-text skeleton-title" />

            {/* Skeleton for song style */}
            <div className="skeleton-text skeleton-style" />

            {/* Skeleton for audio player */}
            <div className="result-player-container">
                <div className="skeleton-audio-player">
                    <div className="skeleton-play-button" />
                    <div className="skeleton-progress-bar" />
                    <div className="skeleton-time" />
                </div>
            </div>

            {/* Skeleton for lyrics */}
            <div className="song-lyrics-standalone">
                <div className="song-lyrics-standalone-content">
                    <div className="skeleton-text skeleton-lyrics-line" />
                    <div className="skeleton-text skeleton-lyrics-line" />
                    <div className="skeleton-text skeleton-lyrics-line short" />
                </div>
            </div>

            {/* Skeleton for action buttons */}
            <div style={{ marginBottom: 16 }} />
            <div className="result-song-actions">
                <div className="skeleton-button" />
                <div className="skeleton-button small" />
            </div>

            {/* Skeleton for feedback button */}
            <div className="skeleton-feedback-button" />
        </div>
    );
}
