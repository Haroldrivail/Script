// Script to download an icon for the Folder Organizer application
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Created assets directory');
}

// URL to a folder icon (using a public domain icon as an example)
const iconUrl = 'https://cdn-icons-png.flaticon.com/512/716/716784.png';
const iconPath = path.join(assetsDir, 'icon.png');

console.log('Downloading icon from', iconUrl);

// Download the icon
https.get(iconUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download icon: ${response.statusCode} ${response.statusMessage}`);
    return;
  }

  const fileStream = fs.createWriteStream(iconPath);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`Icon downloaded and saved to ${iconPath}`);
  });
}).on('error', (err) => {
  console.error('Error downloading icon:', err.message);
});