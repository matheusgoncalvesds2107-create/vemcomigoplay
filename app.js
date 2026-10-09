/* =========================================================
   VEM COMIGO PLAY
   SITE PÚBLICO
   PLAYER + ÁLBUNS + LETRAS
   FAVORITOS + PLAYLISTS + REPEAT + DOWNLOAD
========================================================= */

const SUPABASE_URL =
  "https://rtlkifpsoviwxgwbbuet.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_p95BIFIlAQ02aZYVdDKaNQ_mjtXSBYK";

const $ = (selector) =>
  document.querySelector(selector);

const audio =
  $("#audio");


/* =========================================================
   ESTADO PRINCIPAL
========================================================= */

let tracks = [];

let filteredTracks = [];

let queue = [];

let currentIndex = 0;

let currentTrack = null;

let currentAlbumTracks = [];

let currentAlbum = null;

let currentLyricsTrack = null;

let lyricsPreviousView =
  "home";


/* =========================================================
   BIBLIOTECA LOCAL
========================================================= */

const FAVORITES_KEY =
  "vcplay-favorites";

const PLAYLISTS_KEY =
  "vcplay-playlists";

const REPEAT_KEY =
  "vcplay-repeat-mode";


let favorites =
  loadJson(
    FAVORITES_KEY,
    []
  );


let playlists =
  loadJson(
    PLAYLISTS_KEY,
    []
  );


let repeatMode =
  localStorage.getItem(
    REPEAT_KEY
  ) || "off";


let playlistModalTrack =
  null;


let currentPlaylist =
  null;


/* =========================================================
   JSON LOCAL
========================================================= */

function loadJson(
  key,
  fallback
) {

  try {

    const saved =
      localStorage.getItem(
        key
      );

    if (!saved) {
      return fallback;
    }

    return JSON.parse(
      saved
    );

  } catch {

    return fallback;

  }

}


function saveFavorites() {

  localStorage.setItem(
    FAVORITES_KEY,
    JSON.stringify(
      favorites
    )
  );

}


function savePlaylists() {

  localStorage.setItem(
    PLAYLISTS_KEY,
    JSON.stringify(
      playlists
    )
  );

}


/* =========================================================
   UTILIDADES
========================================================= */

function formatTime(
  seconds
) {

  if (
    !Number.isFinite(
      seconds
    )
  ) {

    return "0:00";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    Math.floor(
      seconds % 60
    );


  return (
    `${minutes}:` +
    String(secs)
      .padStart(
        2,
        "0"
      )
  );

}


function escapeHtml(
  text = ""
) {

  return String(text)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


function hasLyrics(
  track
) {

  return Boolean(

    track &&

    track.lyrics &&

    track.lyrics.trim()

  );

}


function realCover(
  cover
) {

  return Boolean(

    cover &&

    !String(cover)
      .includes(
        "logo-play.png"
      )

  );

}


/* =========================================================
   NORMALIZAR TRACK
========================================================= */

function normalizeTrack(
  track
) {

  return {

    id:
      track.id,

    title:
      track.title,

    artist:
      track.artist,

    album:
      track.album,

    category:
      track.category,

    type:
      track.type ||
      "music",

    audioUrl:
      track.audio_url,

    downloadUrl:
      track.audio_url,

    cover:
      track.cover_url ||
      "logo-play.png",

    createdAt:
      track.created_at,

    lyrics:
      track.lyrics ||
      "",

    lyricsGenerated:
      Boolean(
        track.lyrics_generated
      ),

    lyricsSynced:
      track.lyrics_synced ||
      null

  };

}


/* =========================================================
   FAVORITOS
========================================================= */

function isFavorite(
  trackId
) {

  return favorites.some(
    id =>
      String(id) ===
      String(trackId)
  );

}


function toggleFavorite(
  trackId
) {

  if (
    isFavorite(
      trackId
    )
  ) {

    favorites =
      favorites.filter(
        id =>
          String(id) !==
          String(trackId)
      );

  }

  else {

    favorites.push(
      trackId
    );

  }


  saveFavorites();

  updateFavoriteButton();

  renderFavorites();

  refreshVisibleTracks();

}


function updateFavoriteButton() {

  const button =
    $("#favoriteCurrent");


  if (!button) {
    return;
  }


  if (!currentTrack) {

    button.textContent =
      "♡";

    button.classList
      .remove(
        "active"
      );

    return;
  }


  if (
    isFavorite(
      currentTrack.id
    )
  ) {

    button.textContent =
      "♥";

    button.classList
      .add(
        "active"
      );

    button.title =
      "Remover dos favoritos";

  }

  else {

    button.textContent =
      "♡";

    button.classList
      .remove(
        "active"
      );

    button.title =
      "Adicionar aos favoritos";

  }

}


/* =========================================================
   REPEAT
========================================================= */

function updateRepeatButton() {

  const button =
    $("#repeatButton");


  if (!button) {
    return;
  }


  button.classList
    .remove(
      "active"
    );


  if (
    repeatMode ===
    "off"
  ) {

    button.textContent =
      "🔁";

    button.title =
      "Repetição desligada";

  }


  if (
    repeatMode ===
    "all"
  ) {

    button.textContent =
      "🔁";

    button.title =
      "Repetir fila";

    button.classList
      .add(
        "active"
      );

  }


  if (
    repeatMode ===
    "one"
  ) {

    button.textContent =
      "🔂";

    button.title =
      "Repetir esta música";

    button.classList
      .add(
        "active"
      );

  }

}


function cycleRepeatMode() {

  if (
    repeatMode ===
    "off"
  ) {

    repeatMode =
      "all";

  }

  else if (
    repeatMode ===
    "all"
  ) {

    repeatMode =
      "one";

  }

  else {

    repeatMode =
      "off";

  }


  localStorage.setItem(
    REPEAT_KEY,
    repeatMode
  );


  updateRepeatButton();

}


/* =========================================================
   DOWNLOAD ATUAL
========================================================= */

function updateDownloadButton() {

  const link =
    $("#downloadCurrent");


  if (!link) {
    return;
  }


  if (
    !currentTrack ||
    !currentTrack.downloadUrl
  ) {

    link.href =
      "#";

    link.removeAttribute(
      "download"
    );

    link.style.opacity =
      ".45";

    return;

  }


  link.href =
    currentTrack.downloadUrl;


  link.setAttribute(
    "download",
    `${currentTrack.artist} - ${currentTrack.title}.mp3`
  );


  link.style.opacity =
    "1";

}


/* =========================================================
   PLAYER
========================================================= */

function playById(
  id
) {

  const found =
    tracks.find(
      track =>
        String(track.id) ===
        String(id)
    );


  if (!found) {
    return;
  }


  currentTrack =
    found;


  if (
    currentAlbumTracks.length &&

    currentAlbumTracks.some(
      track =>
        String(track.id) ===
        String(id)
    )
  ) {

    queue =
      [
        ...currentAlbumTracks
      ];

  }

  else if (
    currentPlaylist &&
    currentPlaylist.tracks
  ) {

    const playlistTracks =
      getTracksFromIds(
        currentPlaylist.tracks
      );


    if (
      playlistTracks.some(
        track =>
          String(track.id) ===
          String(id)
      )
    ) {

      queue =
        playlistTracks;

    }

    else {

      currentPlaylist =
        null;

    }

  }


  if (
    !queue.length ||
    !queue.some(
      track =>
        String(track.id) ===
        String(id)
    )
  ) {

    if (
      currentTrack.type ===
      "podcast"
    ) {

      queue =
        tracks.filter(
          track =>
            track.type ===
            "podcast"
        );

    }

    else {

      queue =
        tracks.filter(
          track =>
            track.type !==
            "podcast"
        );

    }

  }


  currentIndex =
    queue.findIndex(
      track =>
        String(track.id) ===
        String(id)
    );


  if (
    currentIndex < 0
  ) {

    currentIndex =
      0;

  }


  $("#kind").textContent =
    currentTrack.type ===
      "podcast"
      ? "PODCAST"
      : "LOUVOR";


  $("#title").textContent =
    currentTrack.title;


  $("#artist").textContent =
    `${currentTrack.artist} • ${currentTrack.album || ""}`;


  $("#cover").src =
    currentTrack.cover ||
    "logo-play.png";


  updateFavoriteButton();

  updateDownloadButton();

  updateMediaSession();


  if (
    !currentTrack.audioUrl
  ) {

    $("#artist").textContent =
      `${currentTrack.artist} • áudio indisponível`;

    return;

  }


  audio.src =
    currentTrack.audioUrl;


  audio
    .play()
    .catch(
      error => {

        console.log(
          "Reprodução aguardando interação:",
          error
        );

      }
    );

}


/* =========================================================
   PRÓXIMA
========================================================= */

function nextTrack() {

  if (!queue.length) {
    return;
  }


  if (
    currentIndex <
    queue.length - 1
  ) {

    currentIndex++;

    playById(
      queue[
        currentIndex
      ].id
    );

    return;

  }


  if (
    repeatMode ===
    "all"
  ) {

    currentIndex =
      0;

    playById(
      queue[0].id
    );

    return;

  }


  audio.pause();

  audio.currentTime =
    0;

}


/* =========================================================
   ANTERIOR
========================================================= */

function previousTrack() {

  if (!queue.length) {
    return;
  }


  if (
    audio.currentTime >
    4
  ) {

    audio.currentTime =
      0;

    return;

  }


  currentIndex--;


  if (
    currentIndex < 0
  ) {

    if (
      repeatMode ===
      "all"
    ) {

      currentIndex =
        queue.length - 1;

    }

    else {

      currentIndex =
        0;

    }

  }


  playById(
    queue[
      currentIndex
    ].id
  );

}


/* =========================================================
   FIM DA MÚSICA
========================================================= */

audio.onended =
  () => {

    if (
      repeatMode ===
      "one"
    ) {

      audio.currentTime =
        0;

      audio.play();

      return;

    }


    nextTrack();

  };


/* =========================================================
   PLAY / PAUSE
========================================================= */

$("#play").onclick =
  () => {

    if (!currentTrack) {

      const first =
        tracks.find(
          track =>
            track.type !==
            "podcast"
        );


      if (first) {

        playById(
          first.id
        );

      }

      return;

    }


    if (
      audio.paused
    ) {

      audio.play();

    }

    else {

      audio.pause();

    }

  };


$("#next").onclick =
  nextTrack;


$("#prev").onclick =
  previousTrack;


audio.onplay =
  () => {

    $("#play").textContent =
      "⏸";

  };


audio.onpause =
  () => {

    $("#play").textContent =
      "▶";

  };


/* =========================================================
   TEMPO
========================================================= */

audio.onloadedmetadata =
  () => {

    $("#dur").textContent =
      formatTime(
        audio.duration
      );

  };


audio.ontimeupdate =
  () => {

    $("#cur").textContent =
      formatTime(
        audio.currentTime
      );


    if (
      audio.duration
    ) {

      $("#seek").value =
        String(
          (
            audio.currentTime /
            audio.duration
          ) * 100
        );

    }

  };


$("#seek").oninput =
  event => {

    if (
      !audio.duration
    ) {
      return;
    }


    audio.currentTime =
      (
        Number(
          event.target.value
        ) /
        100
      ) *
      audio.duration;

  };


/* =========================================================
   VOLUME
========================================================= */

audio.volume =
  0.85;


$("#volume").oninput =
  event => {

    audio.volume =
      Number(
        event.target.value
      );

  };


/* =========================================================
   FAVORITO ATUAL
========================================================= */

$("#favoriteCurrent").onclick =
  () => {

    if (!currentTrack) {
      return;
    }


    toggleFavorite(
      currentTrack.id
    );

  };


/* =========================================================
   REPETIR
========================================================= */

$("#repeatButton").onclick =
  cycleRepeatMode;


/* =========================================================
   DOWNLOAD
========================================================= */

$("#downloadCurrent").onclick =
  event => {

    if (
      !currentTrack ||
      !currentTrack.downloadUrl
    ) {

      event.preventDefault();

    }

  };


/* =========================================================
   PLAYLISTS
========================================================= */

function createPlaylist(
  name
) {

  const clean =
    String(name || "")
      .trim();


  if (!clean) {
    return null;
  }


  const playlist = {

    id:
      `playlist-${Date.now()}`,

    name:
      clean,

    tracks:
      []

  };


  playlists.push(
    playlist
  );


  savePlaylists();

  renderPlaylists();

  return playlist;

}


function getTracksFromIds(
  ids
) {

  return ids

    .map(
      id =>
        tracks.find(
          track =>
            String(track.id) ===
            String(id)
        )
    )

    .filter(Boolean);

}


function addTrackToPlaylist(
  playlistId,
  trackId
) {

  const playlist =
    playlists.find(
      item =>
        item.id ===
        playlistId
    );


  if (!playlist) {
    return;
  }


  if (
    playlist.tracks.some(
      id =>
        String(id) ===
        String(trackId)
    )
  ) {

    alert(
      "Essa música já está nessa playlist."
    );

    return;

  }


  playlist.tracks.push(
    trackId
  );


  savePlaylists();

  renderPlaylists();

  closePlaylistModal();

}


function removeTrackFromPlaylist(
  playlistId,
  trackId
) {

  const playlist =
    playlists.find(
      item =>
        item.id ===
        playlistId
    );


  if (!playlist) {
    return;
  }


  playlist.tracks =
    playlist.tracks.filter(
      id =>
        String(id) !==
        String(trackId)
    );


  savePlaylists();


  if (
    currentPlaylist &&
    currentPlaylist.id ===
    playlistId
  ) {

    currentPlaylist =
      playlist;

    renderCurrentPlaylist();

  }

}


/* =========================================================
   MODAL PLAYLIST
========================================================= */

function openPlaylistModal(
  trackId
) {

  const track =
    tracks.find(
      item =>
        String(item.id) ===
        String(trackId)
    );


  if (!track) {
    return;
  }


  playlistModalTrack =
    track;


  $("#playlistModalTrack")
    .textContent =
    `${track.artist} — ${track.title}`;


  renderPlaylistChoices();


  $("#playlistModal")
    .classList
    .remove(
      "hidden"
    );

}


function closePlaylistModal() {

  $("#playlistModal")
    .classList
    .add(
      "hidden"
    );


  playlistModalTrack =
    null;

}


function renderPlaylistChoices() {

  const container =
    $("#playlistChoices");


  if (!playlists.length) {

    container.innerHTML =
      `
      <div class="empty">
        Nenhuma playlist criada ainda.
      </div>
      `;

    return;

  }


  container.innerHTML =
    playlists
      .map(
        playlist =>
          `
          <button
            class="playlist-choice"
            data-id="${playlist.id}"
          >
            ♪ ${escapeHtml(
              playlist.name
            )}
            •
            ${playlist.tracks.length}
            ${
              playlist.tracks.length ===
              1
                ? "música"
                : "músicas"
            }
          </button>
          `
      )
      .join("");


  container
    .querySelectorAll(
      ".playlist-choice"
    )
    .forEach(
      button => {

        button.onclick =
          () => {

            if (
              !playlistModalTrack
            ) {
              return;
            }


            addTrackToPlaylist(
              button.dataset.id,
              playlistModalTrack.id
            );

          };

      }
    );

}


$("#closePlaylistModal")
  .onclick =
  closePlaylistModal;


$("#playlistModal")
  .onclick =
  event => {

    if (
      event.target.id ===
      "playlistModal"
    ) {

      closePlaylistModal();

    }

  };


$("#newPlaylistFromModal")
  .onclick =
  () => {

    const name =
      prompt(
        "Nome da nova playlist:"
      );


    const playlist =
      createPlaylist(
        name
      );


    if (
      playlist &&
      playlistModalTrack
    ) {

      addTrackToPlaylist(
        playlist.id,
        playlistModalTrack.id
      );

    }

  };


$("#playlistCurrent")
  .onclick =
  () => {

    if (!currentTrack) {
      return;
    }


    openPlaylistModal(
      currentTrack.id
    );

  };


/* =========================================================
   BIBLIOTECA
========================================================= */

function hideMainViews() {

  [
    "#homeHero",
    "#artistsSection",
    "#albumsSection",
    "#featuredSection",
    "#albumView",
    "#lyricsView",
    "#playlistView"
  ]
    .forEach(
      selector => {

        const el =
          $(selector);


        if (el) {

          el.classList
            .add(
              "hidden"
            );

        }

      }
    );

}


function showHome() {

  hideMainViews();


  [
    "#homeHero",
    "#artistsSection",
    "#albumsSection",
    "#featuredSection"
  ]
    .forEach(
      selector => {

        $(selector)
          ?.classList
          .remove(
            "hidden"
          );

      }
    );


  $("#librarySection")
    ?.classList
    .add(
      "hidden"
    );

}


/* =========================================================
   ABRIR BIBLIOTECA
========================================================= */

function openLibrary() {

  hideMainViews();


  $("#librarySection")
    .classList
    .remove(
      "hidden"
    );


  showFavoritesTab();


  window.scrollTo({
    top:
      0,

    behavior:
      "smooth"
  });

}


$("#libraryToggle")
  .onclick =
  openLibrary;


$("#closeLibrary")
  .onclick =
  showHome;


/* =========================================================
   FAVORITOS
========================================================= */

function renderFavorites() {

  const container =
    $("#favoritesList");


  if (!container) {
    return;
  }


  const favoriteTracks =
    tracks.filter(
      track =>
        isFavorite(
          track.id
        )
    );


  if (
    !favoriteTracks.length
  ) {

    container.innerHTML =
      `
      <div class="empty">
        Você ainda não adicionou favoritos.
      </div>
      `;

    return;

  }


  renderTrackList(
    container,
    favoriteTracks,
    {
      showRemoveFavorite:
        true
    }
  );

}


function showFavoritesTab() {

  $("#favoritesTab")
    .classList
    .add(
      "active"
    );


  $("#playlistsTab")
    .classList
    .remove(
      "active"
    );


  $("#favoritesView")
    .classList
    .remove(
      "hidden"
    );


  $("#playlistsView")
    .classList
    .add(
      "hidden"
    );


  renderFavorites();

}


function showPlaylistsTab() {

  $("#favoritesTab")
    .classList
    .remove(
      "active"
    );


  $("#playlistsTab")
    .classList
    .add(
      "active"
    );


  $("#favoritesView")
    .classList
    .add(
      "hidden"
    );


  $("#playlistsView")
    .classList
    .remove(
      "hidden"
    );


  renderPlaylists();

}


$("#favoritesTab")
  .onclick =
  showFavoritesTab;


$("#playlistsTab")
  .onclick =
  showPlaylistsTab;


/* =========================================================
   TOCAR FAVORITOS
========================================================= */

$("#playFavorites")
  .onclick =
  () => {

    const favoriteTracks =
      tracks.filter(
        track =>
          isFavorite(
            track.id
          )
      );


    if (
      !favoriteTracks.length
    ) {
      return;
    }


    currentPlaylist =
      null;


    currentAlbumTracks =
      [];


    queue =
      favoriteTracks;


    currentIndex =
      0;


    playById(
      queue[0].id
    );

  };


/* =========================================================
   PLAYLISTS DA BIBLIOTECA
========================================================= */

function renderPlaylists() {

  const container =
    $("#playlistsGrid");


  if (!container) {
    return;
  }


  if (!playlists.length) {

    container.innerHTML =
      `
      <div class="empty">
        Nenhuma playlist criada.
      </div>
      `;

    return;

  }


  container.innerHTML =
    playlists
      .map(
        playlist =>
          `
          <article
            class="album-card playlist-card"
            data-id="${playlist.id}"
          >

            <div
              class="album-cover"
              style="
                display:grid;
                place-items:center;
                font-size:60px;
                color:#f0ad2f;
              "
            >
              ♪
            </div>

            <div class="album-info">

              <strong>
                ${escapeHtml(
                  playlist.name
                )}
              </strong>

              <span>
                ${playlist.tracks.length}
                ${
                  playlist.tracks.length ===
                  1
                    ? "música"
                    : "músicas"
                }
              </span>

            </div>

          </article>
          `
      )
      .join("");


  container
    .querySelectorAll(
      ".playlist-card"
    )
    .forEach(
      card => {

        card.onclick =
          () =>
            openPlaylist(
              card.dataset.id
            );

      }
    );

}


$("#createPlaylistButton")
  .onclick =
  () => {

    const name =
      prompt(
        "Nome da nova playlist:"
      );


    if (
      createPlaylist(
        name
      )
    ) {

      showPlaylistsTab();

    }

  };


/* =========================================================
   ABRIR PLAYLIST
========================================================= */

function openPlaylist(
  playlistId
) {

  const playlist =
    playlists.find(
      item =>
        item.id ===
        playlistId
    );


  if (!playlist) {
    return;
  }


  currentPlaylist =
    playlist;


  hideMainViews();


  $("#librarySection")
    .classList
    .add(
      "hidden"
    );


  $("#playlistView")
    .classList
    .remove(
      "hidden"
    );


  renderCurrentPlaylist();


  window.scrollTo({
    top:
      0,

    behavior:
      "smooth"
  });

}


function renderCurrentPlaylist() {

  if (!currentPlaylist) {
    return;
  }


  const playlistTracks =
    getTracksFromIds(
      currentPlaylist.tracks
    );


  $("#playlistViewTitle")
    .textContent =
    currentPlaylist.name;


  $("#playlistViewMeta")
    .textContent =
    `${playlistTracks.length} ${
      playlistTracks.length === 1
        ? "música"
        : "músicas"
    }`;


  const container =
    $("#playlistTracks");


  if (
    !playlistTracks.length
  ) {

    container.innerHTML =
      `
      <div class="empty">
        Essa playlist está vazia.
      </div>
      `;

    return;

  }


  renderTrackList(
    container,
    playlistTracks,
    {
      playlistId:
        currentPlaylist.id
    }
  );

}


/* =========================================================
   VOLTAR PLAYLIST
========================================================= */

$("#backPlaylist")
  .onclick =
  () => {

    currentPlaylist =
      null;


    hideMainViews();


    $("#librarySection")
      .classList
      .remove(
        "hidden"
      );


    showPlaylistsTab();

  };


/* =========================================================
   TOCAR PLAYLIST
========================================================= */

$("#playlistPlay")
  .onclick =
  () => {

    if (!currentPlaylist) {
      return;
    }


    const list =
      getTracksFromIds(
        currentPlaylist.tracks
      );


    if (!list.length) {
      return;
    }


    queue =
      list;


    currentIndex =
      0;


    playById(
      queue[0].id
    );

  };


$("#playlistShuffle")
  .onclick =
  () => {

    if (!currentPlaylist) {
      return;
    }


    const list =
      getTracksFromIds(
        currentPlaylist.tracks
      );


    if (!list.length) {
      return;
    }


    const random =
      Math.floor(
        Math.random() *
        list.length
      );


    queue =
      list;


    currentIndex =
      random;


    playById(
      queue[random].id
    );

  };


/* =========================================================
   EXCLUIR PLAYLIST
========================================================= */

$("#deletePlaylist")
  .onclick =
  () => {

    if (!currentPlaylist) {
      return;
    }


    const ok =
      confirm(
        `Excluir a playlist "${currentPlaylist.name}"?`
      );


    if (!ok) {
      return;
    }


    playlists =
      playlists.filter(
        item =>
          item.id !==
          currentPlaylist.id
      );


    savePlaylists();


    currentPlaylist =
      null;


    hideMainViews();


    $("#librarySection")
      .classList
      .remove(
        "hidden"
      );


    showPlaylistsTab();

  };


/* =========================================================
   LISTA GENÉRICA DE FAIXAS
========================================================= */

function renderTrackList(
  container,
  list,
  options = {}
) {

  if (!container) {
    return;
  }


  container.innerHTML =
    list
      .map(
        (track, index) => {

          const favorite =
            isFavorite(
              track.id
            );


          return `
            <article
              class="track"
              data-id="${track.id}"
            >

              <div class="art">

                <img
                  src="${escapeHtml(
                    track.cover
                  )}"
                  alt="${escapeHtml(
                    track.title
                  )}"
                  onerror="this.src='logo-play.png'"
                >

              </div>


              <div class="info">

                <strong>
                  ${options.numbered
                    ? `${index + 1}. `
                    : ""
                  }
                  ${escapeHtml(
                    track.title
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    track.artist
                  )}
                  •
                  ${escapeHtml(
                    track.album ||
                    track.category
                  )}
                </span>

              </div>


              <div class="actions">

                <button
                  class="playOne"
                  title="Tocar"
                >
                  ▶
                </button>


                <button
                  class="favoriteTrack"
                  title="Favorito"
                >
                  ${favorite
                    ? "♥"
                    : "♡"
                  }
                </button>


                <button
                  class="addPlaylistTrack"
                  title="Adicionar à playlist"
                >
                  ＋
                </button>


                ${
                  hasLyrics(track)
                    ? `
                      <button
                        class="lyrics-button"
                        title="Letra"
                      >
                        🎤
                      </button>
                    `
                    : ""
                }


                ${
                  track.downloadUrl
                    ? `
                      <a
                        href="${escapeHtml(
                          track.downloadUrl
                        )}"
                        download
                        title="Baixar"
                        onclick="event.stopPropagation()"
                      >
                        ⇩
                      </a>
                    `
                    : ""
                }


                ${
                  options.playlistId
                    ? `
                      <button
                        class="removePlaylistTrack"
                        title="Remover da playlist"
                      >
                        ✕
                      </button>
                    `
                    : ""
                }

              </div>

            </article>
          `;

        }
      )
      .join("");


  bindTrackButtons(
    container,
    options
  );

}


/* =========================================================
   EVENTOS DAS FAIXAS
========================================================= */

function bindTrackButtons(
  container,
  options = {}
) {

  container
    .querySelectorAll(
      ".track"
    )
    .forEach(
      element => {

        const id =
          element.dataset.id;


        element
          .querySelector(
            ".playOne"
          )
          ?.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              playById(
                id
              );

            }
          );


        element
          .querySelector(
            ".favoriteTrack"
          )
          ?.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              toggleFavorite(
                id
              );

            }
          );


        element
          .querySelector(
            ".addPlaylistTrack"
          )
          ?.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              openPlaylistModal(
                id
              );

            }
          );


        element
          .querySelector(
            ".lyrics-button"
          )
          ?.addEventListener(
            "click",
            event => {

              event.stopPropagation();

              const fromAlbum =
                !$("#albumView")
                  ?.classList
                  .contains(
                    "hidden"
                  );


              openLyricsView(
                id,
                fromAlbum
                  ? "album"
                  : "home"
              );

            }
          );


        element
          .querySelector(
            ".removePlaylistTrack"
          )
          ?.addEventListener(
            "click",
            event => {

              event.stopPropagation();


              if (
                options.playlistId
              ) {

                removeTrackFromPlaylist(
                  options.playlistId,
                  id
                );

              }

            }
          );


        element
          .querySelector(
            ".info"
          )
          ?.addEventListener(
            "click",
            () => {

              playById(
                id
              );

            }
          );

      }
    );

}


/* =========================================================
   CATÁLOGO
========================================================= */

function renderCatalog(
  list
) {

  filteredTracks =
    list;


  const container =
    $("#catalog");


  if (!list.length) {

    container.innerHTML =
      `
      <div class="empty">
        Nenhuma música encontrada.
      </div>
      `;

    return;

  }


  renderTrackList(
    container,
    list
  );

}


/* =========================================================
   ATUALIZAR TELAS VISÍVEIS
========================================================= */

function refreshVisibleTracks() {

  renderCatalog(
    filteredTracks.length
      ? filteredTracks
      : tracks
  );


  if (
    currentAlbumTracks.length
  ) {

    renderAlbumTracks(
      currentAlbumTracks
    );

  }


  if (
    currentPlaylist
  ) {

    renderCurrentPlaylist();

  }

}


/* =========================================================
   BUSCA
========================================================= */

$("#searchToggle")
  .onclick =
  () => {

    $("#searchBox")
      .classList
      .toggle(
        "hidden"
      );


    if (
      !$("#searchBox")
        .classList
        .contains(
          "hidden"
        )
    ) {

      $("#searchInput")
        .focus();

    }

  };


$("#searchInput")
  .oninput =
  event => {

    const query =
      event.target.value
        .toLowerCase()
        .trim();


    const filtered =
      tracks.filter(
        track => {

          const text =
            `
            ${track.title}
            ${track.artist}
            ${track.album || ""}
            ${track.category}
            `
              .toLowerCase();


          return text.includes(
            query
          );

        }
      );


    showHome();


    renderCatalog(
      filtered
    );

  };


/* =========================================================
   CATEGORIAS
========================================================= */

document
  .querySelectorAll(
    ".chips button"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          document
            .querySelectorAll(
              ".chips button"
            )
            .forEach(
              other =>
                other.classList
                  .remove(
                    "active"
                  )
            );


          button.classList
            .add(
              "active"
            );


          const category =
            button.dataset.cat;


          showHome();


          if (
            category ===
            "Todos"
          ) {

            renderArtists();

            renderAlbums();

            renderCatalog(
              tracks
            );

            return;

          }


          const filtered =
            tracks.filter(
              track =>
                track.category ===
                category
            );


          renderCatalog(
            filtered
          );


          renderAlbumsByTracks(
            filtered
          );

        };

    }
  );


/* =========================================================
   HERO
========================================================= */

$("#heroPlay")
  .onclick =
  () => {

    const first =
      tracks.find(
        track =>
          track.type !==
          "podcast"
      );


    if (first) {

      currentAlbumTracks =
        [];

      currentPlaylist =
        null;

      playById(
        first.id
      );

    }

  };


$("#heroShuffle")
  .onclick =
  () => {

    const musics =
      tracks.filter(
        track =>
          track.type !==
          "podcast"
      );


    if (!musics.length) {
      return;
    }


    const random =
      musics[
        Math.floor(
          Math.random() *
          musics.length
        )
      ];


    currentAlbumTracks =
      [];

    currentPlaylist =
      null;


    playById(
      random.id
    );

  };


$("#playAll")
  .onclick =
  () => {

    const list =
      filteredTracks.filter(
        track =>
          track.type !==
          "podcast"
      );


    if (!list.length) {
      return;
    }


    currentAlbumTracks =
      [];

    currentPlaylist =
      null;

    queue =
      list;

    currentIndex =
      0;


    playById(
      queue[0].id
    );

  };


/* =========================================================
   ARTISTAS
========================================================= */

function getArtistCover(
  artistName
) {

  const artistTracks =
    tracks.filter(
      track =>
        track.artist ===
        artistName
    );


  const real =
    artistTracks.find(
      track =>
        realCover(
          track.cover
        )
    );


  return real
    ? real.cover
    : (
      artistTracks[0]?.cover ||
      "logo-play.png"
    );

}


function renderArtists() {

  const container =
    $("#artistsGrid");


  const artists =
    [
      ...new Set(

        tracks

          .filter(
            track =>
              track.type !==
              "podcast"
          )

          .map(
            track =>
              track.artist
          )

      )
    ];


  if (!artists.length) {

    container.innerHTML =
      `
      <div class="empty">
        Nenhum artista publicado.
      </div>
      `;

    return;

  }


  container.innerHTML =
    artists
      .map(
        artist => {

          const artistTracks =
            tracks.filter(
              track =>
                track.artist ===
                  artist &&
                track.type !==
                  "podcast"
            );


          const albums =
            new Set(
              artistTracks.map(
                track =>
                  track.album
              )
            );


          return `
            <article
              class="artist-card"
              data-artist="${escapeHtml(
                artist
              )}"
            >

              <div class="artist-cover">

                <img
                  src="${escapeHtml(
                    getArtistCover(
                      artist
                    )
                  )}"
                  alt="${escapeHtml(
                    artist
                  )}"
                  onerror="this.src='logo-play.png'"
                >

              </div>

              <div class="artist-info">

                <strong>
                  ${escapeHtml(
                    artist
                  )}
                </strong>

                <span>
                  ${albums.size}
                  ${
                    albums.size === 1
                      ? "álbum"
                      : "álbuns"
                  }
                </span>

              </div>

            </article>
          `;

        }
      )
      .join("");


  container
    .querySelectorAll(
      ".artist-card"
    )
    .forEach(
      card => {

        card.onclick =
          () => {

            const artist =
              card.dataset.artist;


            renderAlbums(
              artist
            );


            renderCatalog(
              tracks.filter(
                track =>
                  track.artist ===
                  artist
              )
            );


            $("#albumsSection")
              .scrollIntoView({
                behavior:
                  "smooth",
                block:
                  "start"
              });

          };

      }
    );

}


/* =========================================================
   ÁLBUNS
========================================================= */

function makeAlbumMap(
  sourceTracks
) {

  const albumMap =
    new Map();


  sourceTracks

    .filter(
      track =>
        track.type !==
        "podcast"
    )

    .forEach(
      track => {

        const key =
          `${track.artist}|||${track.album}`;


        if (
          !albumMap.has(
            key
          )
        ) {

          albumMap.set(
            key,
            {

              artist:
                track.artist,

              album:
                track.album,

              category:
                track.category,

              cover:
                realCover(
                  track.cover
                )
                  ? track.cover
                  : "logo-play.png",

              tracks:
                []

            }
          );

        }


        const albumData =
          albumMap.get(
            key
          );


        albumData.tracks
          .push(
            track
          );


        if (
          !realCover(
            albumData.cover
          ) &&
          realCover(
            track.cover
          )
        ) {

          albumData.cover =
            track.cover;

        }

      }
    );


  return Array.from(
    albumMap.values()
  );

}


function renderAlbums(
  selectedArtist = ""
) {

  let source =
    tracks;


  if (selectedArtist) {

    source =
      tracks.filter(
        track =>
          track.artist ===
          selectedArtist
      );

  }


  renderAlbumsByTracks(
    source
  );

}


function renderAlbumsByTracks(
  source
) {

  const container =
    $("#albumsGrid");


  const albums =
    makeAlbumMap(
      source
    );


  if (!albums.length) {

    container.innerHTML =
      `
      <div class="empty">
        Nenhum álbum publicado.
      </div>
      `;

    return;

  }


  container.innerHTML =
    albums
      .map(
        album =>
          `
          <article
            class="album-card"
            data-artist="${escapeHtml(
              album.artist
            )}"
            data-album="${escapeHtml(
              album.album
            )}"
          >

            <div class="album-cover">

              <img
                src="${escapeHtml(
                  album.cover
                )}"
                alt="${escapeHtml(
                  album.album
                )}"
                onerror="this.src='logo-play.png'"
              >

            </div>

            <div class="album-info">

              <strong>
                ${escapeHtml(
                  album.album
                )}
              </strong>

              <span>
                ${escapeHtml(
                  album.artist
                )}
              </span>

              <span>
                ${album.tracks.length}
                ${
                  album.tracks.length ===
                  1
                    ? "faixa"
                    : "faixas"
                }
              </span>

            </div>

          </article>
          `
      )
      .join("");


  container
    .querySelectorAll(
      ".album-card"
    )
    .forEach(
      card => {

        card.onclick =
          () =>
            openAlbumView(

              card.dataset.artist,

              card.dataset.album

            );

      }
    );

}


/* =========================================================
   ÁLBUM
========================================================= */

function openAlbumView(
  artistName,
  albumName
) {

  const albumTracks =
    tracks.filter(
      track =>
        track.artist ===
          artistName &&
        track.album ===
          albumName
    );


  if (!albumTracks.length) {
    return;
  }


  currentAlbumTracks =
    [
      ...albumTracks
    ];


  const coverTrack =
    albumTracks.find(
      track =>
        realCover(
          track.cover
        )
    );


  currentAlbum = {

    artist:
      artistName,

    album:
      albumName,

    cover:
      coverTrack?.cover ||
      albumTracks[0]
        .cover ||
      "logo-play.png",

    category:
      albumTracks[0]
        .category

  };


  currentPlaylist =
    null;


  $("#albumViewCover")
    .src =
    currentAlbum.cover;


  $("#albumViewTitle")
    .textContent =
    currentAlbum.album;


  $("#albumViewArtist")
    .textContent =
    currentAlbum.artist;


  $("#albumViewMeta")
    .textContent =
    `${currentAlbum.category} • ${albumTracks.length} ${
      albumTracks.length ===
      1
        ? "faixa"
        : "faixas"
    }`;


  renderAlbumTracks(
    albumTracks
  );


  hideMainViews();


  $("#librarySection")
    .classList
    .add(
      "hidden"
    );


  $("#albumView")
    .classList
    .remove(
      "hidden"
    );


  window.scrollTo({
    top:
      0,
    behavior:
      "smooth"
  });

}


function renderAlbumTracks(
  list
) {

  renderTrackList(
    $("#albumTracks"),
    list,
    {
      numbered:
        true
    }
  );

}


$("#backAlbum")
  .onclick =
  () => {

    currentAlbum =
      null;

    currentAlbumTracks =
      [];

    showHome();

  };


$("#albumPlay")
  .onclick =
  () => {

    if (
      !currentAlbumTracks.length
    ) {
      return;
    }


    queue =
      [
        ...currentAlbumTracks
      ];


    currentIndex =
      0;


    playById(
      queue[0].id
    );

  };


$("#albumShuffle")
  .onclick =
  () => {

    if (
      !currentAlbumTracks.length
    ) {
      return;
    }


    const random =
      Math.floor(
        Math.random() *
        currentAlbumTracks.length
      );


    queue =
      [
        ...currentAlbumTracks
      ];


    currentIndex =
      random;


    playById(
      queue[random].id
    );

  };


/* =========================================================
   LETRAS
========================================================= */

function openLyricsView(
  trackId,
  previousView =
    "home"
) {

  const track =
    tracks.find(
      item =>
        String(item.id) ===
        String(trackId)
    );


  if (!track) {
    return;
  }


  if (
    !hasLyrics(
      track
    )
  ) {

    alert(
      "Essa música ainda não possui letra publicada."
    );

    return;
  }


  currentLyricsTrack =
    track;


  lyricsPreviousView =
    previousView;


  $("#lyricsCover")
    .src =
    track.cover ||
    "logo-play.png";


  $("#lyricsTitle")
    .textContent =
    track.title;


  $("#lyricsArtist")
    .textContent =
    track.artist;


  $("#lyricsAlbum")
    .textContent =
    track.album ||
    track.category ||
    "Vem Comigo Records";


  $("#lyricsText")
    .textContent =
    track.lyrics;


  hideMainViews();


  $("#librarySection")
    .classList
    .add(
      "hidden"
    );


  $("#lyricsView")
    .classList
    .remove(
      "hidden"
    );


  window.scrollTo({
    top:
      0,
    behavior:
      "smooth"
  });

}


$("#backLyrics")
  .onclick =
  () => {

    $("#lyricsView")
      .classList
      .add(
        "hidden"
      );


    currentLyricsTrack =
      null;


    if (
      lyricsPreviousView ===
      "album" &&
      currentAlbum
    ) {

      hideMainViews();


      $("#albumView")
        .classList
        .remove(
          "hidden"
        );

    }

    else {

      showHome();

    }

  };


$("#lyricsPlay")
  .onclick =
  () => {

    if (
      !currentLyricsTrack
    ) {
      return;
    }


    if (
      currentTrack &&
      String(
        currentTrack.id
      ) ===
      String(
        currentLyricsTrack.id
      )
    ) {

      if (
        audio.paused
      ) {

        audio.play();

      }

      else {

        audio.pause();

      }


      return;

    }


    playById(
      currentLyricsTrack.id
    );

  };


/* =========================================================
   MEDIA SESSION
========================================================= */

function updateMediaSession() {

  if (
    !currentTrack ||
    !(
      "mediaSession"
      in navigator
    )
  ) {

    return;

  }


  navigator.mediaSession.metadata =
    new MediaMetadata({

      title:
        currentTrack.title,

      artist:
        currentTrack.artist,

      album:
        currentTrack.album ||
        "Vem Comigo Records",

      artwork: [
        {
          src:
            currentTrack.cover ||
            "logo-play.png"
        }
      ]

    });

}


if (
  "mediaSession"
  in navigator
) {

  navigator.mediaSession
    .setActionHandler(
      "play",
      () =>
        audio.play()
    );


  navigator.mediaSession
    .setActionHandler(
      "pause",
      () =>
        audio.pause()
    );


  navigator.mediaSession
    .setActionHandler(
      "nexttrack",
      nextTrack
    );


  navigator.mediaSession
    .setActionHandler(
      "previoustrack",
      previousTrack
    );

}


/* =========================================================
   CARREGAR SUPABASE
========================================================= */

async function loadCatalog() {

  $("#catalog")
    .innerHTML =
    `
    <div class="empty">
      Carregando músicas...
    </div>
    `;


  try {

    const response =
      await fetch(

        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.asc`,

        {

          headers: {

            apikey:
              SUPABASE_ANON_KEY

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Não foi possível carregar o catálogo."
      );

    }


    tracks =
      data.map(
        normalizeTrack
      );


    filteredTracks =
      [
        ...tracks
      ];


    renderArtists();

    renderAlbums();

    renderCatalog(
      tracks
    );

    renderFavorites();

    renderPlaylists();

    updateRepeatButton();

    updateFavoriteButton();

    updateDownloadButton();


  } catch (error) {

    console.error(
      error
    );


    $("#catalog")
      .innerHTML =
      `
      <div class="empty">
        Não foi possível carregar o catálogo.
      </div>
      `;

  }

}


/* =========================================================
   INICIAR
========================================================= */

loadCatalog();
