document.addEventListener("DOMContentLoaded", () => {
    // parse ?tag=... from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get("tag");

    if (tagParam) {
        const cb = document.querySelector(`input[type="checkbox"][value="${tagParam}"]`);
        if (cb) {
            cb.checked = true;
        }
    }

});