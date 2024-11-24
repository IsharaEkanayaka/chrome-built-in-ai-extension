document.querySelectorAll('.g a').forEach((link) => {
    const url = link.href;
    fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
        .then((response) => response.json())
        .then((data) => {
            link.dataset.summary = data.data.description || 'No description available';
        });

    link.addEventListener('mouseover', (event) => {
        const popup = document.createElement('div');
        popup.textContent = link.dataset.summary || 'Loading...';
        popup.style.position = 'absolute';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = '#fff';
        popup.style.padding = '10px';
        popup.style.borderRadius = '5px';
        popup.style.top = `${event.pageY + 10}px`;
        popup.style.left = `${event.pageX + 10}px`;
        document.body.appendChild(popup);

        link.addEventListener('mouseout', () => popup.remove());
    });
});