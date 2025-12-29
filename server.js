const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// OpenAI setup with better error handling
let openai = null;
let isAIAvailable = false;

try {
  const { OpenAI } = require('openai');
  
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    isAIAvailable = true;
    console.log('✅ OpenAI API initialized successfully');
  } else {
    console.log('⚠️  Running in demo mode (no OpenAI API key found)');
    console.log('💡 Add your OpenAI API key to .env for real AI feedback');
  }
} catch (error) {
  console.log('⚠️  OpenAI package error. Using mock responses:', error.message);
}

// Helper function for mock responses
const generateMockFeedback = (text) => {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const charCount = text.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  // Calculate some basic metrics for mock scoring
  const avgWordLength = text.length / Math.max(1, wordCount);
  const sentenceComplexity = wordCount / Math.max(1, sentences);
  
  // Generate scores based on text characteristics
  const clarityScore = Math.min(95, Math.max(50, 70 + (avgWordLength < 6 ? 10 : 0) - (sentenceComplexity > 20 ? 15 : 0)));
  const toneScore = Math.min(95, Math.max(50, 65 + (text.includes('!') ? 5 : 0) + (text.includes('?') ? 5 : 0)));
  const improvementScore = Math.min(95, Math.max(50, 60 + (wordCount > 100 ? 15 : 0)));
  
  return {
    clarity: {
      score: clarityScore,
      feedback: wordCount < 50 
        ? "Your text is quite brief. Consider adding more details and examples to improve clarity."
        : "Your text is generally clear, but could benefit from more specific examples and transitional phrases to improve flow.",
      suggestions: [
        "Use more active voice constructions",
        "Break long sentences into shorter ones",
        "Define technical terms for broader audience",
        "Add transitional words between paragraphs"
      ].slice(0, 3 + Math.floor(Math.random() * 2))
    },
    tone: {
      score: toneScore,
      analysis: text.match(/please|thank you|appreciate/i) 
        ? "Your tone is polite and professional, which is appropriate for most contexts."
        : "The tone is professional but could be more engaging for your target audience.",
      adjustment: "Consider using more positive language and addressing the reader directly with 'you' more often."
    },
    improvement: {
      overall: improvementScore,
      suggestions: [
        "Add a stronger opening sentence to hook the reader",
        "Include data or examples to support your claims",
        "End with a clear call to action or conclusion",
        "Proofread for consistent tense usage",
        "Vary sentence structure for better rhythm"
      ].slice(0, 4),
      revised_excerpt: generateRevisedExcerpt(text)
    },
    stats: {
      word_count: wordCount,
      character_count: charCount,
      sentence_count: sentences,
      reading_time: `${Math.ceil(wordCount / 200)} minute${Math.ceil(wordCount / 200) !== 1 ? 's' : ''}`
    },
    mode: "demo"
  };
};

// Generate a revised excerpt
const generateRevisedExcerpt = (text) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text.substring(0, 100)];
  if (sentences.length === 0) return "Original text is too short for revision.";
  
  const firstSentence = sentences[0].trim();
  const words = firstSentence.split(' ');
  
  if (words.length <= 5) {
    return `"${firstSentence}" could be expanded with more details.`;
  }
  
  // Simple "improvement" by making it more active
  const improved = firstSentence
    .replace(/I think/g, '')
    .replace(/maybe/g, '')
    .replace(/perhaps/g, '')
    .replace(/\s+/g, ' ')
    .trim();
    
  return `Original: "${firstSentence.substring(0, 80)}..."
Improved: "${improved.substring(0, 80)}..." (more direct and confident)`;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'AI Feedback Assistant',
    version: '1.0.0',
    ai_available: isAIAvailable,
    timestamp: new Date().toISOString()
  });
});

// AI Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { text, language = 'English' } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text is required' });
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 characters' });
    }
    
    console.log(`Processing ${trimmedText.length} characters for feedback...`);
    
    // If OpenAI is not available, return mock data immediately
    if (!isAIAvailable || !openai) {
      console.log('Using enhanced mock feedback');
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      const feedback = generateMockFeedback(trimmedText);
      return res.json(feedback);
    }
    
    // Prepare the prompt for OpenAI
    const prompt = `You are a writing assistant. Analyze this text for clarity, tone, and improvements.
    
Text: "${trimmedText.substring(0, 2000)}"
Language: ${language}

Provide feedback in this JSON format only:
{
  "clarity": {
    "score": 0-100,
    "feedback": "string",
    "suggestions": ["string", "string", "string"]
  },
  "tone": {
    "score": 0-100,
    "analysis": "string",
    "adjustment": "string"
  },
  "improvement": {
    "overall": 0-100,
    "suggestions": ["string", "string", "string", "string"],
    "revised_excerpt": "string"
  }
}

Be constructive, specific, and helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful writing assistant. Always respond with valid JSON in the exact format requested." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    const responseText = completion.choices[0].message.content;
    
    // Parse the JSON response
    let feedback;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
      
      // Add stats
      const wordCount = trimmedText.split(/\s+/).length;
      feedback.stats = {
        word_count: wordCount,
        character_count: trimmedText.length,
        sentence_count: (trimmedText.match(/[.!?]+/g) || []).length,
        reading_time: `${Math.ceil(wordCount / 200)} minute${Math.ceil(wordCount / 200) !== 1 ? 's' : ''}`
      };
      feedback.mode = "ai";
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      feedback = generateMockFeedback(trimmedText);
      feedback.mode = "demo_fallback";
    }
    
    res.json(feedback);
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Return mock data on error
    if (req.body && req.body.text) {
      const feedback = generateMockFeedback(req.body.text.trim());
      feedback.mode = "error_fallback";
      feedback.error_message = error.message;
      res.json(feedback);
    } else {
      res.status(500).json({ 
        error: 'Failed to generate feedback',
        message: error.message,
        mode: "error"
      });
    }
  }
});

// Serve the main page for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', mode: "server_error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 AI Feedback Assistant Server Started!
📍 Port: ${PORT}
🔗 Local: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🤖 AI Mode: ${isAIAvailable ? '✅ Enabled' : '⚠️ Demo Mode'}
  `);
  
  if (!isAIAvailable) {
    console.log(`
💡 To enable real AI feedback:
   1. Get an API key from https://platform.openai.com/api-keys
   2. Add it to your .env file as OPENAI_API_KEY=your_key_here
   3. Restart the server
    `);
  }
});