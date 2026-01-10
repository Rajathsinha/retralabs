const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// HTML file path
const htmlPath = path.join(__dirname, 'views', 'index.html');

// Route to serve the main page (read file on each request for development)
app.get('/', (req, res) => {
    try {
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading HTML file:', error);
        res.status(500).send('Error loading page');
    }
});

// Cart page route
app.get('/cart', (req, res) => {
    try {
        const cartPath = path.join(__dirname, 'views', 'cart.html');
        const cartContent = fs.readFileSync(cartPath, 'utf8');
        res.send(cartContent);
    } catch (error) {
        console.error('Error reading cart file:', error);
        res.status(500).send('Error loading cart page');
    }
});

// Checkout page route
app.get('/checkout', (req, res) => {
    try {
        const checkoutPath = path.join(__dirname, 'views', 'checkout.html');
        const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
        res.send(checkoutContent);
    } catch (error) {
        console.error('Error reading checkout file:', error);
        res.status(500).send('Error loading checkout page');
    }
});

// API route for contact form submission
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Validate input
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Here you would typically save to database or send email
    // For now, we'll just log it and return success
    console.log('Contact form submission:', {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString()
    });
    
    res.json({ 
        success: true, 
        message: 'Thank you for your message! We will get back to you soon.' 
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for CI/CD deployment
app.post('/webhook/deploy', (req, res) => {
    const crypto = require('crypto');

    // GitHub webhook secret (set this environment variable on your server)
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.warn('WEBHOOK_SECRET not set - webhook verification disabled');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get the signature from headers
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).json({ error: 'No signature provided' });
    }

    // Create HMAC hash
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const payload = JSON.stringify(req.body);
    hmac.update(payload);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    // Verify signature
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if it's a push event
    const event = req.headers['x-github-event'];
    if (event !== 'push') {
        return res.status(200).json({ message: 'Ignored non-push event' });
    }

    // Check if push is to main/master branch
    const ref = req.body.ref;
    const branch = ref.replace('refs/heads/', '');
    if (branch !== 'main' && branch !== 'master') {
        return res.status(200).json({ message: `Ignored push to ${branch} branch` });
    }

    console.log(`🚀 Deployment triggered by push to ${branch} branch`);

    // Execute deployment script
    const { spawn } = require('child_process');
    const deployProcess = spawn('./deploy.sh', [], {
        stdio: 'inherit',
        cwd: __dirname
    });

    deployProcess.on('close', (code) => {
        console.log(`Deployment process exited with code ${code}`);
    });

    deployProcess.on('error', (error) => {
        console.error('Failed to start deployment:', error);
    });

    res.status(200).json({
        message: 'Deployment triggered',
        branch: branch,
        commit: req.body.after,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RetraLabs server is running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

