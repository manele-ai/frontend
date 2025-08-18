import { useState } from 'react';
import '../styles/ExampleSongsList.css';
import LazyAudioPlayer from './LazyAudioPlayer';

const EXAMPLE_SONGS = [
  {
    id: 'ex-1',
    title: 'Manele Trapanele',
    artist: 'Manele AI',
    audioUrl: '/music/trapanele.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-2',
    title: 'Muzică Populară',
    artist: 'Manele AI',
    audioUrl: '/music/muzica-populara.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-3',
    title: 'Manele Orientale',
    artist: 'Manele AI',
    audioUrl: '/music/manele-orientale.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-4',
    title: 'Manele Live',
    artist: 'Manele AI',
    audioUrl: '/music/manele-live.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-5',
    title: 'Manele de Pahar',
    artist: 'Manele AI',
    audioUrl: '/music/manele-de-pahar.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-6',
    title: 'Manele de Opulență',
    artist: 'Manele AI',
    audioUrl: '/music/manele-de-opulenta.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-7',
    title: 'Lăutărești',
    artist: 'Manele AI',
    audioUrl: '/music/lautaresti.mp3',
    imageUrl: null,
  },
  {
    id: 'ex-8',
    title: 'Jale',
    artist: 'Manele AI',
    audioUrl: '/music/jale.mp3',
    imageUrl: null,
  },
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
              <LazyAudioPlayer
                audioUrl={song.audioUrl}
                fallbackAudioUrl={song.audioUrl}
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