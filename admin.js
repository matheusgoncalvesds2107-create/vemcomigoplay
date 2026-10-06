/* =========================================================
   VEM COMIGO PLAY - PAINEL ADMIN
   Envia MP3 + capa para o Supabase e publica no catálogo
========================================================= */

/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   NÃO use a chave service_role aqui.
   Depois vamos colocar:
   - URL do projeto
   - chave anon/public
========================================================= */

const SUPABASE_URL = "COLE_AQUI_A_URL_DO_SUPABASE";
const SUPABASE_ANON_KEY = "COLE_AQUI_A_CHAVE_ANON_PUBLIC";

const BUCKET = "musicas";

let accessToken = "";
let publishedTracks = [];

/* =========================================================
   ATALHO
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

/* =========================================================
   STATUS
========================================================= */

function setStatus(message, type = "") {
  const box = $("#status");

  box.textContent = message;

  box.className =
    "status" +
    (type ? ` ${type}` : "");
}

/* =========================================================
   PROGRESSO
========================================================= */

function showProgress(
  percent,
  message = "Enviando..."
) {
  $("#progressArea")
    .classList
    .remove("hidden");

  $("#progressPercent")
    .textContent =
    `${percent}%`;

  $("#progressText")
    .textContent =
    message;

  $("#progressFill")
    .style
    .width =
    `${percent}%`;
}

function hideProgress() {
  setTimeout(() => {
    $("#progressArea")
      .classList
      .add("hidden");

    $("#progressFill")
      .style
      .width =
      "0%";
  }, 1500);
}

/* =========================================================
   NORMALIZAR NOMES
========================================================= */

function slug(text) {
  return text
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   LOGIN SUPABASE
========================================================= */

async function login() {
  if (
    SUPABASE_URL.includes(
      "COLE_AQUI"
    )
  ) {
    setStatus(
      "Primeiro precisamos colocar a URL e a chave pública do Supabase.",
      "error"
    );

    return false;
  }

  const email =
    prompt(
      "E-mail do administrador:"
    );

  if (!email) {
    return false;
  }

  const password =
    prompt(
      "Senha do administrador:"
    );

  if (!password) {
    return false;
  }

  try {

    setStatus(
      "Entrando no painel..."
    );

    const response =
      await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_ANON_KEY
          },

          body:
            JSON.stringify({
              email,
              password
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error_description ||
        data.msg ||
        "Não foi possível entrar."
      );
    }

    accessToken =
      data.access_token;

    sessionStorage.setItem(
      "vcplay-token",
      accessToken
    );

    setStatus(
      "Painel conectado.",
      "ok"
    );

    return true;

  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      "error"
    );

    return false;
  }
}

/* =========================================================
   TOKEN
========================================================= */

async function ensureLogin() {

  accessToken =
    sessionStorage.getItem(
      "vcplay-token"
    ) || "";

  if (accessToken) {
    return true;
  }

  return await login();
}

/* =========================================================
   UPLOAD PARA STORAGE
========================================================= */

async function uploadFile(
  file,
  path
) {

  const response =
    await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",

        headers: {
          "apikey":
            SUPABASE_ANON_KEY,

          "Authorization":
            `Bearer ${accessToken}`,

          "Content-Type":
            file.type ||
            "application/octet-stream",

          "x-upsert":
            "true"
        },

        body:
          file
      }
    );

  const data =
    await response.json()
      .catch(() => ({}));

  if (!response.ok) {

    if (
      response.status === 401
    ) {
      sessionStorage
        .removeItem(
          "vcplay-token"
        );
    }

    throw new Error(
      data.message ||
      data.error ||
      "Erro ao enviar arquivo."
    );
  }

  return data;
}

/* =========================================================
   URL PÚBLICA
========================================================= */

function publicUrl(path) {
  return (
    `${SUPABASE_URL}` +
    `/storage/v1/object/public/` +
    `${BUCKET}/${path}`
  );
}

/* =========================================================
   SALVAR MÚSICA NO BANCO
========================================================= */

async function saveTrack(track) {

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/tracks`,
      {
        method: "POST",

        headers: {
          "apikey":
            SUPABASE_ANON_KEY,

          "Authorization":
            `Bearer ${accessToken}`,

          "Content-Type":
            "application/json",

          "Prefer":
            "return=representation"
        },

        body:
          JSON.stringify(
            track
          )
      }
    );

  const data =
    await response.json()
      .catch(() => []);

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.hint ||
      "Erro ao publicar música."
    );
  }

  return data[0];
}

/* =========================================================
   CARREGAR MÚSICAS
========================================================= */

async function loadTracks() {

  if (!accessToken) {
    return;
  }

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=created_at.desc`,
        {
          headers: {
            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              `Bearer ${accessToken}`
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        "Erro ao carregar biblioteca."
      );
    }

    publishedTracks =
      await response.json();

    renderTracks();

  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      "error"
    );
  }
}

/* =========================================================
   MOSTRAR BIBLIOTECA
========================================================= */

function renderTracks() {

  const list =
    $("#musicList");

  if (
    !publishedTracks.length
  ) {

    list.innerHTML = `
      <div class="empty">
        Nenhuma música publicada ainda.
      </div>
    `;

    return;
  }

  list.innerHTML =
    publishedTracks
      .map((track) => {

        const cover =
          track.cover_url ||
          "logo-play.png";

        return `
          <div
            class="music-item"
            data-id="${track.id}"
          >

            <img
              src="${cover}"
              alt="${track.title}"
            >

            <div class="music-info">

              <strong>
                ${track.title}
              </strong>

              <span>
                ${track.artist}
                •
                ${track.album}
              </span>

              <span>
                ${track.category}
              </span>

            </div>

            <div class="music-actions">

              <button
                class="preview"
                data-url="${track.audio_url}"
                title="Ouvir"
              >
                ▶
              </button>

              <button
                class="delete"
                data-id="${track.id}"
                data-audio="${track.audio_path || ""}"
                data-cover="${track.cover_path || ""}"
                title="Excluir"
              >
                🗑
              </button>

            </div>

          </div>
        `;
      })
      .join("");

  document
    .querySelectorAll(
      ".preview"
    )
    .forEach((button) => {

      button.onclick =
        () => {

          const player =
            new Audio(
              button.dataset.url
            );

          player.play();
        };
    });

  document
    .querySelectorAll(
      ".delete"
    )
    .forEach((button) => {

      button.onclick =
        () =>
          deleteTrack(
            button.dataset.id,
            button.dataset.audio,
            button.dataset.cover
          );
    });
}

/* =========================================================
   EXCLUIR ARQUIVO DO STORAGE
========================================================= */

async function deleteStorageFile(
  path
) {

  if (!path) {
    return;
  }

  await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "DELETE",

      headers: {
        "apikey":
          SUPABASE_ANON_KEY,

        "Authorization":
          `Bearer ${accessToken}`
      }
    }
  );
}

/* =========================================================
   EXCLUIR MÚSICA
========================================================= */

async function deleteTrack(
  id,
  audioPath,
  coverPath
) {

  const confirmation =
    confirm(
      "Excluir esta música do Vem Comigo PLAY?"
    );

  if (!confirmation) {
    return;
  }

  try {

    setStatus(
      "Excluindo..."
    );

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/tracks?id=eq.${encodeURIComponent(id)}`,
        {
          method: "DELETE",

          headers: {
            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              `Bearer ${accessToken}`
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        "Não foi possível excluir."
      );
    }

    await deleteStorageFile(
      audioPath
    );

    await deleteStorageFile(
      coverPath
    );

    setStatus(
      "Música excluída.",
      "ok"
    );

    await loadTracks();

  } catch (error) {

    console.error(error);

    setStatus(
      error.message,
      "error"
    );
  }
}

/* =========================================================
   NOME DOS ARQUIVOS
========================================================= */

$("#audioFile")
  .addEventListener(
    "change",
    () => {

      const file =
        $("#audioFile")
          .files[0];

      $("#audioName")
        .textContent =
        file
          ? file.name
          : "Escolher música";
    }
  );

$("#coverFile")
  .addEventListener(
    "change",
    () => {

      const file =
        $("#coverFile")
          .files[0];

      $("#coverName")
        .textContent =
        file
          ? file.name
          : "Escolher capa";
    }
  );

/* =========================================================
   ENVIAR MÚSICA
========================================================= */

$("#musicForm")
  .addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const logged =
        await ensureLogin();

      if (!logged) {
        return;
      }

      const artist =
        $("#artist").value.trim();

      const album =
        $("#album").value.trim();

      const title =
        $("#title").value.trim();

      const category =
        $("#category").value;

      const audioFile =
        $("#audioFile")
          .files[0];

      const coverFile =
        $("#coverFile")
          .files[0];

      if (
        !artist ||
        !album ||
        !title ||
        !category ||
        !audioFile
      ) {

        setStatus(
          "Preencha os campos e escolha o MP3.",
          "error"
        );

        return;
      }

      const button =
        $("#uploadButton");

      button.disabled = true;

      try {

        setStatus(
          "Preparando envio..."
        );

        showProgress(
          10,
          "Preparando..."
        );

        const artistFolder =
          slug(artist);

        const albumFolder =
          slug(album);

        const songName =
          slug(title);

        const audioExt =
          (
            audioFile.name
              .split(".")
              .pop() ||
            "mp3"
          )
          .toLowerCase();

        const audioPath =
          `${artistFolder}/` +
          `${albumFolder}/` +
          `${songName}.${audioExt}`;

        showProgress(
          30,
          "Enviando música..."
        );

        await uploadFile(
          audioFile,
          audioPath
        );

        const audioURL =
          publicUrl(
            audioPath
          );

        let coverURL =
          "logo-play.png";

        let coverPath =
          "";

        if (coverFile) {

          showProgress(
            60,
            "Enviando capa..."
          );

          const coverExt =
            (
              coverFile.name
                .split(".")
                .pop() ||
              "jpg"
            )
            .toLowerCase();

          coverPath =
            `${artistFolder}/` +
            `${albumFolder}/` +
            `capa.${coverExt}`;

          await uploadFile(
            coverFile,
            coverPath
          );

          coverURL =
            publicUrl(
              coverPath
            );
        }

        showProgress(
          80,
          "Publicando..."
        );

        await saveTrack({
          title:
            title,

          artist:
            artist,

          album:
            album,

          category:
            category,

          type:
            category ===
            "Podcasts"
              ? "podcast"
              : "music",

          audio_url:
            audioURL,

          audio_path:
            audioPath,

          cover_url:
            coverURL,

          cover_path:
            coverPath
        });

        showProgress(
          100,
          "Publicado!"
        );

        setStatus(
          "Música publicada com sucesso no Vem Comigo PLAY.",
          "ok"
        );

        $("#musicForm")
          .reset();

        $("#audioName")
          .textContent =
          "Escolher música";

        $("#coverName")
          .textContent =
          "Escolher capa";

        await loadTracks();

        hideProgress();

      } catch (error) {

        console.error(error);

        setStatus(
          error.message,
          "error"
        );

        hideProgress();

      } finally {

        button.disabled =
          false;
      }
    }
  );

/* =========================================================
   INICIAR PAINEL
========================================================= */

async function startAdmin() {

  const logged =
    await ensureLogin();

  if (logged) {
    await loadTracks();
  }
}

startAdmin();
