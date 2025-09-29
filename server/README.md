# StreamSpire Speech-to-Text Server

A local Whisper-based speech-to-text server that provides privacy-focused, offline transcription capabilities.

## Features

- 🔒 **Complete Privacy** - All processing happens locally, no data sent to external services
- 🌐 **Offline Capable** - Works without internet connection after initial model download
- ⚡ **Real-time Transcription** - WebSocket support for live audio streaming
- 📁 **File Upload Support** - REST API for transcribing audio files
- 🌍 **Multi-language** - Supports multiple languages through Whisper models
- 🎯 **High Accuracy** - Uses OpenAI's Whisper models for excellent transcription quality

## Quick Start

1. **Install Dependencies**

   ```bash
   cd server
   npm install
   ```

2. **Start the Server**

   ```bash
   npm start
   ```

3. **First Run**
   - The first startup will download the Whisper model (~150MB)
   - This may take a few minutes depending on your internet speed
   - Subsequent starts will be much faster

## API Endpoints

### HTTP REST API

- **GET** `/health` - Check server status and model loading state
- **GET** `/languages` - Get list of supported languages
- **POST** `/transcribe` - Upload audio file for transcription

### WebSocket API

Connect to `ws://localhost:3001` for real-time transcription:

```javascript
const ws = new WebSocket("ws://localhost:3001");

// Start recognition
ws.send(JSON.stringify({ type: "start_recognition" }));

// Send audio chunks
ws.send(
  JSON.stringify({
    type: "audio_chunk",
    audio: base64AudioData,
  })
);

// Stop recognition
ws.send(JSON.stringify({ type: "stop_recognition" }));
```

## Configuration

Edit `index.js` to customize:

- **Model Size**: Change `'Xenova/whisper-small.en'` to:

  - `whisper-tiny.en` - Fastest, lower accuracy
  - `whisper-base.en` - Balanced
  - `whisper-small.en` - Good accuracy (default)
  - `whisper-medium.en` - Better accuracy, slower
  - `whisper-large` - Best accuracy, slowest

- **Port**: Set environment variable `PORT=3001`

## Model Information

| Model  | Size   | Speed   | Accuracy  |
| ------ | ------ | ------- | --------- |
| tiny   | ~40MB  | Fastest | Good      |
| base   | ~75MB  | Fast    | Better    |
| small  | ~150MB | Medium  | Very Good |
| medium | ~300MB | Slow    | Excellent |
| large  | ~600MB | Slowest | Best      |

## Integration with Electron App

The server is designed to work seamlessly with the StreamSpire Electron app through:

1. **HTTP API** - For file-based transcription
2. **WebSocket** - For real-time microphone input transcription

## Troubleshooting

### Model Download Issues

- Ensure stable internet connection for first run
- Check available disk space (models require 150MB-600MB)
- Try restarting if download fails

### Performance Issues

- Use smaller model for better performance
- Close other resource-intensive applications
- Consider using GPU acceleration if available

### Connection Issues

- Check if port 3001 is available
- Verify firewall settings allow local connections
- Ensure CORS settings match your Electron app's origin

## Development

### Watch Mode

```bash
npm run dev
```

### Testing the API

```bash
# Health check
curl http://localhost:3001/health

# Upload audio file
curl -X POST -F "audio=@test.wav" http://localhost:3001/transcribe
```
