# Project Todos

## Features

- [ ] Implement "Edit Appliance" functionality
- [ ] Add search and filtering for appliances
- [ ] Create a notification system for expiring warranties
- [ ] Develop a dashboard view with appliance statistics
- [ ] Add backup and restore functionality for appliance data

## New Feature Requests

### 1. Paste Images into Image Field
- **Description:** Allow users to paste images directly into the image upload field from their clipboard, in addition to the existing file upload and URL options.
- **Phase 1 (Frontend):** Implement a JavaScript event listener on the image input area to handle the `paste` event. Extract the image data from the clipboard.
- **Phase 2 (Frontend/Backend):** Convert the pasted image data into a `File` object or a data URL and append it to the form data to be uploaded to the server. Ensure the backend can handle this format.

### 2. Autocomplete for Manufacturer and Model
- **Description:** Provide autocomplete suggestions for the "Manufacturer" and "Model" fields to ensure consistency and speed up data entry.
- **Phase 1 (Backend):** [x] Create new API endpoints (e.g., `/api/manufacturers` and `/api/models?manufacturer=...`) that return a distinct list of existing manufacturers and models from the database.
- **Phase 2 (Frontend):** Implement autocomplete functionality on the "Manufacturer" input field, fetching data from the new endpoint.
- **Phase 3 (Frontend):** Once a manufacturer is selected, enable and implement autocomplete on the "Model" input field, fetching models filtered by the selected manufacturer.

### 4. Fetch Current Price from Amazon
- **Description:** Add a "Current Price" field next to "Purchase Price". When a manufacturer and model are entered, attempt to fetch the current price from a source like Amazon.
- **Phase 1 (Backend):** Create a new API endpoint (e.g., `/api/price-lookup?manufacturer=...&model=...`) that scrapes or uses an API (like Amazon's Product Advertising API) to find the product's current price. This will require significant research into scraping techniques or API integration.
- **Phase 2 (Frontend):** Add a "Current Price" display field (read-only) and a "Fetch Price" button next to it. When the button is clicked, call the new backend endpoint and display the result.
- **Note:** This is a complex feature that may be unreliable due to challenges with web scraping and API access.

### 5. Autocomplete for Location
- **Description:** Similar to the manufacturer field, the "Location" field should provide autocomplete suggestions based on locations already entered for other appliances.
- **Phase 1 (Backend):** Create a new API endpoint (e.g., `/api/locations`) that returns a distinct list of locations from the database.
- **Phase 2 (Frontend):** Implement autocomplete on the "Location" input field, fetching data from the new endpoint.

### 6. AI-Generated Product Summary
- **Description:** Add a "Summary" section to the appliance details. After a model number and manufacturer are entered, fetch a summary of the product.
- **Phase 1 (Backend):** Create a new API endpoint (e.g., `/api/product-summary?manufacturer=...&model=...`). This endpoint would need to:
    - Search the web for the product.
    - Pass the product information to a Large Language Model (LLM) to generate a concise summary. This could be a local model (for privacy) or a cloud-based one (like OpenAI's API).
- **Phase 2 (Frontend):** Add a "Summary" section in the appliance form and details view. Add a "Generate Summary" button that calls the backend endpoint and displays the generated text.
- **Note:** This is an advanced feature that depends on access to an LLM and reliable web search results.

## Bugs

- [ ] **Orphaned File Cleanup:** On appliance deletion, associated files (photos, manuals) are not removed from the `uploads` directory. Implement a cleanup step to delete these files to save space and prevent clutter.
- [ ] **SSRF Protection:** The remote file fetching feature is a potential Server-Side Request Forgery (SSRF) vector. Add more robust protection, such as a DNS blacklist for internal/reserved IP ranges and strict egress firewall rules for production environments.
- [ ] **Add Tests for Remote File Fetching:** Create integration tests that simulate fetching remote files. Use a mock HTTP server to test various scenarios, including large files, disallowed content types, private hostnames, and network errors.
- [ ] Fix any potential issues with file uploads and URL fetching
- [ ] Ensure consistent error handling across the application

## Refinements

- [ ] **Dynamic URL Input Fields:** Replace the textarea for multiple URLs with a more user-friendly interface that allows dynamically adding or removing URL input fields.
- [ ] **Visual Feedback for Long Operations:** Add a progress bar or spinner to provide visual feedback to the user during long-running operations like fetching remote files or large uploads.
- [ ] **Favicon Fallbacks:** Add traditional `favicon.ico` and PNG-based favicons for older browsers that do not support SVG favicons.
- [ ] Implement dark mode
- [ ] Implement the grid/list view toggle for appliances
- [ ] Improve UI/UX for the appliance form
- [ ] Add pagination for the appliance list
- [ ] Enhance the appliance details view with an image carousel
- [ ] Add sorting options to the appliance list (by name, category, etc.)