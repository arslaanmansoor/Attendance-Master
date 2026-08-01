# Attendance Master

A premium workforce dashboard for attendance, payroll, and team operations.

## Overview

Attendance Master is a modern, responsive HR Operations System (HR OS) that provides a comprehensive dashboard for monitoring workforce metrics, attendance trends, payroll summaries, and team activities. The application features a clean, professional interface with dark/light theme support and interactive data visualizations.

## Features

- **Dashboard Overview**: Real-time workforce metrics including total employees, present today, late arrivals, and payroll summaries
- **Attendance Tracking**: Monitor attendance health with trend visualizations and department-specific metrics
- **Interactive Charts**: Dynamic SVG-based charts for attendance and payroll trends with multiple time range options (7D, 30D, 90D)
- **Leave Management**: Track and manage leave requests with approval workflows
- **Department Analytics**: View department-specific performance metrics and productivity indicators
- **Activity Timeline**: Recent activities feed for payroll approvals, leave requests, and project milestones
- **Theme Support**: Built-in dark/light theme toggle with system preference detection and localStorage persistence
- **Responsive Design**: Fully responsive layout that adapts to desktop, tablet, and mobile devices

## Project Structure

```
workers-attendance/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── script.js           # JavaScript functionality (theme toggle, charts)
├── images/             # Image assets directory
└── README.md           # Project documentation
```

## Technology Stack

- **HTML5**: Semantic markup with accessibility features (ARIA labels)
- **CSS3**: Custom properties (CSS variables) for theming, CSS Grid and Flexbox for layout
- **JavaScript (Vanilla)**: No frameworks - pure JavaScript for interactivity
- **SVG**: Inline SVG for icons and dynamic chart rendering

## Key Components

### Branding
- **Logo**: Golden "AM" monogram on black background with circular golden outline
- **Name**: Attendance Master
- **Tagline**: HR OS

### Dashboard Sections

1. **Sidebar Navigation**
   - Dashboard (Live)
   - Employees
   - Attendance (with notification badge)
   - Payroll
   - Projects
   - Reports

2. **Hero Section**
   - Workforce command center overview
   - Current attendance health metric (94.6%)
   - Quick action buttons

3. **KPI Grid**
   - Total employees: 1,284
   - Present today: 1,126
   - Late arrivals: 37
   - Payroll summary: $482k

4. **Widget Grid**
   - Employees absent
   - Monthly salary expense
   - Overtime hours
   - Active projects
   - Attendance rate
   - Weekly trend visualization

5. **Charts & Analytics**
   - Attendance trend chart (interactive)
   - Department pulse metrics
   - Payroll trend chart
   - Recent activities timeline

6. **Data Tables**
   - Leave requests with status tracking
   - Upcoming holidays
   - Quick links

## Color Scheme

### Light Theme
- Primary: #2563eb (Blue)
- Background: #f4f7fb
- Surface: #ffffff
- Text: #0f172a

### Dark Theme
- Primary: #60a5fa (Light Blue)
- Background: #07111f
- Surface: #0f172a
- Text: #f8fafc

### Brand Colors
- Gold: #D4AF37 (Logo accent)
- Success: #16a34a
- Warning: #f59e0b
- Danger: #dc2626
- Info: #0ea5e9

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. Clone or download the project files
2. Navigate to the project directory
3. Open `index.html` in a web browser

### Running with a Local Server

Using Python:
```bash
python -m http.server 8000
```

Using Node.js (http-server):
```bash
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

## Customization

### Theme Colors
Modify CSS custom properties in `styles.css` under `:root` for light theme and `:root[data-theme="dark"]` for dark theme.

### Chart Data
Update the `chartData` object in `script.js` to modify attendance trend data for different time ranges.

### Logo
The logo is implemented as an inline SVG in the HTML. To customize:
- Modify the SVG in the `.brand-mark` div in `index.html`
- Update colors by changing the `#D4AF37` (gold) and `#000` (black) values

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Features

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

## Performance Optimizations

- No external dependencies
- CSS-based animations and transitions
- Efficient DOM manipulation
- SVG-based graphics (no image assets for charts)
- LocalStorage for theme persistence

## Future Enhancements

- Backend API integration for real-time data
- User authentication and role-based access
- Export functionality for reports
- Advanced filtering and search
- Email notifications for leave requests
- Multi-language support

## License

This project is provided as-is for demonstration and development purposes.

## Credits

Designed and developed as a modern HR Operations System dashboard.
