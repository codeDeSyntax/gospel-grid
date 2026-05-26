import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import multer from 'multer';
import { pipeline } from '@xenova/transformers';

export class WhisperSpeechServer {
  constructor(options = {}) {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.transcriber = null;
    this.port = options.port || process.env.PORT || 3001;
    this.model = options.model || process.env.WHISPER_MODEL || 'Xenova/whisper-small.en';

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeWhisper();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://*'],
      credentials: true,
    }));

    this.app.use(express.json());
    this.app.use(express.static('public'));

    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
          return;
        }

        cb(new Error('Only audio files are allowed'));
      },
    });
  }

  async initializeWhisper() {
    console.log('Initializing Whisper model...');
    console.log('First run may take a few minutes to download the model.');

    try {
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        this.model,
        {
          revision: 'main',
          device: process.env.WHISPER_DEVICE || 'cpu',
        },
      );

      console.log('Whisper model loaded successfully.');
    } catch (error) {
      console.error('Failed to load Whisper model:', error);
      process.exit(1);
    }
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        service: 'audio-transcription',
        status: 'healthy',
        whisper: this.transcriber ? 'loaded' : 'loading',
        model: this.model,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.get('/languages', (req, res) => {
      res.json({
        languages: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish' },
          { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' },
          { code: 'it', name: 'Italian' },
        ],
      });
    });

    this.app.post('/transcribe', this.upload.single('audio'), async (req, res) => {
      try {
        if (!this.transcriber) {
          return res.status(503).json({
            error: 'Whisper model not loaded yet',
          });
        }

        if (!req.file) {
          return res.status(400).json({
            error: 'No audio file provided',
          });
        }

        console.log(`Transcribing audio file: ${req.file.originalname}`);

        const startTime = Date.now();
        const result = await this.transcriber(req.file.buffer);
        const processingTime = Date.now() - startTime;

        console.log(`Transcription completed in ${processingTime}ms`);

        return res.json({
          transcript: result.text,
          processingTime,
          confidence: result.confidence || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Transcription error:', error);
        return res.status(500).json({
          error: 'Transcription failed',
          details: error.message,
        });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New audio transcription WebSocket connection established.');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);

          switch (message.type) {
            case 'start_recognition':
              ws.send(JSON.stringify({
                type: 'recognition_started',
                timestamp: Date.now(),
              }));
              break;

            case 'audio_chunk': {
              if (!this.transcriber) {
                ws.send(JSON.stringify({
                  type: 'error',
                  error: 'Whisper model not loaded yet',
                }));
                return;
              }

              const audioBuffer = Buffer.from(message.audio, 'base64');
              const result = await this.transcriber(audioBuffer);

              ws.send(JSON.stringify({
                type: 'transcription_result',
                transcript: result.text,
                isFinal: true,
                confidence: result.confidence || 0,
                timestamp: Date.now(),
              }));
              break;
            }

            case 'stop_recognition':
              ws.send(JSON.stringify({
                type: 'recognition_stopped',
                timestamp: Date.now(),
              }));
              break;

            default:
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Unknown message type',
              }));
          }
        } catch (error) {
          console.error('Audio WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message',
            details: error.message,
          }));
        }
      });

      ws.on('close', () => {
        console.log('Audio transcription WebSocket connection closed.');
      });

      ws.on('error', (error) => {
        console.error('Audio transcription WebSocket error:', error);
      });
    });
  }

  start() {
    this.server.listen(this.port, '127.0.0.1', () => {
      console.log('Whisper speech-to-text server started.');
      console.log(`HTTP server: http://127.0.0.1:${this.port}`);
      console.log(`WebSocket server: ws://127.0.0.1:${this.port}`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  GET  /health       - Server health check');
      console.log('  GET  /languages    - Supported languages');
      console.log('  POST /transcribe   - Upload audio file for transcription');
      console.log('  WS   /             - WebSocket for real-time transcription');
    });

    process.on('SIGINT', () => {
      console.log('Shutting down audio transcription server...');
      this.server.close(() => {
        console.log('Audio transcription server closed.');
        process.exit(0);
      });
    });
  }
}
