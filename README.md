# RetraLabs Website

A modern, responsive website for RetraLabs built with Node.js and Express.

## Features

- **Modern Design**: Clean and professional design with gradient accents
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Interactive elements with smooth scroll effects
- **Mobile Menu**: Hamburger menu for mobile navigation
- **Contact Form API**: Functional contact form with Express backend
- **Performance Optimized**: Lightweight and fast-loading
- **Node.js Backend**: Express server for serving content and handling API requests

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd RETRALABS
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the server:
```bash
npm start
```

Or:
```bash
node server.js
```

The server will start on `http://localhost:3000` by default.

### Environment Variables

You can customize the port by setting the `PORT` environment variable:
```bash
PORT=8000 npm start
```

## Project Structure

```
RETRALABS/
├── server.js          # Express server and routes
├── package.json       # Node.js dependencies and scripts
├── views/             # HTML templates
│   └── index.html     # Main HTML file
├── public/            # Static assets
│   ├── styles.css     # All CSS styles
│   └── script.js      # Client-side JavaScript
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## API Endpoints

### POST /api/contact
Submit contact form data.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Hello, I'm interested in your services."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your message! We will get back to you soon."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Customization

### Colors

Edit the CSS variables in `public/styles.css` to change the color scheme:

```css
:root {
    --primary-color: #6366f1;
    --primary-dark: #4f46e5;
    --secondary-color: #8b5cf6;
    /* ... more variables */
}
```

### Content

- Update text content in `views/index.html`
- Modify service cards, stats, and contact information
- Add or remove sections as needed

### Server Configuration

Edit `server.js` to:
- Add new routes
- Integrate with databases
- Add authentication
- Configure email sending for contact form

## Production Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name retralabs
pm2 save
pm2 startup
```

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t retralabs .
docker run -p 3000:3000 retralabs
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technologies Used

- **Node.js**: Runtime environment
- **Express**: Web framework
- **HTML5**: Markup
- **CSS3**: Styling with modern features
- **Vanilla JavaScript**: Client-side interactivity

## License

This project is open source and available for use.

## Contact

For questions or support, please contact hello@retralabs.com
