document.addEventListener("DOMContentLoaded", () => {
  // Cargar ranking de Tetris
  fetch('/api/scores/tetris')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('tetris-ranking'); // Asegúrate de que tu tabla tenga este ID o ajústalo
      if (container && Array.isArray(data)) {
        container.innerHTML = data.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.username}</td>
            <td>${item.score}</td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    })
    .catch(err => console.error("Error al cargar ranking de Tetris:", err));

  // Cargar ranking de Snake
  fetch('/api/scores/snake')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('snake-ranking');
      if (container && Array.isArray(data)) {
        container.innerHTML = data.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.username}</td>
            <td>${item.score}</td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    })
    .catch(err => console.error("Error al cargar ranking de Snake:", err));
});