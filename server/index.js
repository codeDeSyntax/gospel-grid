import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import multer from 'multer';
import { pipeline } from '@xenova/transformers';

class WhisperSpeechServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.transcriber = null;
    this.port = process.env.PORT || 3001;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeWhisper();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://*'],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Setup multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed'));
        }
      }
    });
  }

  async initializeWhisper() {
    console.log('🎤 Initializing Whisper model...');
    console.log('⚠️  First run may take a few minutes to download the model');
    
    try {
      // Use the small model for faster loading and reasonable accuracy
      // Options: tiny, base, small, medium, large
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-small.en',
        { 
          revision: 'main',
          device: 'cpu', // Use 'gpu' if you have CUDA support
        }
      );
      
      console.log('✅ Whisper model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load Whisper model:', error);
      process.exit(1);
    }
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        whisper: this.transcriber ? 'loaded' : 'loading',
        timestamp: new Date().toISOString()
      });
    });

    // Get supported languages
    this.app.get('/languages', (req, res) => {
      res.json({
        languages: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish' },
          { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' },
          { code: 'it', name: 'Italian' },
          // Add more as needed
        ]
      });
    });

    // File upload transcription endpoint
    this.app.post('/transcribe', this.upload.single('audio'), async (req, res) => {
      try {
        if (!this.transcriber) {
          return res.status(503).json({ 
            error: 'Whisper model not loaded yet' 
          });
        }

        if (!req.file) {
          return res.status(400).json({ 
            error: 'No audio file provided' 
          });
        }

        console.log(`📝 Transcribing audio file: ${req.file.originalname}`);
        
        const startTime = Date.now();
        const result = await this.transcriber(req.file.buffer);
        const processingTime = Date.now() - startTime;

        console.log(`✅ Transcription completed in ${processingTime}ms`);

        res.json({
          transcript: result.text,
          processingTime,
          confidence: result.confidence || 0,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('❌ Transcription error:', error);
        res.status(500).json({ 
          error: 'Transcription failed', 
          details: error.message 
        });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          
          switch (message.type) {
            case 'start_recognition':
              ws.send(JSON.stringify({
                type: 'recognition_started',
                timestamp: Date.now()
              }));
              break;

            case 'audio_chunk':
              if (!this.transcriber) {
                ws.send(JSON.stringify({
                  type: 'error',
                  error: 'Whisper model not loaded yet'
                }));
                return;
              }

              // Process audio chunk
              const audioBuffer = Buffer.from(message.audio, 'base64');
              const result = await this.transcriber(audioBuffer);
              
              ws.send(JSON.stringify({
                type: 'transcription_result',
                transcript: result.text,
                isFinal: true, // Whisper always returns final results
                confidence: result.confidence || 0,
                timestamp: Date.now()
              }));
              break;

            case 'stop_recognition':
              ws.send(JSON.stringify({
                type: 'recognition_stopped',
                timestamp: Date.now()
              }));
              break;

            default:
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Unknown message type'
              }));
          }
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
            details: error.message
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('🚀 Whisper Speech-to-Text Server started');
      console.log(`📡 HTTP Server: http://localhost:${this.port}`);
      console.log(`🔌 WebSocket Server: ws://localhost:${this.port}`);
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /health       - Server health check`);
      console.log(`  GET  /languages    - Supported languages`);
      console.log(`  POST /transcribe   - Upload audio file for transcription`);
      console.log(`  WS   /             - WebSocket for real-time transcription`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down server...');
      this.server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  }
}

// Start the server
const server = new WhisperSpeechServer();
server.start();