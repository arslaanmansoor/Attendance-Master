const themeToggle = document.querySelector('[data-theme-toggle]');
const root = document.documentElement;
const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

const applyTheme = (theme) => {
  root.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀';
  localStorage.setItem('theme', theme);
};

applyTheme(initialTheme);

themeToggle.addEventListener('click', () => {
  const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

const chartData = {
  '7d': [72, 76, 74, 79, 81, 84, 88],
  '30d': [68, 70, 72, 74, 76, 80, 82, 85, 88, 91],
  '90d': [60, 63, 66, 69, 72, 75, 77, 80, 84, 88, 90, 94]
};

const chartCanvas = document.getElementById('chartCanvas');
const buttons = Array.from(document.querySelectorAll('[data-range]'));

const renderChart = (key) => {
  const points = chartData[key];
  const width = 560;
  const height = 260;
  const padding = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const stepX = (width - padding * 2) / (points.length - 1);

  const coords = points.map((value, index) => {
    const x = padding + index * stepX;
    const normalized = (value - min) / (max - min || 1);
    const y = height - padding - normalized * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathData = coords.reduce((acc, point, index) => {
    const [x, y] = point.split(',');
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaData = `${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  chartCanvas.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" rx="24" fill="transparent"></rect>
    <g stroke="rgba(148,163,184,0.25)" stroke-width="1">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
      <line x1="${padding}" y1="${height - padding - (height - padding * 2) / 2}" x2="${width - padding}" y2="${height - padding - (height - padding * 2) / 2}"></line>
    </g>
    <path d="${areaData}" fill="rgba(37, 99, 235, 0.16)"></path>
    <path d="${pathData}" fill="none" stroke="var(--primary)" stroke-width="4" stroke-linecap="round"></path>
    ${points
      .map((value, index) => {
        const x = padding + index * stepX;
        const normalized = (value - min) / (max - min || 1);
        const y = height - padding - normalized * (height - padding * 2);
        return `<circle cx="${x}" cy="${y}" r="5" fill="var(--info)"></circle>`;
      })
      .join('')}
  `;
};

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    buttons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    renderChart(button.dataset.range);
  });
});

renderChart('7d');
