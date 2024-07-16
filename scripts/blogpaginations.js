const items = [
    { link: "/blogs/learning-org.html", title: "Learning Emacs Org Mode", date: "2024-07-16 Tue 16:04" },

    ];

const itemsPerPage = 10;
let currentPage = 1;

function renderPage(page) {
const container = document.getElementById('itemContainer');
container.innerHTML = '';

const start = (page - 1) * itemsPerPage;
const end = start + itemsPerPage;
const paginatedItems = items.slice(start, end);

paginatedItems.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${item.link}">${item.title}</a><span> ${item.date}</span>`;
    container.appendChild(li);
});

document.getElementById('pageInfo').textContent = `Page ${page}`;
document.getElementById('prevLink').classList.toggle('disabled', page === 1);
document.getElementById('nextLink').classList.toggle('disabled', end >= items.length);
}

function changePage(direction) {
    const maxPage = Math.ceil(items.length / itemsPerPage);
    const newPage = currentPage + direction;
    if (newPage < 1 || newPage > maxPage) return;
    currentPage = newPage;
    renderPage(currentPage);
}

document.addEventListener('DOMContentLoaded', () => {
    renderPage(currentPage);
});