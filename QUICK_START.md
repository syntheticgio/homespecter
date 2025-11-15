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
- Quick Start Guide (single file) — supports file upload or a URL
- Photo and Manual URL support: you can paste URLs (one per line) for photos and manuals; the server will fetch and store the remote files locally

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

## � Rebuilding & Rerunning (Docker Compose)

When you make changes that affect the built image (for example, you changed the `Dockerfile`, added/removed an NPM dependency, or updated build-time assets), you'll need to rebuild the image and rerun the services.

Rebuild all services and restart (recommended after dependency or Dockerfile changes):
```bash
docker compose up -d --build
```

Rebuild only the `app` service (faster when only the application image needs rebuilding):
```bash
docker compose build --no-cache app
docker compose up -d app
```
Or combine into one step:
```bash
docker compose up -d --build app
```

Quick restart without rebuilding (useful for restarting the process):
```bash
docker compose restart app
```

Remove containers and images and rebuild everything from scratch (use carefully):
```bash
docker compose down --rmi all
docker compose up -d --build
```

If build caching causes trouble, add `--no-cache` to `docker compose build` to force clean rebuilds:
```bash
docker compose build --no-cache app
docker compose up -d app
```

### Useful inspection & debugging commands

- Show running Compose services:
```bash
docker compose ps
```
- Tail logs (live) for the app service:
```bash
docker compose logs -f app
```
- Exec into the running `app` container (useful to check installed packages and debug inside the container):
```bash
docker compose exec app sh
# Then run commands inside the container, e.g.:
npm ls axios
```

### When to rebuild vs restart
- Rebuild (`docker compose up -d --build` or `docker compose build`) when:
  - You changed `package.json` (added/removed packages) or the `Dockerfile`.
  - You changed anything that affects the image contents at build time.
- Restart (`docker compose restart app`) when:
  - You only need to restart the running process, or you changed only files that are volume-mounted (note: the app image won't include changes to non-mounted workspace files).

### Notes & tips
- The `Dockerfile` runs `npm install --production` during the build, so any new dependency requires rebuilding the image.
- The `uploads/` directory is mounted as a volume (`./uploads:/app/uploads`) to persist files between container restarts. Avoid `docker compose down -v` unless you want to destroy that data.
- Use `--no-cache` if an image build fails due to caching or if you want a completely fresh build.
- If you need to free up disk space or force a rebuild, you can remove images and volumes, but be careful: this deletes persisted data and will require rebuilding:
```bash
docker compose down -v --rmi all
```

## �🛠️ Troubleshooting

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
