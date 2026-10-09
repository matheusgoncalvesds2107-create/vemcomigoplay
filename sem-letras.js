/*
  VEM COMIGO PLAY — SEM LETRAS
  Compatível com:
  - site público (index.html + app.js)
  - painel (admin.html + admin.js)

  Objetivo:
  - remover letras/sincronizador do painel
  - no site: clicar na música abre a capa grande
  - simplificar ações da lista: Play + Favorito + Mais
  - manter Playlist e Download dentro de "Mais"
*/

(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  function injectCss() {
    if ($("#vcplay-sem-letras-style")) return;

    const style = document.createElement("style");
    style.id = "vcplay-sem-letras-style";
    style.textContent = `
      /* ===== VEM COMIGO PLAY: cores oficiais ===== */
      :root{
        --vc-navy:#020812;
        --vc-navy2:#071827;
        --vc-gold:#f0ad2f;
        --vc-gold2:#ffd36b;
        --vc-white:#ffffff;
      }

      /* ===== letras desativadas ===== */
      .lyrics-button,
      .lyrics-content{
        display:none !important;
      }

      /* ===== lista: 3 botões ===== */
      .track .actions{
        position:relative !important;
        display:flex !important;
        align-items:center !important;
        justify-content:flex-end !important;
        gap:6px !important;
        flex-wrap:nowrap !important;
        max-width:none !important;
      }

      .track .actions > .playOne,
      .track .actions > .favoriteTrack,
      .track .actions > .vc-more{
        width:38px !important;
        min-width:38px !important;
        height:38px !important;
        padding:0 !important;
        border-radius:50% !important;
        display:grid !important;
        place-items:center !important;
        border:1px solid #ffffff20 !important;
        background:linear-gradient(145deg,#132a43,#081522) !important;
        color:#fff !important;
        font-size:17px !important;
        box-shadow:inset 0 1px 0 #ffffff10,0 5px 16px #0005 !important;
      }

      .track .actions > .playOne{
        background:linear-gradient(145deg,var(--vc-gold2),var(--vc-gold)) !important;
        color:#07111c !important;
        border-color:#ffd36b !important;
        box-shadow:0 0 0 2px #f0ad2f18,0 6px 18px #f0ad2f35 !important;
      }

      .track .actions > .favoriteTrack{
        font-size:20px !important;
      }

      .track .actions > .vc-more{
        font-size:23px !important;
        line-height:1 !important;
      }

      /* originais ficam funcionais, porém saem da linha */
      .track .actions > .addPlaylistTrack,
      .track .actions > a[download],
      .track .actions > .removePlaylistTrack{
        display:none !important;
      }

      .vc-more-menu{
        position:absolute;
        top:44px;
        right:0;
        z-index:80;
        min-width:200px;
        padding:7px;
        border:1px solid #ffffff20;
        border-radius:14px;
        background:#071421f7;
        box-shadow:0 16px 42px #000b;
        backdrop-filter:blur(14px);
      }

      .vc-more-menu.hidden{
        display:none !important;
      }

      .vc-more-menu button{
        width:100%;
        min-height:42px;
        display:flex;
        align-items:center;
        gap:9px;
        padding:10px 12px;
        border:0;
        border-radius:10px;
        background:transparent;
        color:#fff;
        text-align:left;
        font-size:13px;
      }

      .vc-more-menu button:hover{
        background:#ffffff0d;
      }

      /* ===== tela da música / capa ===== */
      #lyricsView{
        padding:18px 14px 38px !important;
      }

      #lyricsView .lyrics-header{
        grid-template-columns:minmax(250px,380px) 1fr !important;
        gap:26px !important;
        align-items:center !important;
        border-color:#f0ad2f35 !important;
        background:
          radial-gradient(circle at 15% 15%,#f0ad2f20,transparent 30%),
          linear-gradient(145deg,#0d2237,#06101a) !important;
      }

      #lyricsView .lyrics-cover{
        border:1px solid #f0ad2f38 !important;
        box-shadow:0 20px 60px #0009 !important;
      }

      #lyricsView .lyrics-info small{
        color:var(--vc-gold) !important;
      }

      .vc-detail-actions{
        display:flex;
        flex-wrap:wrap;
        gap:9px;
        margin-top:15px;
      }

      .vc-detail-actions button{
        border-radius:999px;
        padding:11px 15px;
        border:1px solid #ffffff20;
        background:#ffffff0a;
        color:#fff;
        font-weight:800;
      }

      .vc-detail-actions .vc-main{
        background:linear-gradient(90deg,var(--vc-gold),var(--vc-gold2));
        color:#111;
        border:0;
      }

      /* ===== painel: elementos de letras fora ===== */
      body.vc-admin #lyricsTheme,
      body.vc-admin #lyrics,
      body.vc-admin #generateLyricsButton,
      body.vc-admin #clearLyricsButton,
      body.vc-admin #lyricsStatus{
        display:none !important;
      }

      body.vc-admin .vc-hidden-lyrics{
        display:none !important;
      }

      @media(max-width:700px){
        #lyricsView .lyrics-header{
          grid-template-columns:1fr !important;
          padding:16px !important;
        }

        #lyricsView .lyrics-cover{
          max-width:330px !important;
          margin:auto !important;
        }

        #lyricsView .lyrics-info{
          text-align:center !important;
        }

        .vc-detail-actions{
          justify-content:center !important;
        }

        .track .actions{
          gap:4px !important;
        }

        .track .actions > .playOne,
        .track .actions > .favoriteTrack,
        .track .actions > .vc-more{
          width:34px !important;
          min-width:34px !important;
          height:34px !important;
        }

        .vc-more-menu{
          top:40px;
          right:0;
          min-width:185px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function hideAdminLyrics() {
    const form = $("#musicForm");
    if (!form) return false;

    document.body.classList.add("vc-admin");

    const ids = [
      "#lyricsTheme",
      "#lyrics",
      "#generateLyricsButton",
      "#clearLyricsButton",
      "#lyricsStatus"
    ];

    ids.forEach(sel => {
      const el = $(sel);
      if (!el) return;

      // Esconde o bloco visual que contém o elemento.
      const label = el.closest("label");
      if (label) {
        label.classList.add("vc-hidden-lyrics");
        return;
      }

      const parent = el.parentElement;
      if (parent) parent.classList.add("vc-hidden-lyrics");
    });

    // Esconde o painel inteiro de sincronização.
    const syncSelect = $("#syncTrackSelect");
    if (syncSelect) {
      const panel = syncSelect.closest(".panel");
      if (panel) panel.classList.add("vc-hidden-lyrics");
    }

    // Remove os marcadores "Letra" / "Sincronizada" da biblioteca.
    const cleanLibraryLabels = () => {
      $$(".music-info span").forEach(span => {
        span.textContent = span.textContent
          .replace(/\s*•\s*🎤\s*Letra/gi, "")
          .replace(/\s*•\s*✨\s*Sincronizada/gi, "")
          .trim();
      });
    };

    cleanLibraryLabels();

    const list = $("#musicList");
    if (list) {
      new MutationObserver(cleanLibraryLabels).observe(list, {
        childList: true,
        subtree: true
      });
    }

    return true;
  }

  function closeAllMenus(except = null) {
    $$(".vc-more-menu").forEach(menu => {
      if (menu !== except) menu.classList.add("hidden");
    });
  }

  function enhanceTrack(track) {
    if (!track || track.dataset.vcEnhanced === "1") return;
    track.dataset.vcEnhanced = "1";

    const actions = $(".actions", track);
    if (!actions) return;

    const play = $(".playOne", actions);
    const favorite = $(".favoriteTrack", actions);
    const addPlaylist = $(".addPlaylistTrack", actions);
    const download = $("a[download]", actions);
    const remove = $(".removePlaylistTrack", actions);
    const lyricsBtn = $(".lyrics-button", actions);

    if (lyricsBtn) lyricsBtn.style.display = "none";

    const more = document.createElement("button");
    more.type = "button";
    more.className = "vc-more";
    more.title = "Mais opções";
    more.setAttribute("aria-label", "Mais opções");
    more.textContent = "⋮";

    const menu = document.createElement("div");
    menu.className = "vc-more-menu hidden";

    if (addPlaylist) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "＋ <span>Adicionar à playlist</span>";
      b.addEventListener("click", e => {
        e.stopPropagation();
        addPlaylist.click();
        menu.classList.add("hidden");
      });
      menu.appendChild(b);
    }

    if (download) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "⇩ <span>Baixar música</span>";
      b.addEventListener("click", e => {
        e.stopPropagation();
        download.click();
        menu.classList.add("hidden");
      });
      menu.appendChild(b);
    }

    if (remove) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "✕ <span>Remover da playlist</span>";
      b.addEventListener("click", e => {
        e.stopPropagation();
        remove.click();
        menu.classList.add("hidden");
      });
      menu.appendChild(b);
    }

    more.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const wasHidden = menu.classList.contains("hidden");
      closeAllMenus(menu);
      menu.classList.toggle("hidden", !wasHidden);
    });

    actions.appendChild(more);
    actions.appendChild(menu);

    // Clicar na capa/nome toca e abre tela com capa grande.
    [$(".art", track), $(".info", track)].filter(Boolean).forEach(el => {
      el.addEventListener("click", e => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (play) play.click();

        setTimeout(() => openTrackDetail(track), 30);
      }, true);
    });
  }

  function openTrackDetail(track) {
    const view = $("#lyricsView");
    if (!view) return;

    const rowTitle = $(".info strong", track)?.textContent?.trim() || "Música";
    const rowMeta = $(".info span", track)?.textContent?.trim() || "Vem Comigo Records";
    const cover = $(".art img", track)?.src || $("#cover")?.src || "logo-play.png";

    const playerTitle = $("#title")?.textContent?.trim();
    const playerMeta = $("#artist")?.textContent?.trim();

    $("#lyricsCover") && ($("#lyricsCover").src = cover);
    $("#lyricsTitle") && ($("#lyricsTitle").textContent = playerTitle || rowTitle);

    if ($("#lyricsArtist")) {
      const parts = (playerMeta || rowMeta).split("•").map(x => x.trim());
      $("#lyricsArtist").textContent = parts[0] || "Artista";
      $("#lyricsAlbum").textContent = parts.slice(1).join(" • ") || "Vem Comigo Records";
    }

    const tag = $(".lyrics-info small", view);
    if (tag) tag.textContent = "TOCANDO AGORA";

    const mainPlay = $("#lyricsPlay");
    if (mainPlay) {
      mainPlay.textContent = $("#play")?.textContent === "⏸"
        ? "⏸ Pausar"
        : "▶ Tocar música";

      // Captura antes do app.js, pois a tela agora não depende de letra.
      if (!mainPlay.dataset.vcBound) {
        mainPlay.dataset.vcBound = "1";
        mainPlay.addEventListener("click", e => {
          e.preventDefault();
          e.stopImmediatePropagation();
          $("#play")?.click();
          setTimeout(() => {
            mainPlay.textContent = $("#play")?.textContent === "⏸"
              ? "⏸ Pausar"
              : "▶ Tocar música";
          }, 30);
        }, true);
      }
    }

    if (!$(".vc-detail-actions", view)) {
      const wrap = document.createElement("div");
      wrap.className = "vc-detail-actions";

      const fav = document.createElement("button");
      fav.type = "button";
      fav.textContent = "♡ Favoritar";
      fav.addEventListener("click", () => $("#favoriteCurrent")?.click());

      const playlist = document.createElement("button");
      playlist.type = "button";
      playlist.textContent = "＋ Playlist";
      playlist.addEventListener("click", () => $("#playlistCurrent")?.click());

      const download = document.createElement("button");
      download.type = "button";
      download.textContent = "⇩ Baixar";
      download.addEventListener("click", () => $("#downloadCurrent")?.click());

      wrap.append(fav, playlist, download);
      $(".lyrics-info", view)?.appendChild(wrap);
    }

    // Esconde outras telas sem depender de funções internas do app.js.
    [
      "#homeHero",
      "#artistsSection",
      "#albumsSection",
      "#featuredSection",
      "#albumView",
      "#playlistView",
      "#librarySection"
    ].forEach(sel => $(sel)?.classList.add("hidden"));

    view.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enhancePublic() {
    const catalog = $("#catalog");
    const player = $("#player");
    if (!catalog || !player) return false;

    const apply = () => $$(".track").forEach(enhanceTrack);
    apply();

    new MutationObserver(apply).observe(document.body, {
      childList: true,
      subtree: true
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".actions")) closeAllMenus();
    });

    return true;
  }

  function init() {
    injectCss();

    // Admin e site usam este mesmo arquivo.
    hideAdminLyrics();
    enhancePublic();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
