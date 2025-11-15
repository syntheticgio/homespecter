# HomeSpecter Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Setup                      │
│                                                              │
│  ┌──────────────────────┐      ┌────────────────────────┐  │
│  │   App Container      │      │  MongoDB Container     │  │
│  │                      │      │                        │  │
│  │  - Node.js + Express │◄────►│  - MongoDB 7.0        │  │
│  │  - Port 3000        │      │  - Port 27017         │  │
│  │  - Volume: uploads/  │      │  - Volume: db_data/   │  │
│  └──────────────────────┘      └────────────────────────┘  │
│           ▲                                                  │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │   Browser     │
    │ (localhost:3000) │
    └───────────────┘
```

## Application Stack

### Frontend (Client Side)
```
┌─────────────────────────────────────────┐
│         index.html (Structure)          │
├─────────────────────────────────────────┤
│         styles.css (Styling)            │
├─────────────────────────────────────────┤
│      app.js (Client-side Logic)         │
│  - API calls to backend                 │
│  - DOM manipulation                     │
│  - Form handling                        │
│  - Modal dialogs                        │
└─────────────────────────────────────────┘
```

### Backend (Server Side)
```
┌─────────────────────────────────────────┐
│            server.js                     │
├─────────────────────────────────────────┤
│  Express.js Application                 │
│  - RESTful API endpoints                │
│  - MongoDB connection (Mongoose)        │
│  - File upload handling (Multer)        │
│  - Rate limiting middleware             │
│  - CORS enabled                         │
└─────────────────────────────────────────┘
```

## Data Flow

### Adding an Appliance
```
User fills form
      │
      ▼
Submit with files (FormData)
      │
      ▼
POST /api/appliances
      │
      ▼
Multer processes file uploads
      │
      ▼
Mongoose validates data
      │
      ▼
MongoDB stores appliance record
      │
      ▼
Response sent to client
      │
      ▼
UI updates with new appliance
```

### Viewing Appliances
```
Page loads
      │
      ▼
GET /api/appliances
      │
      ▼
MongoDB retrieves all records
      │
      ▼
Response with appliance array
      │
      ▼
Render tiles in grid layout
```

## Database Schema

### Appliance Model
```javascript
{
  name: String (required),
  category: String (required),
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  warrantyExpiry: Date,
  purchasePrice: Number,
  location: String,
  notes: String,
  photos: [String],        // Array of filenames
  manuals: [String],       // Array of filenames
  createdAt: Date,
  updatedAt: Date
}
```

## File Storage

```
uploads/
  ├── [timestamp]-[random]-photo1.jpg
  ├── [timestamp]-[random]-photo2.jpg
  ├── [timestamp]-[random]-manual1.pdf
  └── [timestamp]-[random]-manual2.pdf
```

Files are named with:
- Timestamp
- Random number
- Original filename

This prevents naming conflicts and maintains file extensions.

## API Endpoints

```
┌──────────────────────────────────────────────────────┐
│ Endpoint                │ Method │ Description       │
├──────────────────────────────────────────────────────┤
│ /api/appliances         │ GET    │ List all          │
│ /api/appliances/:id     │ GET    │ Get single        │
│ /api/appliances         │ POST   │ Create new        │
│ /api/appliances/:id     │ PUT    │ Update existing   │
│ /api/appliances/:id     │ DELETE │ Remove            │
│ /health                 │ GET    │ Health check      │
└──────────────────────────────────────────────────────┘
```

## Security Layers

```
Request
   │
   ▼
Rate Limiter (100 req/15min)
   │
   ▼
CORS Validation
   │
   ▼
Input Validation (Mongoose)
   │
   ▼
NoSQL Injection Protection ($set operator)
   │
   ▼
File Type Validation (Multer)
   │
   ▼
Process Request
   │
   ▼
Response
```

## Frontend Components

### Main Layout
```
┌────────────────────────────────────────────────┐
│ Sidebar          │  Main Content Area          │
│                  │                             │
│ 🏠 HomeSpecter  │  [View Header]              │
│                  │                             │
│ 📱 Appliances   │  ┌───────┐ ┌───────┐       │
│ ➕ Add          │  │ Tile  │ │ Tile  │       │
│ ⚙️  Settings    │  └───────┘ └───────┘       │
│                  │  ┌───────┐ ┌───────┐       │
│                  │  │ Tile  │ │ Tile  │       │
│                  │  └───────┘ └───────┘       │
└────────────────────────────────────────────────┘
```

### Appliance Tile
```
┌─────────────────────────┐
│   [Photo or Icon]       │
│                         │
│  Appliance Name         │
│  [Category Badge]       │
│                         │
│  Brand: Samsung         │
│  Location: Kitchen      │
│  Model: ABC123          │
│                         │
│  [Edit]  [Delete]       │
└─────────────────────────┘
```

### Add Appliance Form
```
┌──────────────────────────────────┐
│  Add New Appliance               │
├──────────────────────────────────┤
│  Name: [____________] *          │
│  Category: [▼________] *         │
│  Manufacturer: [____________]    │
│  Model: [____________]           │
│  Serial #: [____________]        │
│  Location: [____________]        │
│  Purchase Date: [____/____]      │
│  Warranty: [____/____]           │
│  Price: [____________]           │
│  Notes: [________________]       │
│                                  │
│  Photos: [Choose Files]          │
│  Manuals: [Choose Files]         │
│                                  │
│  [Save]  [Clear]                 │
└──────────────────────────────────┘
```

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p uploads
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
services:
  mongodb:
    - Image: mongo:7.0
    - Persistent volume for data
    - Network: homespecter-network
  
  app:
    - Build from Dockerfile
    - Depends on mongodb
    - Environment: MONGODB_URI
    - Volume: uploads/
    - Network: homespecter-network
```

## Technology Choices

### Why Node.js + Express?
- Lightweight and fast
- JavaScript on both frontend and backend
- Large ecosystem of packages
- Easy to containerize

### Why MongoDB?
- Schema flexibility for appliance data
- Easy to scale
- JSON-like documents match JavaScript objects
- Good Docker support

### Why Vanilla JavaScript?
- No build step required
- Smaller bundle size
- Faster development for simple UIs
- Easier to understand and maintain

### Why Docker?
- Consistent environment
- Easy deployment
- Isolated services
- Simple scaling
- Built-in orchestration with compose

## Performance Considerations

- **Rate Limiting**: Prevents API abuse
- **Static File Serving**: Express serves frontend files efficiently
- **Database Indexing**: MongoDB indexes on _id for fast queries
- **File Size Limits**: 10MB limit prevents server overload
- **Connection Pooling**: Mongoose manages MongoDB connections

## Future Enhancements

Potential improvements:
1. User authentication and authorization
2. Search and filter functionality
3. Export data to CSV/PDF
4. Reminder notifications for warranty expiry
5. Maintenance scheduling
6. Cost tracking and analytics
7. Multi-user support with sharing
8. Mobile app
9. Barcode scanning for quick entry
10. Integration with manufacturer APIs
