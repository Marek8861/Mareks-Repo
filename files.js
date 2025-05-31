const owner = 'Marek8861';        // Twój GitHub login
const repo = 'Mareks-Repo';       // Nazwa repozytorium
const branch = 'main';            // Gałąź (często 'main' lub 'master')

const fileTreeContainer = document.getElementById('file-tree');

async function fetchContents(path = '') {
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
  const li = document.createElement('li');
  li.classList.add('node', 'file');
  const a = document.createElement('a');
  a.href = file.download_url || file.html_url;
  a.textContent = file.name;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  li.appendChild(a);
  return li;
}

function createFolderNode(folder) {
  const li = document.createElement('li');
  li.classList.add('node', 'folder');
  li.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.classList.add('label');
  label.tabIndex = 0;

  const icon = document.createElement('i');
  icon.classList.add('fas', 'fa-chevron-right', 'toggle-icon');
  label.appendChild(icon);

  label.appendChild(document.createTextNode(folder.name));
  li.appendChild(label);

  const childrenUL = document.createElement('ul');
  childrenUL.classList.add('tree');
  childrenUL.style.display = 'none';
  li.appendChild(childrenUL);

  let loaded = false;

  // Obsługa kliknięcia i klawiatury (enter/space) do otwierania folderu
  function toggleFolder() {
    const isOpen = li.classList.toggle('open');
    label.setAttribute('aria-expanded', isOpen);
    childrenUL.style.display = isOpen ? 'block' : 'none';

    if (isOpen && !loaded) {
      fetchContents(folder.path).then(contents => {
        contents.forEach(item => {
          if (item.type === 'dir') {
            childrenUL.appendChild(createFolderNode(item));
          } else if (item.type === 'file') {
            childrenUL.appendChild(createFileNode(item));
          }
        });
        loaded = true;
      });
    }
  }

  label.addEventListener('click', toggleFolder);
  label.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFolder();
    }
  });

  return li;
}

async function buildTree() {
  fileTreeContainer.innerHTML = 'Ładowanie...';
  const rootContents = await fetchContents('');
  fileTreeContainer.innerHTML = '';

  const ul = document.createElement('ul');
  ul.classList.add('tree');

  rootContents.forEach(item => {
    if (item.type === 'dir') {
      ul.appendChild(createFolderNode(item));
    } else if (item.type === 'file') {
      ul.appendChild(createFileNode(item));
    }
  });

  fileTreeContainer.appendChild(ul);
}

buildTree();
