import { useState } from 'react';
import '../styles/ExampleSongsList.css';
import AudioPlayer from './AudioPlayer';

const EXAMPLE_SONGS = [
  {
    id: 'ex-1',
    title: 'Mohan Veena - Indian Guitar',
    artist: 'Manele AI',
    audioUrl: '/music/mohanveena-indian-guitar-374179.mp3',
    imageUrl: null,
  },
  { id: 'ex-2', title: 'Mohan Veena - Indian Guitar', artist: 'Manele AI', audioUrl: '/music/mohanveena-indian-guitar-374179.mp3', imageUrl: null },
  { id: 'ex-3', title: 'Mohan Veena - Indian Guitar', artist: 'Manele AI', audioUrl: '/music/mohanveena-indian-guitar-374179.mp3', imageUrl: null },
  { id: 'ex-4', title: 'Mohan Veena - Indian Guitar', artist: 'Manele AI', audioUrl: '/music/mohanveena-indian-guitar-374179.mp3', imageUrl: null },
];

const ExampleSongsList = () => {
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  const handlePlayPause = (songId) => {
    setCurrentPlayingId((prev) => (prev === songId ? null : songId));
  };

  return (
    <div className="exlist-container">
      <h2 className="exlist-title">Piese generate</h2>
      <div className="exlist-list">
        {EXAMPLE_SONGS.map((song) => (
          <div key={song.id} className="exlist-card">
            <div className="exlist-left">
              {/* <div className="exlist-cover" /> */}
              <div className="exlist-info">
                <div className="exlist-artist">{song.artist}</div>
                <div className="exlist-name">{song.title}</div>
              </div>
            </div>
            <div className="exlist-right">
              <AudioPlayer
                audioUrl={song.audioUrl}
                isPlaying={currentPlayingId === song.id}
                onPlayPause={() => handlePlayPause(song.id)}
                onError={() => {}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExampleSongsList;