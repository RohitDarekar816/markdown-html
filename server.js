const express = require('express');
const multer = require('multer');
const MarkdownIt = require('markdown-it');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Serve static files
app.use(express.static('public'));

// Initialize Markdown parser
const md = new MarkdownIt();

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Markdown to Webpage API',
      version: '1.0.0',
      description: 'API for converting Markdown files to webpages',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
  },
  apis: ['./server.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Multer configuration for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/markdown' || path.extname(file.originalname) === '.md') {
      cb(null, true);
    } else {
      cb(new Error('Only .md files are allowed'));
    }
  },
});

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a Markdown file and convert it to a webpage
 *     description: Upload a .md file, convert it to HTML, and return a link to view the webpage
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The Markdown file to upload
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Successfully uploaded and converted the file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid file or error during conversion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Convert markdown to HTML
    const markdownContent = req.file.buffer.toString('utf-8');
    const htmlContent = md.render(markdownContent);

    // Generate unique ID for the file
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.html`;

    // Create HTML template with basic styling
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Converted Markdown</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 2px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #333;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 10px;
            margin-left: 0;
            color: #666;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>
    `;

    // Save HTML file
    fs.writeFileSync(path.join('public', fileName), fullHtml);

    // Return the URL
    const url = `http://localhost:${port}/${fileName}`;
    res.json({
      message: 'File uploaded and converted successfully',
      url: url
    });

  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing the file' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});