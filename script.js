const CONFIG = { userId: '279827355743289344', discordCdn: 'https://cdn.discordapp.com' };
let currentSongId = null;
let intervalId = null;
let isUpdating = true;
let rainbowActive = false;

const getAvatarUrl = (hash, id, discriminator) => {
  if (hash) return `${CONFIG.discordCdn}/avatars/${id}/${hash}.${hash.startsWith('a_') ? 'gif' : 'png'}?size=128`;
  return `https://cdn.discordapp.com/embed/avatars/${(discriminator || 0) % 5}.png`;
};

const formatTime = (ms) => {
  if (!ms || ms < 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
};

const getStatusClass = (status) => {
  const map = { online: 'online', idle: 'idle', dnd: 'dnd' };
  return map[status] || 'offline';
};

const calculateProgress = (start, end) => {
  if (!start || !end) return { percent: 0, current: '0:00', total: '0:00' };
  const now = Date.now();
  const total = end - start;
  const elapsed = Math.min(now - start, total);
  const percent = total > 0 ? (elapsed / total) * 100 : 0;
  return {
    percent: Math.min(100, Math.max(0, percent)),
    current: formatTime(elapsed),
    total: formatTime(total)
  };
};

const fetchData = async () => {
  try {
    const response = await axios.get(`https://api.lanyard.rest/v1/users/${CONFIG.userId}`);
    return response.data.success ? response.data.data : null;
  } catch { return null; }
};

const updateSpotifyUI = (spotify) => {
  const albumArt = document.getElementById('albumArtImg');
  const songName = document.getElementById('songName');
  const artistName = document.getElementById('artistName');
  const albumName = document.getElementById('albumName');
  const progressFill = document.getElementById('progressFill');
  const currentTime = document.getElementById('currentTime');
  const totalTime = document.getElementById('totalTime');

  if (!spotify) {
    if (currentSongId !== null) {
      albumArt.src = '';
      songName.textContent = 'Not playing anything';
      artistName.textContent = '';
      albumName.textContent = '';
      currentSongId = null;
    }
    progressFill.style.width = '0%';
    currentTime.textContent = '0:00';
    totalTime.textContent = '0:00';
    return;
  }

  const newSongId = `${spotify.song}-${spotify.artist}-${spotify.album}`;
  const { percent, current, total } = calculateProgress(spotify.timestamps?.start, spotify.timestamps?.end);

  if (newSongId !== currentSongId) {
    albumArt.src = spotify.album_art_url;
    songName.textContent = spotify.song;
    artistName.textContent = spotify.artist;
    albumName.textContent = spotify.album;
    currentSongId = newSongId;
  }

  progressFill.style.width = `${percent}%`;
  currentTime.textContent = current;
  totalTime.textContent = total;
};

const updateProfileUI = (discordUser, discordStatus) => {
  const user = discordUser || {};
  const avatarUrl = getAvatarUrl(user.avatar, user.id, user.discriminator);
  const displayName = user.display_name || user.global_name || 'Neko';
  const statusClass = getStatusClass(discordStatus);
  const username = user.username || 'neeeeekkkkkooooo';
  const discriminator = user.discriminator || '0';

  document.getElementById('avatarImg').src = avatarUrl;
  document.getElementById('statusBadge').className = `status-badge ${statusClass}`;
  document.getElementById('displayName').textContent = displayName;
  
  const usernameSpan = document.getElementById('usernameTag');
  usernameSpan.innerHTML = `@${username}${discriminator !== '0' ? `<span>#${discriminator}</span>` : ''}`;
};

const render = (data) => {
  if (!data) return;
  updateProfileUI(data.discord_user, data.discord_status || 'idle');
  if (!document.getElementById('mainContent').classList.contains('hidden')) {
    updateSpotifyUI(data.spotify);
  }
};

const resultsHTML = `
  <div class="results-state">
    <div class="projects-button-container">
      <span class="projects-button" id="projectsButtonInResults">projects</span>
    </div>
    <div class="profile-link-item">
      <a href="https://discord.com/users/279827355743289344" target="_blank">
        <img class="profile-icon" src="https://files.catbox.moe/29jekg.jpg" alt="Discord">
        <div class="profile-info">
          <div class="handle">@neeeeekkkkkooooo</div>
          <div class="platform">Discord</div>
        </div>
      </a>
    </div>
    <div class="profile-link-item">
      <a href="https://github.com/nekohere" target="_blank">
        <img class="profile-icon" src="https://files.catbox.moe/3fjgzl.jpg" alt="GitHub">
        <div class="profile-info">
          <div class="handle">Neko</div>
          <div class="platform">GitHub</div>
        </div>
      </a>
    </div>
    <div class="profile-link-item">
      <a href="https://www.bopimo.com/users/Nekooooo" target="_blank">
        <img class="profile-icon" src="https
