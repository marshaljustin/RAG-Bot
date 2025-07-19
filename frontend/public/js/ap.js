// DOM Elements
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const messageBox = document.getElementById("message-box");
const propertyGrid = document.getElementById("property-grid");
const initialState = document.querySelector('.initial-state');

// Initialize
toggleButtonState();
checkLoginStatus();

// Event Listeners
document.getElementById("search-form").addEventListener("submit", handleSearch);
userInput.addEventListener("input", toggleButtonState);
userInput.addEventListener("keydown", handleEnterKey);
document.getElementById('logout-button').addEventListener('click', handleLogout);

// Core Functions
function toggleButtonState() {
    sendButton.disabled = userInput.value.trim() === "";
}

async function handleSearch(e) {
    e.preventDefault();
    const query = userInput.value.trim();
    if (!query) return;

    try {
        sendButton.disabled = true;
        showLoader();
        displayUserMessage(query);

   
        await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'user', content: query }),
            credentials: 'include'
        });


        const response = await fetch(`http://localhost:8000/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to get response');
        
        const data = await response.json();
        displayBotResponse(data);
        updatePropertyGrid(data.results || []);

        // Save bot response
        if (data.llm_response) {
            await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    role: 'assistant', 
                    content: data.llm_response 
                }),
                credentials: 'include'
            });
        }
    } catch (error) {
        displayError(error.message);
    } finally {
        resetSearchState();
    }
}


function displayUserMessage(query) {
    const userMessage = document.createElement("div");
    userMessage.className = "message user-message";
    userMessage.textContent = query;
    messageBox.appendChild(userMessage);
    initialState.style.display = 'none';
    messageBox.scrollTop = messageBox.scrollHeight;
}

async function displayBotResponse(data) {
    const botResponse = data.llm_response || "No results found.";
    const botMessage = createBotMessage(botResponse);
    messageBox.appendChild(botMessage);
    await simulateTypingEffect(botMessage.querySelector(".bot-text"));
}



// Utility Functions
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendButton.click();
    }
}

async function simulateTypingEffect(element) {
    return new Promise(resolve => {
        const text = element.textContent;
        element.textContent = '';
        let index = 0;

        function typeCharacter() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeCharacter, 30);
            } else {
                resolve();
            }
        }
        typeCharacter();
    });
}

// Auth Functions
async function checkLoginStatus() {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) window.location.href = '/login.html';
        
        const { email } = await response.json();
        document.getElementById('userEmail').textContent = email;
    } catch (err) {
        window.location.href = '/login.html';
    }
}

async function handleLogout() {
    showLoader1();
    try {               
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login.html';
    } catch (err) {
        console.error('Logout failed:', err);
    } finally {
        hideLoader1();
    }
}


function showLoader() {
    document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
    document.getElementById("loader").style.display = "none";
}

function showLoader1() {
    document.getElementById("loaderr").style.display = "flex";
    document.body.classList.add('modal-open');
}

function hideLoader1() {
    document.getElementById("loaderr").style.display = "none";
    document.body.classList.remove('modal-open');
}

function resetSearchState() {
    hideLoader();
    userInput.value = "";
    toggleButtonState();
    messageBox.scrollTop = messageBox.scrollHeight;
}

function displayError(message) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "message bot-message";
    errorMessage.innerHTML = `
        <div class="bot-response-container">
            <div class="bot-text">Error: ${message}</div>
        </div>
    `;
    messageBox.appendChild(errorMessage);
}

function createBotMessage(text) {
    const div = document.createElement("div");
    div.className = "message bot-message";
    div.innerHTML = `
        <div class="bot-response-container">
            <div class="bot-text">${text}</div>
        </div>
    `;
    return div;
}

document.addEventListener('DOMContentLoaded', () => {
 
    const historyInspect = document.querySelector('.history-inspect');
    const searchInput = document.querySelector('.search-input');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const historySidebar = document.querySelector('.history-sidebar');
    const historyLoading = document.getElementById('historyLoading');
    const emptyHistory = document.getElementById('emptyHistory');
    
    let allChats = [];

  
    async function fetchChatHistory() {
        try {
            showHistoryLoader();
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/history', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            allChats = await response.json();
            
            if (allChats.length === 0) {
                showEmptyHistoryState();
            } else {
                displayChatSessions(allChats);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            showHistoryError('Failed to load chat history');
        } finally {
            hideHistoryLoader();
        }
    }

  
    function displayChatSessions(chats) {
        historySidebar.innerHTML = '';
        
     
        const chatsByDate = chats.reduce((acc, chat) => {
            const date = new Date(chat.createdAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(chat);
            return acc;
        }, {});
        
       
        Object.entries(chatsByDate).forEach(([date, dateChats]) => {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = date;
            historySidebar.appendChild(dateHeader);
            
            dateChats.forEach(chat => {
                const chatElement = createChatSessionElement(chat);
                historySidebar.appendChild(chatElement);
            });
        });
    }

  
    function createChatSessionElement(chat) {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-session';
        chatElement.dataset.sessionId = chat._id;
        
        const time = new Date(chat.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const lastMessage = chat.messages[chat.messages.length - 1]?.content || 'No messages';
        const previewText = lastMessage.substring(0, 50) + (lastMessage.length > 50 ? '...' : '');
        
        chatElement.innerHTML = `
            <div class="chat-preview">
                <div class="chat-time">${time}</div>
                <div class="chat-snippet">${previewText}</div>
                <button class="delete-chat" aria-label="Delete chat">×</button>
            </div>
        `;
        
        chatElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-chat')) {
                displayFullChat(chat);
            }
        });
        
     
        chatElement.querySelector('.delete-chat').addEventListener('click', async (e) => {
            e.stopPropagation();
            await deleteChatSession(chat._id);
        });
        
        return chatElement;
    }

 
    function displayFullChat(chat) {
        historyInspect.innerHTML = `
            <div class="inspect-header">
                <h4>Chat from ${new Date(chat.createdAt).toLocaleString()}</h4>
                <button class="delete-session" data-id="${chat._id}">Delete Session</button>
            </div>
            <div class="chat-messages"></div>
        `;
        
        const messagesContainer = historyInspect.querySelector('.chat-messages');
        
        chat.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `history-message ${message.role}-message`;
            messageDiv.innerHTML = `
                <div class="message-content">${message.content}</div>
                <small class="message-time">
                    ${new Date(message.timestamp).toLocaleTimeString()}
                </small>
            `;
            messagesContainer.appendChild(messageDiv);
        });
        
        
        historyInspect.querySelector('.delete-session').addEventListener('click', async () => {
            await deleteChatSession(chat._id);
        });
        
   
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }


    async function deleteChatSession(sessionId) {
        try {
            showHistoryLoader();
            const response = await fetch(`/api/chat/${sessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete session');
            }
            
          
            await fetchChatHistory();
            historyInspect.innerHTML = '<div class="empty-inspect">Select a conversation to view</div>';
        } catch (err) {
            console.error('Delete failed:', err);
            showHistoryError('Failed to delete chat session');
        } finally {
            hideHistoryLoader();
        }
    }

   
    function handleSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            displayChatSessions(allChats);
            return;
        }
        
        const filtered = allChats.filter(chat => 
            chat.messages.some(message => 
                message.content.toLowerCase().includes(query)
            )
        );
        
        if (filtered.length === 0) {
            showEmptyHistoryState('No matches found');
        } else {
            displayChatSessions(filtered);
        }
    }

  
    function showHistoryLoader() {
        historyLoading.style.display = 'block';
        emptyHistory.style.display = 'none';
    }
    
    function hideHistoryLoader() {
        historyLoading.style.display = 'none';
    }
    
    function showEmptyHistoryState(message = 'No chat history found') {
        emptyHistory.textContent = message;
        emptyHistory.style.display = 'block';
        historySidebar.innerHTML = '';
    }
    
    function showHistoryError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'history-error';
        errorEl.textContent = message;
        historySidebar.prepend(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    }

  
    searchInput.addEventListener('input', handleSearch);
    newChatBtn.addEventListener('click', () => {
        
        window.location.href = '/index.html';
    });


    fetchChatHistory();
});