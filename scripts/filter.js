document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  const postList = document.getElementById('post-list');
  const posts = Array.from(postList.querySelectorAll('.post'));

  function updateDisplay() {
    const query = searchInput.value.trim().toLowerCase();

    let sort = 'newest';
    let i = 0;
    while (i < sortRadios.length) {
      if (sortRadios[i].checked) {
        sort = sortRadios[i].value;
        break;
      } else {
        i++;
      }
    }

    let j = 0;
    while (j < posts.length) {
      const content = posts[j].textContent.toLowerCase();
      if (content.includes(query)) {
        posts[j].style.display = '';
      } else {
        posts[j].style.display = 'none';
      }
      j++;
    }

    let visiblePosts = [];
    let k = 0;
    while (k < posts.length) {
      if (posts[k].style.display !== 'none') {
        visiblePosts.push(posts[k]);
      }
      k++;
    }

    visiblePosts.sort(function (a, b) {
      const d1 = new Date(a.dataset.date);
      const d2 = new Date(b.dataset.date);
      if (sort === 'newest') {
        return d2 - d1;
      } else {
        return d1 - d2;
      }
    });

    let l = 0;
    while (l < visiblePosts.length) {
      postList.appendChild(visiblePosts[l]);
      l++;
    }
  }

  updateDisplay();

  searchInput.addEventListener('input', function () {
    if (searchInput.value) {
      clearBtn.style.display = 'inline';
    } else {
      clearBtn.style.display = 'none';
    }
    updateDisplay();
  });

  clearBtn.addEventListener('click', function () {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    updateDisplay();
  });

  let m = 0;
  while (m < sortRadios.length) {
    sortRadios[m].addEventListener('change', updateDisplay);
    m++;
  }
});
