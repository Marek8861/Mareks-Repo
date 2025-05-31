async function fetchFiles(path = '') {
  const owner = 'Marek8861';
  const repo = 'Mareks-Repo';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Błąd pobierania danych z GitHub API');

  return response.json(); // Tablica plików i folderów
}

async function buildTree(container, path = '') {
  const items = await fetchFiles(path);
  const ul = document.createElement('ul');
  ul.setAttribute('role', 'group');

  for (const item of items) {
    const li = document.createElement('li');
    li.setAttribute('role', 'treeitem');
    li.tabIndex = 0;

    if (item.type === 'file') {
      const a = document.createElement('a');
      a.href = item.download_url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.name;
      a.classList.add('file-link');
      li.appendChild(a);
    } else if (item.type === 'dir') {
      li.classList.add('folder');
      li.innerHTML = `<span class="folder-label"><i class="fa-solid fa-folder"></i> ${item.name}</span>`;
      li.setAttribute('aria-expanded', 'false');

      li.addEventListener('click', async (e) => {
        e.stopPropagation();
        const expanded = li.getAttribute('aria-expanded') === 'true';
        if (!expanded) {
          // Jeśli folder nie jest jeszcze rozwinięty, załaduj podfoldery
          if (!li.querySelector('ul')) {
            const subtree = await buildTree(li, item.path);
            li.appendChild(subtree);
          }
        }
        li.setAttribute('aria-expanded', !expanded);
        li.classList.toggle('open');
      });

      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          li.click();
        }
      });
    }

    ul.appendChild(li);
  }
  return ul;
}

// Na starcie załaduj root
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('file-tree');
  const tree = await buildTree(container);
  container.appendChild(tree);
});
