document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".tool-card").forEach(box => {
        box.addEventListener("click", function () {
            const feature = this.getAttribute("onclick").split("'")[1]; // Extract the feature type from the onclick attribute
            handleToolClick(feature);  // Call the function
        });
    });
});

// Function to show a modern dialog
function showDialog(feature, text, isLoading = false) {
    // Remove existing dialogs before adding a new one
    document.querySelectorAll(".dialog-overlay").forEach(dialog => dialog.remove());
    
    // Create dialog elements
    const overlay = document.createElement("div");
    overlay.classList.add("dialog-overlay");
    
    // Get feature title for the dialog header
    const featureTitle = getFeatureTitle(feature);
    
    // Format text paragraphs for better readability
    let formattedText = '';
    if (text && !isLoading) {
        // Split text on periods followed by spaces to create paragraphs
        const sentences = text.split(/\.\s+/);
        let paragraphs = [];
        let currentParagraph = '';
        
        // Group sentences into paragraphs (3-4 sentences per paragraph)
        sentences.forEach((sentence, index) => {
            if (!sentence.trim()) return;
            
            // Add period back except for the last sentence if it doesn't have one
            const needsPeriod = !sentence.endsWith('.') && index < sentences.length - 1;
            currentParagraph += sentence + (needsPeriod ? '. ' : ' ');
            
            // Create a new paragraph every 3-4 sentences or at the end
            if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
                paragraphs.push(currentParagraph.trim());
                currentParagraph = '';
            }
        });
        
        // Create HTML paragraphs
        formattedText = paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    let contentHtml = isLoading 
        ? `<div class="dialog-loading"><p>Generating AI analysis...</p><div class="spinner"></div></div>` 
        : formattedText || `<p>${text}</p>`;
    
    overlay.innerHTML = `
        <div class="dialog-window">
            <div class="dialog-header">
                <h3>${featureTitle}</h3>
                <button class="dialog-close-btn" id="dialogCloseBtn">&times;</button>
            </div>
            <div class="dialog-content" id="dialogContent">
                ${contentHtml}
            </div>
            <div class="dialog-actions">
                <button class="dialog-btn dialog-btn-secondary" id="dialogCancelBtn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close dialog handlers
    const closeDialog = () => overlay.remove();
    
    document.getElementById("dialogCloseBtn").addEventListener("click", closeDialog);
    document.getElementById("dialogCancelBtn").addEventListener("click", closeDialog);
    
    // Close dialog when clicking on the overlay
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });
    
    // Close dialog with ESC key
    document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
            closeDialog();
            document.removeEventListener("keydown", escHandler);
        }
    });
    
    return {
        closeDialog,
        updateContent: (newContent) => {
            const contentDiv = document.getElementById("dialogContent");
            if (contentDiv) {
                // Format the text with proper paragraphs
                const sentences = newContent.split(/\.\s+/);
                let paragraphs = [];
                let currentParagraph = '';
                
                sentences.forEach((sentence, index) => {
                    if (!sentence.trim()) return;
                    
                    const needsPeriod = !sentence.endsWith('.') && index < sentences.length - 1;
                    currentParagraph += sentence + (needsPeriod ? '. ' : ' ');
                    
                    if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
                        paragraphs.push(currentParagraph.trim());
                        currentParagraph = '';
                    }
                });
                
                const formattedHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
                contentDiv.innerHTML = formattedHTML || `<p>${newContent}</p>`;
            }
        }
    };
}

// Helper function to get feature title from feature ID
function getFeatureTitle(feature) {
    switch (feature) {
        case 'dataAnalysis':
            return "Data Analysis & Forecasting";
        case 'budgeting':
            return "Budgeting Tool";
        case 'expenseManagement':
            return "Expense Management";
        case 'investment':
            return "Investment Strategies";
        case 'chatbot':
            return "AI Chatbot Assistant";
        default:
            return "Financial Tool";
    }
}

// Update the handleToolClick function to fetch AI analysis
// In script.js - Update the handleToolClick function

async function handleToolClick(feature) {
    // Special case for chatbot - show chatbot dialog instead of analysis
    if (feature === 'chatbot') {
        showChatbotDialog();
        return;
    }
    
    // Show loading dialog for other tools
    const dialog = showDialog(feature, "", true);
    
    try {
        // Call the API to get AI analysis
        const response = await fetch('/get_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feature }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update dialog with AI-generated content
            dialog.updateContent(data.result);
        } else {
            // Show error message
            dialog.updateContent("Error generating analysis. Please try again later.");
        }
    } catch (error) {
        console.error("Error fetching analysis:", error);
        dialog.updateContent("Error connecting to the server. Please try again later.");
    }
}

function showChatbotDialog() {
    // Remove existing dialogs before adding a new one
    document.querySelectorAll(".dialog-overlay").forEach(dialog => dialog.remove());
    
    // Create dialog elements
    const overlay = document.createElement("div");
    overlay.classList.add("dialog-overlay");
    
    // Create chatbot HTML structure
    overlay.innerHTML = `
        <div class="dialog-window chatbot-dialog">
            <div class="dialog-header">
                <h3>AI Chatbot Assistant</h3>
                <button class="dialog-close-btn" id="dialogCloseBtn">&times;</button>
            </div>
            <div class="dialog-content chatbot-content" id="dialogContent">
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-message bot">
                        <div class="message-content">
                            Hello! I'm your FinAI assistant. How can I help you with financial analysis today?
                        </div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type your message here..." />
                    <button id="sendMessageBtn">Send</button>
                </div>
                <div class="chat-suggestions">
                    <div class="suggestion-chip" data-question="What is the current financial performance?">Current financial performance</div>
                    <div class="suggestion-chip" data-question="How can I improve cash flow?">Improve cash flow</div>
                    <div class="suggestion-chip" data-question="What investment strategies do you recommend?">Investment strategies</div>
                    <div class="suggestion-chip" data-question="How to reduce expenses?">Reduce expenses</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Set up event listeners
    const closeDialog = () => overlay.remove();
    
    document.getElementById("dialogCloseBtn").addEventListener("click", closeDialog);
    
    // Close dialog when clicking on the overlay
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    });
    
    // Close dialog with ESC key
    document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
            closeDialog();
            document.removeEventListener("keydown", escHandler);
        }
    });
    
    // Set up chatbot interaction
    setupChatbotInteraction();
}

// Function to handle chatbot interaction
// Function to handle chatbot interaction
function setupChatbotInteraction() {
    const chatInput = document.getElementById("chatInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const chatMessages = document.getElementById("chatMessages");
    
    // Function to add a message to the chat
    function addMessage(message, isUser) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("chat-message", isUser ? "user" : "bot");
        
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = message; // Just show the message without "User:" or "Assistant:" prefixes
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement("div");
        typingDiv.classList.add("chat-message", "bot", "typing-indicator");
        typingDiv.innerHTML = `<div class="message-content"><span>•</span><span>•</span><span>•</span></div>`;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.querySelector(".typing-indicator");
        if (indicator) {
            chatMessages.removeChild(indicator);
        }
    }
    
    // Function to send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, true);
        
        // Clear input
        chatInput.value = "";
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Call the API
            const response = await fetch('/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Clean the response to remove any "Assistant:" prefix
            let cleanedResponse = data.response;
            if (cleanedResponse.startsWith("Assistant:")) {
                cleanedResponse = cleanedResponse.substring("Assistant:".length).trim();
            }
            
            // Add bot response
            addMessage(cleanedResponse, false);
        } catch (error) {
            console.error("Chat error:", error);
            removeTypingIndicator();
            addMessage("Sorry, I encountered an error. Please try again.", false);
        }
    }
    
    // Event listeners
    sendMessageBtn.addEventListener("click", sendMessage);
    
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
    
    // Set up suggestion chips
    document.querySelectorAll(".suggestion-chip").forEach(chip => {
        chip.addEventListener("click", function() {
            const question = this.getAttribute("data-question");
            chatInput.value = question;
            sendMessage();
        });
    });
}
// Function to generate sample text based on the feature clicked (fallback if API fails)
function getSampleText(feature) {
    switch (feature) {
        case 'dataAnalysis':
            return "With our Data Analysis & Forecasting tool, you can analyze historical trends and predict future financial performance with advanced machine learning algorithms.";
        case 'budgeting':
            return "Our Budgeting tool helps you plan and manage your company's budget efficiently. Create, modify, and track budgets in real-time with customizable categories.";
        case 'expenseManagement':
            return "Track and optimize your company's expenses with our Expense Management tool. Identify spending patterns and find opportunities to reduce costs.";
        case 'investment':
            return "Discover the best investment strategies for growth with our Investment tool. Analyze potential returns, risks, and portfolio diversification opportunities.";
        case 'chatbot':
            return "Get instant business insights with our AI-powered chatbot. Ask financial questions, request analyses, or get recommendations tailored to your business needs.";
        default:
            return "Please select a financial tool to continue.";
    }
}

async function fetchStockCSV() {
    try {
        const response = await fetch("/static/assets/stock_data.csv");
        const csvText = await response.text();
        const parsedData = Papa.parse(csvText, { header: true }).data;

        function parseDate(dateStr) {
            const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const parts = dateStr.split("-");
            if (parts.length !== 3) return null;

            const day = parseInt(parts[0], 10);
            const month = months[parts[1]];
            const year = parseInt(parts[2], 10) + 2000;

            return new Date(year, month, day);
        }

        const cleanedData = parsedData
            .filter(entry => entry.Date && entry.Close && entry.Volume)
            .map(entry => ({
                date: parseDate(entry.Date),
                close: parseFloat(entry.Close.replace(/,/g, "")) || 0,
                volume: parseInt(entry.Volume.replace(/,/g, ""), 10) || 0
            }))
            .filter(entry => entry.date);

        cleanedData.sort((a, b) => a.date - b.date);

        const sortedLabels = cleanedData.map(entry => entry.date);
        const sortedClosingPrices = cleanedData.map(entry => entry.close);
        const sortedVolumes = cleanedData.map(entry => entry.volume);

        const ctx = document.getElementById("metricsChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: sortedLabels,
                datasets: [
                    {
                        type: "line",
                        label: "Price (INR)",
                        data: sortedClosingPrices,
                        borderColor: "#00FF00", // Bright Green Line
                        borderWidth: 2, // You can increase borderWidth for a thicker line
                        pointRadius: 0,
                        fill: false, // Set to false to keep it a line without filling
                        yAxisID: "y",
                    },
                    
                    {
                        type: "bar",
                        label: "Volume",
                        data: sortedVolumes,
                        backgroundColor: "rgba(0, 123, 255, 0.1)",
                        borderColor: "rgba(25, 136, 255, 0.3)",
                        borderWidth: 1,
                        yAxisID: "y1",
                        barPercentage: 0.8,
                        categoryPercentage: 0.9
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            title: tooltipItems => new Date(tooltipItems[0].label).toDateString(),
                            label: tooltipItem => 
                                tooltipItem.datasetIndex === 0 
                                ? `Close: ₹ ${tooltipItem.raw.toFixed(2)}` 
                                : `Volume: ${tooltipItem.raw.toLocaleString()}`
                        }
                    },
                    legend: {
                        labels: {
                            color: "white" // Make legend text white
                        }
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        time: { unit: "day", tooltipFormat: "MMM d, yyyy", displayFormats: { day: "MMM d" } },
                        title: { display: true, text: "Date", color: "white" }, // Make title white
                        ticks: { color: "white", autoSkip: true, maxTicksLimit: 10 } // Make axis labels white
                    },
                    y: { 
                        title: { display: true, text: "Closing Price (INR)", color: "white" }, 
                        ticks: { color: "white" }, // Make axis labels white
                        beginAtZero: false 
                    },
                    y1: { 
                        position: "right", 
                        title: { display: true, text: "Volume", color: "white" }, 
                        ticks: { color: "white" }, // Make axis labels white
                        beginAtZero: true, 
                        grid: { drawOnChartArea: false } 
                    }
                }
            }                        
        });

    } catch (error) {
        console.error("Error fetching stock data:", error);
    }
}

async function fetchCompanyCSV() {
    try {
        const response = await fetch("/static/assets/Company.csv");
        const csvText = await response.text();
        const parsedData = Papa.parse(csvText, { header: true }).data[0]; // Single-company data

        const getValue = (key, isCurrency = false, isPercentage = false) => {
            let value = parsedData[key] || "N/A";
            
            value = value.toString().replace(/[^\d.]/g, ""); 
            
            if (!isNaN(value) && value !== "") {
                value = parseFloat(value);
                if (isPercentage) value = Math.min(value, 100);
            } else {
                value = "N/A";
            }
            
            return isCurrency && value !== "N/A" ? `${value.toLocaleString()}` : value;
        };

        document.getElementById("currentPrice").textContent = getValue("CurentPrice", true);
        document.getElementById("high").textContent = getValue("High", true);
        document.getElementById("low").textContent = getValue("Low", true);
        document.getElementById("marketCap").textContent = getValue("MCap", true);
        document.getElementById("stockPE").textContent = parsedData["StockPE"] || "N/A";
        document.getElementById("pat").textContent = getValue("PAT", true);
        document.getElementById("reserves").textContent = getValue("Reserves", true);
        document.getElementById("debtToEquity").textContent = getValue("DebttoEquity");
        document.getElementById("evebitda").textContent = getValue("EVEBITDA");

        function createDoughnutChart(canvasId, value, label) {
            const ctx = document.getElementById(canvasId).getContext("2d");
        
            new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: [label, "Remaining"],
                    datasets: [{
                        data: [value, 100 - value],
                        backgroundColor: ["#007bff", "#e9ecef"],
                        borderColor: ["#ffffff", "#ffffff"],
                        borderWidth: 2,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%", // Larger cutout for a cleaner look
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (tooltipItem) => `${tooltipItem.raw.toFixed(2)}%`
                            }
                        }
                    }
                },
                plugins: [{
                    id: "centerText",
                    beforeDraw(chart) {
                        const { width } = chart;
                        const { ctx } = chart;
                        const { datasets } = chart.data;
        
                        ctx.save();
        
                        const centerX = width / 2;
                        const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        
                        const mainValue = datasets[0].data[0] || 0;
        
                        ctx.font = "bold 16px Arial";
                        ctx.fillStyle = "white"; // Set the text color to white
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
        
                        ctx.fillText(`${mainValue.toFixed(1)}%`, centerX, centerY);
        
                        ctx.restore();
                    }
                }]
            });
        }        

        createDoughnutChart("salesVarChart", 34.98, "Sales Var");
        createDoughnutChart("return5yrsChart", 43.99, "5Y Return");
        createDoughnutChart("cagrChart", 44, "CAGR");
        createDoughnutChart("roeChart", 15, "ROE");
        createDoughnutChart("profitVarChart", 36, "Profit Var");

    } catch (error) {
        console.error("Error loading company data:", error);
    }
}

window.onload = function() {
    fetchStockCSV();
    fetchCompanyCSV();
};