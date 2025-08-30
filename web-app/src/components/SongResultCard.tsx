import { styles } from 'data/stylesData';
import { getDownloadURL, ref } from 'firebase/storage';
import { useState } from 'react';
import { storage } from 'services/firebase';
import { downloadFile } from 'utils';
import AudioPlayer from './audio/AudioPlayer';
import ShareSongButton from './ShareSongButton';
import Button from './ui/Button';
import SoundWave from './ui/SoundWave';

interface SongResultCardProps {
    song: {
        id: string;
        apiData: {
            streamAudioUrl?: string;
            audioUrl?: string;
            imageUrl: string;
            title: string;
            lyrics?: string;
        };
        storage: {
            url?: string;
        };
    };
    index: number;
    lyrics?: string;
}

// Helper function to get song style
const getSongStyleFromSong = (song) => {
    if (!song?.userGenerationInput?.style) return null;
    return styles.find(s => s.value === song.userGenerationInput.style);
};

// Helper function to get song lyrics
const getSongLyricsFromSong = (song) => {
    // Fallback pentru versurile din song data
    const lyrics = song?.apiData?.lyrics ||
        song?.lyrics ||
        song?.userGenerationInput?.lyrics ||
        null;

    return lyrics;
};

export default function SongResultCard(props: SongResultCardProps) {
    const { song, index, lyrics } = props;

    const canDownload = song.storage?.url || song.apiData?.audioUrl;
    const songLyrics = lyrics ? lyrics : getSongLyricsFromSong(song);
    const songStyle = getSongStyleFromSong(song);

    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState(null);

    // // Test audio URL accessibility
    // const testAudioUrl = async (url) => {
    //     try {
    //         const response = await fetch(url, { method: 'HEAD' });
    //         return response.ok;
    //     } catch (error) {
    //         return false;
    //     }
    // };

    // Handle download for specific song
    const handleDownloadForSong = async (song) => {
        const rawUrl = song?.storage?.url || song?.apiData?.audioUrl || song?.apiData?.streamAudioUrl;
        if (!rawUrl) {
            setError("Nu s-a găsit URL-ul pentru descărcare.");
            return;
        }
        setIsDownloading(true);
        try {
            let resolvedUrl = rawUrl;
            // Dacă este un URL de tip gs://, obține un URL temporar de descărcare
            if (resolvedUrl.startsWith('gs://')) {
                const storageRef = ref(storage, resolvedUrl);
                resolvedUrl = await getDownloadURL(storageRef);
            }
            // // Test URL accessibility
            // const isAccessible = await testAudioUrl(resolvedUrl);
            // if (!isAccessible) {
            //     throw new Error('URL-ul nu este accesibil');
            // }
            await downloadFile(resolvedUrl, `${song.apiData?.title || 'manea'}.mp3`);
        } catch (error) {
            setError("Nu s-a putut descărca piesa. Încearcă din nou.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div key={song.id || index} className="player-box">
            <img
                src={song.apiData?.imageUrl || 'https://via.placeholder.com/150'}
                alt="Song artwork"
                className="song-artwork"
            />
            <h2 className="player-song-title">{song.apiData?.title || 'Piesa ta e gata!'}</h2>
            <h4 className="song-style-name">{songStyle?.title || 'Manele'}</h4>

            {/* Player audio pentru această piesă */}
            <div className="result-player-container">
                <AudioPlayer
                    key={`audio-${song.id || index}`}
                    urls={{
                        streamAudioUrl: song.apiData?.streamAudioUrl,
                        audioUrl: song.apiData?.audioUrl,
                        storageUrl: song.storage?.url,
                    }}
                    songId={song.id}
                />
            </div>
            {/* Versurile piesei */}
            {songLyrics && (
                <div className="song-lyrics-standalone">
                    <div className="song-lyrics-standalone-content">
                        <p className="song-lyrics-standalone-text">{songLyrics}</p>
                    </div>
                </div>
            )}
            {/* Spațiu între versuri și butoane */}
            <div style={{ marginBottom: 16 }} />
            {/* Butoane de download și share pentru această piesă */}
            {canDownload ? (
                <div className="result-song-actions">
                    <Button
                        className="hero-btn result-download-btn"
                        onClick={() => handleDownloadForSong(song)}
                        disabled={isDownloading}
                    >
                        <span className="hero-btn-text">
                            {isDownloading ? (
                                <SoundWave size="large" speed={1.5} />
                            ) : (
                                'Descarcă'
                            )}
                        </span>
                    </Button>
                    <ShareSongButton song={song} />
                </div>
            ) : (
                <div>
                    <p className="song-lyrics-standalone-text">
                        Vei putea downloada piesa în curând! Mai așteaptă puțin...
                    </p>
                </div>
            )}
        </div>
    );
}