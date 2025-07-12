document.addEventListener("DOMContentLoaded", function () {
  // get all inputs and posts
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const sortRadios = document.querySelectorAll('input[name="sort"]');
  const postList = document.getElementById('post-list');
  const posts = Array.from(postList.querySelectorAll('.post'));

  function updateDisplay() {
    // find which tags are selected
    const selectedTags = [];
    for (let i = 0; i < checkboxes.length; i++) {
      if (checkboxes[i].checked) {
        selectedTags.push(checkboxes[i].value);
      }
    }

    // find selected mode ('or' or 'and')
    let mode = 'or';
    for (let i = 0; i < modeRadios.length; i++) {
      if (modeRadios[i].checked) {
        mode = modeRadios[i].value;
        break;
      }
    }


    // find selected sort ('newest' or 'oldest')
    let sort = 'newest';
    for (let i = 0; i < sortRadios.length; i++) {
      if (sortRadios[i].checked) {
        sort = sortRadios[i].value;
        break;
      }
    }

    // filter posts
    posts.forEach(function (post) {
      const postTags = post.dataset.tags.split(',');
      let match = false;

      if (selectedTags.length === 0) {
        match = true; // show all if no tags selected (sletedTags.length  === 0 is true)
      } else if (mode === 'or') {
        for (let i = 0; i < selectedTags.length; i++) {
          if (postTags.indexOf(selectedTags[i]) !== -1) {
            match = true;
            break;
          }
        }
      } else { // mode === 'and'
        match = true;
        for (let i = 0; i < selectedTags.length; i++) {
          if (postTags.indexOf(selectedTags[i]) === -1) {
            match = false;
            break;
          }
        }
      }

      // show or hide post
      post.style.display = match ? '' : 'none';
    });

    // sort visible posts
    const visiblePosts = posts.filter(function (post) {
      return post.style.display !== 'none';
    });

    visiblePosts.sort(function (a, b) {
      const d1 = new Date(a.dataset.date);
      const d2 = new Date(b.dataset.date);
      if (sort === 'newest') {
        return d2 - d1;
      } else {
        return d1 - d2;
      }
    });

    // re-append sorted posts to the list
    visiblePosts.forEach(function (post) {
      postList.appendChild(post);
    });
  }

  // run for url_tag.js
  updateDisplay();

  // event listeners
  for (let i = 0; i < checkboxes.length; i++) {
    checkboxes[i].addEventListener('change', updateDisplay);
  }
  for (let i = 0; i < modeRadios.length; i++) {
    modeRadios[i].addEventListener('change', updateDisplay);
  }
  for (let i = 0; i < sortRadios.length; i++) {
    sortRadios[i].addEventListener('change', updateDisplay);
  }
});
