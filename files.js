const owner = 'Marek8861';
const repo = 'Mareks-Repo';
const branch = 'main';
const rootPath = 'repo'; // <-- folder traktowany jako root

const fileTreeContainer = document.getElementById('file-tree');
const breadcrumbContainer = document.getElementById('breadcrumb');

// Pobierz parametr ?path z URL, jeśli pusty to ustaw na rootPath
function getPathFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  let path = urlParams.get('path');
  if (!path) path = rootPath; // jeśli pusto, to root
  return path;
}

// Ustaw parametr ?path w URL bez przeładowania
function setPathToURL(path) {
  const newURL = `${window.location.pathname}?path=${encodeURIComponent(path)}`;
  history.pushState(null, '', newURL);
}

// Buduj breadcrumb
function buildBreadcrumb(path) {
  breadcrumbContainer.innerHTML = '';
  const parts = path.split('/').filter(Boolean);
  const fragment = document.createDocumentFragment();

  // Root link
  const rootLink = document.createElement('a');
  rootLink.href = `?path=${encodeURIComponent(rootPath)}`;
  rootLink.textContent = 'root';  // lub 'repo'
  rootLink.addEventListener('click', e => {
    e.preventDefault();
    loadPath(rootPath);
    setPathToURL(rootPath);
  });
  fragment.appendChild(rootLink);

  // Jeśli jesteśmy w root (repo), to breadcrumb to tylko root
  if (path === rootPath) {
    breadcrumbContainer.appendChild(fragment);
    return;
  }

  // Inaczej - pokazujemy separator i "..."
  fragment.appendChild(document.createTextNode(' / '));

  const upLink = document.createElement('a');
  upLink.href = `?path=${encodeURIComponent(rootPath)}`;
  upLink.textContent = '...';
  upLink.title = 'Folder nadrzędny (root)';
  upLink.style.fontWeight = 'bold';
  upLink.addEventListener('click', e => {
    e.preventDefault();
    loadPath(rootPath);
    setPathToURL(rootPath);
  });
  fragment.appendChild(upLink);

  fragment.appendChild(document.createTextNode(' / '));

  // Dodaj ścieżkę od root bez pierwszej części (bo root jest już pokazany)
  let accumulatedPath = '';
  parts.slice(1).forEach((part, index) => {
    if (index > 0) {
      fragment.appendChild(document.createTextNode(' / '));
    }
    accumulatedPath += (accumulatedPath ? '/' : '') + part;
    const link = document.createElement('a');
    link.href = `?path=${encodeURIComponent(rootPath + '/' + accumulatedPath)}`;
    link.textContent = part;
    link.addEventListener('click', e => {
      e.preventDefault();
      loadPath(rootPath + '/' + accumulatedPath);
      setPathToURL(rootPath + '/' + accumulatedPath);
    });
    fragment.appendChild(link);
  });

  breadcrumbContainer.appendChild(fragment);
}

async function fetchContents(path = rootPath) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const res = await fetch(url);
  if (!res.ok) {
    fileTreeContainer.innerHTML = `<p>Błąd pobierania zawartości repozytorium: ${res.status}</p>`;
    return [];
  }
  const data = await res.json();
  return data;
}

function createFileNode(file) {
  const div = document.createElement('div');
  div.className = 'node file';
  const a = document.createElement('a');
  a.href = file.download_url || file.html_url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = file.name;
  div.appendChild(a);
  return div;
}

function createFolderNode(folder) {
  const div = document.createElement('div');
  div.className = 'node folder';
  div.textContent = folder.name;
  div.addEventListener('click', () => {
    loadPath(folder.path);
    setPathToURL(folder.path);
  });
  return div;
}

async function loadPath(path) {
  buildBreadcrumb(path);
  fileTreeContainer.innerHTML = 'Ładowanie...';
  const contents = await fetchContents(path);
  fileTreeContainer.innerHTML = '';

  if (!contents.length) {
    fileTreeContainer.textContent = 'Folder jest pusty.';
    return;
  }

  // Jeżeli NIE jesteśmy w root, to pokaż folder „...” aby wrócić do root
  if (path !== rootPath) {
    const backFolder = document.createElement('div');
    backFolder.className = 'node folder back';
    backFolder.textContent = '...';
    backFolder.title = 'Folder nadrzędny (root)';
    backFolder.addEventListener('click', () => {
      loadPath(rootPath);
      setPathToURL(rootPath);
    });
    fileTreeContainer.appendChild(backFolder);
  }

  contents.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  contents.forEach(item => {
    if (item.type === 'dir') {
      fileTreeContainer.appendChild(createFolderNode(item));
    } else if (item.type === 'file') {
      fileTreeContainer.appendChild(createFileNode(item));
    }
  });
}

window.addEventListener('popstate', () => {
  const path = getPathFromURL();
  loadPath(path);
});

// Start
loadPath(getPathFromURL());
