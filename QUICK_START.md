# HomeSpecter Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Start the Application
```bash
docker compose up -d
```

### Step 2: Open Your Browser
Navigate to: http://localhost:3000

### Step 3: Start Adding Appliances!
Click the "Add Appliance" button or use the left sidebar menu.

## 📱 Application Overview

### Main Features

#### Left Sidebar Navigation
- **Appliances** - View all your appliances in a grid layout
- **Add Appliance** - Form to add new appliances
- **Settings** - Configure application preferences

#### Appliance Information Captured
- Name (required)
- Category (required): Kitchen, Laundry, Climate Control, Entertainment, Cleaning, Other
- Manufacturer
- Model Number
- Serial Number
- Location (e.g., Kitchen, Basement)
- Purchase Date
- Warranty Expiry Date
- Purchase Price
- Notes
- Photos (multiple files supported)
- Manuals/Documents (PDF, DOC, DOCX, TXT)

#### Main View
- Displays all appliances as attractive tiles
- Each tile shows:
  - Photo (if uploaded) or placeholder icon
  - Appliance name and category
  - Key details (brand, location, model)
  - Edit and Delete buttons
- Click on any tile to view complete details in a modal

## 🔧 Common Tasks

### Adding an Appliance
1. Click "Add Appliance" from sidebar or the "+ Add New" button
2. Fill in at least the Name and Category (required)
3. Add any optional details
4. Upload photos if available
5. Upload manuals or documentation if available
6. Click "Save Appliance"

### Viewing Appliance Details
- Click on any appliance tile in the main view
- A modal will open showing all details, photos, and documents

### Deleting an Appliance
- Click the "Delete" button on an appliance tile
- Confirm the deletion

## 🐳 Docker Commands

### Start the application
```bash
docker compose up -d
```

### Stop the application
```bash
docker compose down
```

### View logs
```bash
docker compose logs -f
```

### Restart the application
```bash
docker compose restart
```

### Stop and remove all data
```bash
docker compose down -v
```

## 🛠️ Troubleshooting

### Port Already in Use
If port 3000 or 27017 is already in use, you can change them in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Can't Connect to Application
1. Check if containers are running: `docker compose ps`
2. Check logs: `docker compose logs`
3. Ensure ports 3000 and 27017 are not blocked by firewall

### Database Connection Issues
- Wait a few seconds for MongoDB to fully start
- Check MongoDB logs: `docker compose logs mongodb`

## 📊 API Endpoints (for developers)

- `GET /api/appliances` - List all appliances
- `GET /api/appliances/:id` - Get single appliance
- `POST /api/appliances` - Create new appliance
- `PUT /api/appliances/:id` - Update appliance
- `DELETE /api/appliances/:id` - Delete appliance
- `GET /health` - Health check

## 🔒 Security Features

- Rate limiting: 100 requests per 15 minutes per IP
- Input validation and sanitization
- NoSQL injection protection
- Secure file upload handling
- Updated dependencies with security patches

## 💾 Data Persistence

All data is stored in MongoDB with persistent volumes. Your data will remain even if you stop the containers, unless you use `docker compose down -v` which removes volumes.

## 📁 Uploaded Files

Photos and manuals are stored in the `uploads/` directory, which is mounted as a volume in Docker. This ensures files persist between container restarts.

## 🎨 User Interface

The application features:
- Clean, modern design
- Responsive layout (works on desktop and mobile)
- Intuitive navigation
- Visual feedback for all actions
- Modal dialogs for detailed views
- Grid-based appliance display

## Need Help?

- Check the main [README.md](README.md) for detailed setup instructions
- Review the [docker-compose.yml](docker-compose.yml) for configuration options
- Examine the [server.js](server.js) for API details
