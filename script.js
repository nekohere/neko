const CONFIG = { userId: '279827355743289344', discordCdn: 'https://cdn.discordapp.com' };
let currentSongId = null;
let intervalId = null;
let isUpdating = true;
let rainbowActive = false;
let ossedData = null;

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

const fetchLanyard = async () => {
  try {
    const response = await axios.get(`https://api.lanyard.rest/v1/users/${CONFIG.userId}`);
    return response.data.success ? response.data.data : null;
  } catch { return null; }
};

const fetchOssed = async () => {
  try {
    const response = await axios.get(`https://ossed.lol/api/discord-user?id=${CONFIG.userId}`);
    if (response.data && response.data.user) {
      ossedData = response.data;
      updateBadgeAndBio();
    }
  } catch (error) {
    console.error('failed to fetch ossed data', error);
  }
};

const formatNitroDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).replace(' at ', ' at ');
};

const updateBadgeAndBio = () => {
  if (!ossedData) return;
  
  const badgeArea = document.getElementById('badgeArea');
  const bioArea = document.getElementById('bioArea');
  
  badgeArea.innerHTML = '';
  bioArea.innerHTML = '';
  
  const premiumBadge = ossedData.badges?.find(b => b.id === 'premium');
  if (premiumBadge && ossedData.premium_since) {
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'nitro-badge';
    
    const iconUrl = `https://cdn.discordapp.com/badge-icons/${premiumBadge.icon}.png`;
    const formattedDate = formatNitroDate(ossedData.premium_since);
    const timestamp = Math.floor(new Date(ossedData.premium_since).getTime() / 1000);
    
    badgeDiv.innerHTML = `
      <img src="${iconUrl}" alt="Nitro" width="18" height="18">
      <span class="badge-tooltip">Subscribed to Nitro since <t:${timestamp}:F></span>
    `;
    badgeArea.appendChild(badgeDiv);
  }
  
  if (ossedData.user?.bio) {
    bioArea.textContent = ossedData.user.bio;
  }
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
        <img class="profile-icon" src="https://i.imgur.com/yS9k0o0.png" alt="Bopimo">
        <div class="profile-info">
          <div class="handle">Neko</div>
          <div class="platform">Bopimo</div>
        </div>
      </a>
    </div>
    <div class="profile-link-item" style="border-bottom: 1px solid #222;">
      <a href="https://www.roblox.com" target="_blank">
        <img class="profile-icon" src="https://files.catbox.moe/98xr7w.jpg" alt="neeeeekkooooo">
        <div class="profile-info">
          <div class="handle">neeeeekkooooo</div>
          <div class="platform">Roblox</div>
        </div>
      </a>
    </div>
  </div>
`;

const loadingHTML = `<div class="loading-state" id="loadingState"><img src="https://files.catbox.moe/xas1w0.gif" alt="thinking"><div class="thinking-text">loading...</div></div>`;

const stopUpdates = () => {
  isUpdating = false;
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
};

const resumeUpdates = () => {
  if (isUpdating) return;
  isUpdating = true;
  startUpdates();
};

const startUpdates = async () => {
  let currentData = null;
  const update = async () => {
    if (!isUpdating) return;
    const newData = await fetchLanyard();
    if (newData) currentData = newData;
    render(currentData);
  };
  await update();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(update, 1000);
};

const viewMoreBtn = document.getElementById('viewMoreBtn');
const mainContent = document.getElementById('mainContent');
const projectsSection = document.getElementById('projectsSection');
const moreSection = document.getElementById('moreSection');
const transformEmbed = document.getElementById('transformEmbed');
const moreBackBtn = document.getElementById('moreBackButton');
const projectsBackBtn = document.getElementById('projectsBackButton');
const toggleBtn = document.getElementById('toggleTermBtn');
const sleekTerminal = document.getElementById('sleekTerminal');
const commandHistory = document.getElementById('commandHistory');
const commandInput = document.getElementById('commandInput');

moreBackBtn.addEventListener('click', () => {
  moreSection.classList.add('hidden');
  mainContent.classList.remove('hidden');
  resumeUpdates();
});

projectsBackBtn.addEventListener('click', () => {
  projectsSection.classList.add('hidden');
  moreSection.classList.remove('hidden');
});

viewMoreBtn.addEventListener('click', () => {
  mainContent.classList.add('hidden');
  moreSection.classList.remove('hidden');
  transformEmbed.innerHTML = loadingHTML;
  stopUpdates();

  setTimeout(() => {
    transformEmbed.innerHTML = resultsHTML;
    document.getElementById('projectsButtonInResults').addEventListener('click', () => {
      moreSection.classList.add('hidden');
      projectsSection.classList.remove('hidden');
    });
  }, 4000);
});

toggleBtn.addEventListener('click', () => {
  const willBeHidden = !sleekTerminal.classList.contains('hidden');
  sleekTerminal.classList.toggle('hidden');
  if (willBeHidden) { while (commandHistory.firstChild) commandHistory.removeChild(commandHistory.firstChild); }
});

const appendCommandEntry = (command, status) => {
  const entry = document.createElement('div');
  entry.className = 'command-entry';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let badgeClass = 'command-badge';
  if (command === 'rainbow' && status === 'activated') badgeClass = 'rainbow-badge';
  entry.innerHTML = `<span class="${badgeClass}">${command}</span><span class="command-timestamp">${timeStr}</span>`;
  commandHistory.prepend(entry);
  while (commandHistory.children.length > 10) commandHistory.removeChild(commandHistory.lastElementChild);
};

const appendErrorEntry = (text) => {
  const entry = document.createElement('div');
  entry.className = 'command-entry';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.innerHTML = `<span class="error-badge">${text}</span><span class="command-timestamp">${timeStr}</span>`;
  commandHistory.prepend(entry);
  while (commandHistory.children.length > 10) commandHistory.removeChild(commandHistory.lastElementChild);
};

const executePing = async () => {
  const start = performance.now();
  try {
    await axios.get('https://httpbin.org/json');
    appendCommandEntry(`ping: ${Math.round(performance.now() - start)}ms`, 'success');
  } catch { appendErrorEntry('ping failed'); }
};

const startRainbow = () => {
  if (rainbowActive) { appendErrorEntry('rainbow already active'); return; }
  rainbowActive = true;
  appendCommandEntry('rainbow', 'activated');
  const colors = ['#ff0000', '#ff9900', '#ffff00', '#33ff00', '#0099ff', '#6633ff', '#ff33ff'];
  let index = 0;
  const mouseHandler = (e) => {
    if (!rainbowActive) return;
    const particle = document.createElement('div');
    particle.className = 'rainbow-particle';
    particle.style.left = e.clientX - 5 + 'px';
    particle.style.top = e.clientY - 5 + 'px';
    particle.style.backgroundColor = colors[index % colors.length];
    particle.style.boxShadow = `0 0 10px ${colors[index % colors.length]}`;
    document.body.appendChild(particle);
    index++;
    setTimeout(() => { if (particle.parentNode) particle.remove(); }, 1000);
  };
  document.addEventListener('mousemove', mouseHandler);
  setTimeout(() => {
    if (rainbowActive) {
      document.removeEventListener('mousemove', mouseHandler);
      rainbowActive = false;
      appendCommandEntry('rainbow ended', 'success');
    }
  }, 30000);
};

commandInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const value = commandInput.value.trim().toLowerCase();
    if (value === '') return;
    if (value === 'ping') { executePing(); }
    else if (value === 'rainbow') { startRainbow(); }
    else { appendErrorEntry(`unknown: ${value}`); }
    commandInput.value = '';
  }
});

fetchOssed();
startUpdates();
