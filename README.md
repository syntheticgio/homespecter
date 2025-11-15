# HomeSpecter

A comprehensive home appliance management web application that helps you track, organize, and manage all your household appliances with photos, manuals, and detailed information.

## Features

- 📱 **Appliance Management**: Add, view, edit, and delete home appliances
- 📸 **Photo Upload**: Upload multiple photos for each appliance
- 📄 **Document Storage**: Store manuals, warranties, and receipts
- 🏠 **Organized Display**: View all appliances in an intuitive tile-based layout
- 🔍 **Detailed View**: Click on any appliance to see complete details
- 🌗 **Dark Mode**: Toggle light/dark themes (auto-detects system preference, persists per browser)
- ⚙️ **Settings**: Customize your experience with settings page
- 🎨 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **File Upload**: Multer
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/syntheticgio/homespecter.git
   cd homespecter
   ```

2. **Start the application with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   
   Open your browser and navigate to: `http://localhost:3000`

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Manual Installation (Without Docker)

If you prefer to run without Docker:

1. **Install MongoDB** locally and ensure it's running

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables** (optional)
   ```bash
   export MONGODB_URI=mongodb://localhost:27017/homespecter
   export PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **For development with auto-reload**
   ```bash
   npm run dev
   ```

## Usage Guide

### Adding an Appliance

1. Click on the **"+ Add New"** button or select **"Add Appliance"** from the sidebar
2. Fill in the appliance details:
   - **Required fields**: Name and Category
   - **Optional fields**: Manufacturer, Model, Serial Number, Location, Purchase Date, Warranty Expiry, Purchase Price, Notes
3. Upload photos (multiple files supported)
4. Upload manuals/documents (PDF, DOC, DOCX, TXT)
5. Click **"Save Appliance"**

### Viewing Appliances

- The main dashboard displays all appliances as tiles
- Each tile shows:
  - Photo (if uploaded) or placeholder icon
  - Appliance name and category
  - Key details (brand, location, model)
- Click on any tile to view complete details in a modal

### Managing Appliances

- **View Details**: Click on any appliance tile
- **Delete**: Click the "Delete" button on the tile
- **Edit**: Edit functionality available (button present on each tile)

### Settings & Dark Mode

Access the Settings page from the sidebar to:
- Toggle **Dark Mode** (immediately updates UI)
- Dark mode is remembered using `localStorage` per browser
- If you haven't chosen a theme yet, the app follows your OS preference
- Configure display preferences
- View application information

## Project Structure

```
homespecter/
├── server.js              # Express server and API routes
├── package.json           # Node.js dependencies
├── Dockerfile            # Docker configuration for the app
├── docker-compose.yml    # Docker Compose configuration
├── .gitignore           # Git ignore rules
├── public/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # Stylesheet
│   └── app.js          # Frontend JavaScript
├── uploads/            # Uploaded files (created automatically)
└── README.md           # This file
```

## API Endpoints

- `GET /api/appliances` - Get all appliances
- `GET /api/appliances/:id` - Get single appliance
- `POST /api/appliances` - Create new appliance
- `PUT /api/appliances/:id` - Update appliance
- `DELETE /api/appliances/:id` - Delete appliance
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string (default: mongodb://mongodb:27017/homespecter)

## Docker Configuration

### Dockerfile
- Uses Node.js 18 Alpine image for minimal size
- Installs production dependencies
- Exposes port 3000
- Creates uploads directory

### docker-compose.yml
- **MongoDB Service**: MongoDB 7.0 with persistent storage
- **App Service**: Node.js application
- **Network**: Bridge network for service communication
- **Volumes**: Persistent data storage for MongoDB and uploads

## Development

To contribute or modify:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Application won't start
- Ensure Docker and Docker Compose are installed
- Check if ports 3000 and 27017 are available
- Run `docker-compose logs` to see error messages

### Can't connect to MongoDB
- Verify MongoDB container is running: `docker ps`
- Check MongoDB logs: `docker-compose logs mongodb`

### Upload issues
- Ensure the uploads directory has proper permissions
- Check file size limits (default: 10MB)

## License

ISC

## Support

For issues, questions, or contributions, please open an issue on GitHub.