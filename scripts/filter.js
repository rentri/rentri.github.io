document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  const postList = document.getElementById('post-list');
  const posts = Array.from(postList.querySelectorAll('.post'));

  function updateDisplay() {
    const query = searchInput.value.trim().toLowerCase();

    // Get sort option
    let sort = 'newest';
    for (let i = 0; i < sortRadios.length; i++) {
      if (sortRadios[i].checked) {
        sort = sortRadios[i].value;
        break;
      }
    }

    // Filter posts
    posts.forEach(function (post) {
      const content = post.textContent.toLowerCase();
      const match = content.includes(query);
      post.style.display = match ? '' : 'none';
    });

    // Sort visible posts
    const visiblePosts = posts.filter(function (post) {
      return post.style.display !== 'none';
    });

    visiblePosts.sort(function (a, b) {
      const d1 = new Date(a.dataset.date);
      const d2 = new Date(b.dataset.date);
      return sort === 'newest' ? d2 - d1 : d1 - d2;
    });

    // Re-append sorted posts
    visiblePosts.forEach(function (post) {
      postList.appendChild(post);
    });
  }

  // Initial run
  updateDisplay();

  // Search input listener
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'inline' : 'none';
    updateDisplay();
  });

  // Clear button listener
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    updateDisplay();
  });

  // Sort radio listener
  for (let i = 0; i < sortRadios.length; i++) {
    sortRadios[i].addEventListener('change', updateDisplay);
  }
});
