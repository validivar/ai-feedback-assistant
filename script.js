document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const charCount = document.getElementById('charCount');
    const feedbackContainer = document.getElementById('feedbackContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const exampleButtons = document.querySelectorAll('.example-btn');
    const languageSelect = document.getElementById('language');
    const statsSection = document.getElementById('statsSection');
    const statsGrid = document.getElementById('statsGrid');
    const demoNote = document.getElementById('demoNote');
    
    // State
    let isAIMode = false;
    
    // Example texts (unchanged, same as before)
    const examples = {
        essay: `The Impact of Artificial Intelligence on Modern Education

Artificial intelligence (AI) is transforming education in many significant ways. In recent years, we have seen the introduction of AI-powered tools that help both students and teachers. These tools can personalize learning experiences, automate administrative tasks, and provide instant feedback on assignments.

One of the most notable applications is adaptive learning platforms. These systems analyze a student's performance and adjust the difficulty of materials accordingly. For example, if a student struggles with algebra equations, the platform might provide additional practice problems or explanatory videos on that specific topic.

However, there are also challenges associated with AI in education. Some educators worry about over-reliance on technology and potential job displacement. Additionally, issues of data privacy and algorithmic bias need to be carefully addressed.

Despite these concerns, the potential benefits of AI in education are substantial. By automating routine tasks, teachers can focus more on individualized instruction and mentorship. Students can learn at their own pace with materials tailored to their needs.

In conclusion, while AI presents certain challenges, its thoughtful integration into educational systems promises to enhance learning outcomes and make quality education more accessible to diverse populations worldwide.`,

        email: `Subject: Proposal for Q3 Marketing Strategy Update

Hi Team,

I wanted to reach out about our marketing strategy for next quarter. We've been using the same approach for almost a year now and I think it's time we reconsider some elements.

Looking at the analytics from last quarter, our engagement rates have dropped by about 15% across social platforms. The conversion rate on our main landing page has also decreased slightly. I believe we need to refresh our content strategy and maybe explore new channels.

Some ideas I have include creating more video content since that seems to perform well. Also, we might want to consider influencer partnerships in our niche. Our competitors have been doing this with some success.

Let me know when you might have time to discuss this further. I can put together a more detailed proposal with specific action items and projected outcomes. I think if we act soon, we can turn things around before the holiday season.

Thanks,

Jordan
Marketing Lead`,

        pitch: `Our startup, EduAI, is developing an adaptive learning platform that uses artificial intelligence to personalize education for every student. 

The problem we're solving is the one-size-fits-all approach in traditional education systems. Students learn at different paces and have unique strengths and weaknesses, but current educational tools don't adequately address these individual differences.

Our solution analyzes how each student learns best and adapts the curriculum in real-time. The platform uses machine learning algorithms to identify knowledge gaps, recommend targeted exercises, and predict which concepts a student will struggle with before they even encounter difficulties.

We've conducted a pilot study with 200 students and saw a 35% improvement in test scores compared to control groups using traditional methods. Teachers reported saving an average of 10 hours per week on lesson planning and grading.

The edtech market is growing at 18% annually and is projected to reach $400 billion by 2025. We're seeking $1.5 million in seed funding to expand our development team, enhance our AI algorithms, and launch in 50 additional schools next academic year.

Join us in revolutionizing education and making personalized learning accessible to every student, regardless of their background or learning style.`,

        script: `[OPENING SCENE - DAY]

A busy coffee shop. People typing on laptops, having conversations. We focus on ALEX (20s), staring frustrated at their computer screen.

ALEX
(sighs)
I just can't get this right.

Enter JAMIE (20s), with two coffees in hand.

JAMIE
Hit another creative block?

ALEX
It's this script for the product launch video. It needs to be exciting but professional, innovative but trustworthy... I've rewritten the opening ten times.

Jamie sits down, sliding a coffee toward Alex.

JAMIE
Okay, let's hear what you have so far.

ALEX
(reading from screen)
"Introducing the future of productivity. Our revolutionary app transforms how teams collaborate with cutting-edge AI technology."

JAMIE
Hmm. It's not bad, but it sounds like every other tech product video. What makes YOUR app different?

Alex thinks for a moment.

ALEX
Well... it's not just about adding more features. It's about removing the barriers between ideas and execution.

JAMIE
Now THAT's interesting. Start there.

Alex's eyes light up with inspiration.

ALEX
You're right. Let me try something different...`
    };
    
    // Initialize
    init();
    
    function init() {
        updateCharCount();
        checkServerMode();
        setupEventListeners();
    }
    
    function updateCharCount() {
        const count = textInput.value.length;
        charCount.textContent = count;
        analyzeBtn.disabled = count < 10;
    }
    
    async function checkServerMode() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            isAIMode = data.ai_available;
            
            if (isAIMode) {
                demoNote.style.display = 'none';
                console.log('✅ Running in AI mode');
            } else {
                demoNote.style.display = 'flex';
                console.log('⚠️ Running in demo mode');
                demoNote.innerHTML = `<i class="fas fa-info-circle"></i> Running in demo mode with enhanced mock feedback. Add your OpenAI API key to .env for real AI analysis.`;
            }
        } catch (error) {
            console.log('Could not check server status, assuming demo mode');
            demoNote.style.display = 'flex';
        }
    }
    
    function setupEventListeners() {
        // Text input
        textInput.addEventListener('input', updateCharCount);
        
        // Example buttons
        exampleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const exampleType = this.getAttribute('data-example');
                textInput.value = examples[exampleType];
                updateCharCount();
                showNotification(`Loaded ${exampleType.replace(/\b\w/g, l => l.toUpperCase())} example`, 'info');
            });
        });
        
        // Analyze button
        analyzeBtn.addEventListener('click', analyzeText);
        
        // Keyboard shortcut
        textInput.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !analyzeBtn.disabled) {
                e.preventDefault();
                analyzeText();
            }
        });
    }
    
    async function analyzeText() {
        const text = textInput.value.trim();
        const language = languageSelect.value;
        
        if (text.length < 10) {
            showNotification('Please enter at least 10 characters for feedback', 'error');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, language })
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const feedback = await response.json();
            displayFeedback(feedback);
            
            // Show mode in notification
            const mode = feedback.mode || 'demo';
            if (mode.includes('demo') || mode.includes('fallback')) {
                showNotification('Using enhanced mock feedback (demo mode)', 'info');
            } else {
                showNotification('AI analysis complete!', 'success');
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            showNotification('Failed to get feedback. Please try again.', 'error');
            
            // Display mock feedback as fallback
            const mockFeedback = generateMockFeedback(text);
            displayFeedback(mockFeedback);
        } finally {
            setLoadingState(false);
        }
    }
    
    function setLoadingState(isLoading) {
        if (isLoading) {
            loadingSpinner.style.display = 'flex';
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        } else {
            loadingSpinner.style.display = 'none';
            analyzeBtn.disabled = textInput.value.length < 10;
            analyzeBtn.innerHTML = '<i class="fas fa-magic"></i> Get AI Feedback';
        }
    }
    
    function displayFeedback(feedback) {
        // Clear previous feedback
        feedbackContainer.innerHTML = '';
        
        // Show stats section
        statsSection.style.display = 'block';
        displayStats(feedback.stats);
        
        // Create feedback sections
        const sections = [
            {
                id: 'clarityFeedback',
                title: 'Clarity Analysis',
                icon: 'fas fa-brain',
                score: feedback.clarity.score,
                content: `<p>${feedback.clarity.feedback}</p>`,
                suggestions: feedback.clarity.suggestions,
                color: '#4cc9f0'
            },
            {
                id: 'toneFeedback',
                title: 'Tone Analysis',
                icon: 'fas fa-comment-alt',
                score: feedback.tone.score,
                content: `
                    <p><strong>Analysis:</strong> ${feedback.tone.analysis}</p>
                    <p><strong>Adjustment Recommendation:</strong> ${feedback.tone.adjustment}</p>
                `,
                suggestions: null,
                color: '#f72585'
            },
            {
                id: 'improvementFeedback',
                title: 'Improvement Suggestions',
                icon: 'fas fa-rocket',
                score: feedback.improvement.overall,
                content: `<p><strong>Revised Excerpt:</strong> ${feedback.improvement.revised_excerpt}</p>`,
                suggestions: feedback.improvement.suggestions,
                color: '#3f37c9'
            }
        ];
        
        // Generate HTML for each section
        sections.forEach(section => {
            const sectionHTML = `
                <div class="feedback-category" id="${section.id}" style="border-left-color: ${section.color}">
                    <div class="feedback-header">
                        <div class="feedback-title">
                            <i class="${section.icon}"></i>
                            <h3>${section.title}</h3>
                        </div>
                        <div class="score-badge" style="background: linear-gradient(90deg, ${section.color}, ${section.color}99)">
                            ${section.score}/100
                        </div>
                    </div>
                    <div class="feedback-content">
                        ${section.content}
                    </div>
                    ${section.suggestions ? `
                    <div class="suggestions">
                        <h4><i class="fas fa-lightbulb"></i> Actionable Suggestions:</h4>
                        <ul class="suggestions-list">
                            ${section.suggestions.map(suggestion => `
                                <li class="suggestion-item">
                                    <i class="fas fa-check-circle" style="color: ${section.color}"></i>
                                    <span>${suggestion}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
            feedbackContainer.innerHTML += sectionHTML;
        });
        
        // Add mode indicator if in demo mode
        if (feedback.mode && feedback.mode.includes('demo')) {
            const modeIndicator = `
                <div class="mode-indicator" style="
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #856404;
                ">
                    <i class="fas fa-flask"></i>
                    <span>Demo Mode: Showing enhanced mock feedback. Add OpenAI API key for real AI analysis.</span>
                </div>
            `;
            feedbackContainer.innerHTML += modeIndicator;
        }
        
        // Scroll to feedback
        feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function displayStats(stats) {
        if (!stats) return;
        
        const statCards = [
            { value: stats.word_count || 0, label: 'Words', icon: 'fas fa-font' },
            { value: stats.character_count || 0, label: 'Characters', icon: 'fas fa-keyboard' },
            { value: stats.reading_time || '0 min', label: 'Reading Time', icon: 'fas fa-clock' }
        ];
        
        if (stats.sentence_count) {
            statCards.splice(2, 0, { 
                value: stats.sentence_count, 
                label: 'Sentences', 
                icon: 'fas fa-ellipsis-h' 
            });
        }
        
        statsGrid.innerHTML = statCards.map(stat => `
            <div class="stat-card">
                <i class="${stat.icon}" style="font-size: 2rem; color: #4361ee; margin-bottom: 10px;"></i>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
    }
    
    function generateMockFeedback(text) {
        const wordCount = text.split(/\s+/).length;
        const charCount = text.length;
        
        return {
            clarity: {
                score: Math.min(95, 70 + Math.floor(wordCount / 50)),
                feedback: "Your text shows potential but could be clearer with more specific examples and better structure.",
                suggestions: [
                    "Use active voice instead of passive",
                    "Break complex ideas into simpler sentences",
                    "Add transitional phrases between paragraphs"
                ]
            },
            tone: {
                score: Math.min(95, 65 + Math.floor(wordCount / 40)),
                analysis: "The tone is appropriate but could be more engaging for your intended audience.",
                adjustment: "Try using more positive language and addressing the reader directly."
            },
            improvement: {
                overall: Math.min(95, 60 + Math.floor(wordCount / 30)),
                suggestions: [
                    "Start with a stronger opening hook",
                    "Include data or examples to support claims",
                    "End with a clear conclusion",
                    "Vary sentence length for better rhythm"
                ],
                revised_excerpt: "Improved version: '" + text.substring(0, Math.min(80, text.length)) + "...' (more direct and confident)"
            },
            stats: {
                word_count: wordCount,
                character_count: charCount,
                reading_time: `${Math.ceil(wordCount / 200)} minute${Math.ceil(wordCount / 200) !== 1 ? 's' : ''}`
            },
            mode: "demo_generated"
        };
    }
    
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle',
            warning: 'exclamation-triangle'
        };
        
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification" style="
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                margin-left: auto;
                padding: 0 5px;
            ">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : 
                        type === 'error' ? '#f8d7da' : 
                        type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : 
                    type === 'error' ? '#721c24' : 
                    type === 'warning' ? '#856404' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            z-index: 1000;
            max-width: 400px;
            border-left: 4px solid ${type === 'success' ? '#28a745' : 
                             type === 'error' ? '#dc3545' : 
                             type === 'warning' ? '#ffc107' : '#17a2b8'};
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Close button handler
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
});