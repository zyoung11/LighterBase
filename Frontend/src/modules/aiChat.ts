import { slideBarContent, workspaceContent, sidebarContent } from "../utils/contents";
import conponents from "../utils/conponents";
import OpenAI from "openai";
// import type { ChatCompletionChunk } from "openai/resources";
import { marked } from 'marked';
import hljs from 'highlight.js';
// import type { shrink } from "bun";
// import { Assistants } from "openai/resources/beta.mjs";

type AIModel = {
    id: string;
    name: string;
    model: string;
    base_url?: string;
};

const AI_MODELS: AIModel[] = [
    { id: 'glm', name: 'GLM-4.5-flash (Zhipu)', base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.5-flash' },
];

const FIXED_MODEL_ID = 'glm';
const FIXED_API_KEY = '2bf25473aade4fbea7f98e7e8efe8693.T6awvus0jy6ERNy6'; // Replace with your actual API key

const CHAT_HISTORY_KEY = 'aiChatHistory';

function loadChatHistory() {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) {
        try {
            chatHistory = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse chat history:', e);
            chatHistory = [];
        }
    }
}

function saveChatHistory() {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
}

function clearChatHistory() {
    chatHistory = [];
    localStorage.removeItem(CHAT_HISTORY_KEY);
}

function renderChatHistory(chatMessages: HTMLElement) {
    chatMessages.innerHTML = '';
    if (chatHistory.length === 0) {
        chatMessages.innerHTML = `<div class="text-center text-gray-500 text-sm py-2">您正在与 GLM (Zhipu) 对话</div>`;
        return;
    }
    for (const msg of chatHistory) {
        if (msg.role === 'user') {
            const userMsgHtml = `
                <div class="flex justify-end">
                    <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs md:max-w-md break-words">${msg.content}</div>
                </div>
            `;
            chatMessages.innerHTML += userMsgHtml;
        } else if (msg.role === 'assistant') {
            const renderedContent = marked.parse(msg.content);
            const aiMsgHtml = `
                <div class="flex justify-start">
                    <div class="bg-[#3a3f41] text-gray-200 p-3 rounded-lg max-w-xs md:max-w-md break-words">${renderedContent}</div>
                </div>
            `;
            chatMessages.innerHTML += aiMsgHtml;
        }
    }
    // Bind copy buttons after rendering
    setTimeout(() => aichat.bindCopyButtons(), 0);
}

let chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

let currentStreamController: AbortController | null = null;

function updateAISettingsDisplay() {
    const selectedNameSpan = document.getElementById('selected-ai-name');
    if (!selectedNameSpan) return;

    const model = AI_MODELS.find(m => m.id === FIXED_MODEL_ID);
    if (model) {
        selectedNameSpan.textContent = `${model.name} (已启用)`;
    }
}

function setupChatDisplay() {
    const currentModelDisplay = document.getElementById('current-ai-model');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
    const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
    const switchButton = document.getElementById('chat-model-switch-btn');

    if (!currentModelDisplay || !chatMessages || !sendButton || !chatInput || !switchButton) return;

    // Load chat history from localStorage
    loadChatHistory();

    const selectedModel = AI_MODELS.find(m => m.id === FIXED_MODEL_ID);

    const goToSettings = () => {
         (document.getElementById("settings-btn") as HTMLElement)?.click();

         const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;
         const mainWorkspace = document.getElementById("main-workspace") as HTMLElement;

         rightSidebar.innerHTML = sidebarContent.settings;
         mainWorkspace.innerHTML = workspaceContent.aiSettings;

         aichat.setupAISettings();

         conponents.hideRightSlidebar();
    }

    switchButton.onclick = goToSettings;

    if (selectedModel && FIXED_API_KEY) {
        currentModelDisplay.textContent = selectedModel.name;
        // Load and render chat history
        loadChatHistory();
        renderChatHistory(chatMessages);
        // Add new chat button
        const chatContainer = chatMessages.parentElement;
        if (chatContainer) {
            const newChatBtn = document.createElement('button');
            newChatBtn.id = 'new-chat-btn';
            newChatBtn.className = 'absolute top-2 right-2 bg-blue-200 text-blue-800 px-3 py-1 rounded hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed';
            newChatBtn.textContent = '新对话';
            newChatBtn.onclick = () => {
                clearChatHistory();
                renderChatHistory(chatMessages);
            };
            chatContainer.style.position = 'relative';
            chatContainer.appendChild(newChatBtn);
        }
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.placeholder = "输入你的问题...";
    } else {
        currentModelDisplay.textContent = '模型未配置';

        chatMessages.innerHTML = `
            <div class="text-center text-red-400 text-sm py-2">
                模型配置错误。
            </div>
        `;

        sendButton.disabled = true;
        chatInput.disabled = true;
        chatInput.placeholder = "模型未配置";
    }
}

const renderer = new marked.Renderer();
renderer.code = (code:any) => {
    // console.log("显示原始数据：",code)
    let codeString = code.raw;
    const lines = codeString.split('\n')
    const hasList = lines.some((line: string) => /^\d+\./.test(line.trim()));
    if(lines.length >2 && !hasList){
        codeString = lines.slice(1,-1).join('\n');
    }else if(lines.length <=2){
        codeString = code.raw;
    }
    
    const lang = code.lang && hljs.getLanguage(code.lang) ? code.lang : 'plaintext';
    const highlightedCode = hljs.highlight(codeString, { language: lang }).value;
    const resultHTML =  `
        <div class="code-block-container relative group">
            <div class="code-header flex justify-between items-center text-xs text-gray-400 bg-[#282c34] px-4 pt-2 rounded-t-lg">
                <span class="language-name">${code.lang || 'Code'}</span>
                <button 
                    class="copy-code-btn flex items-center p-1 rounded hover:bg-[#3a3f41] transition-colors"
                    data-code="${encodeURIComponent(codeString)}"
                    title="复制"
                >
                    <svg class="w-4 h-4 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5h8m-8 0h4m-4 4h8m-4 4h4m-4 4h8"></path></svg>
                    <span class="text-xs ml-1 copy-text">复制</span>
                </button>
            </div>
            <pre class = "bg-[#15151D] whitespace-pre overflow-x-auto"><code class="language-${lang} over">${highlightedCode}</code></pre>
        </div>
    `;
return resultHTML
};

marked.setOptions({
    gfm: true,
    breaks: true,
    renderer: renderer,
});

const aichat = {

    bindCopyButtons() {
        const copyButtons = document.querySelectorAll('.copy-code-btn');
        copyButtons.forEach(button => {

            if (button.getAttribute('data-listener-added') === 'true') {
                return;
            }
            button.setAttribute('data-listener-added', 'true');

            button.addEventListener('click', () => {
                const codeElement = button.closest('.code-block-container')?.querySelector('code');
                const codeToCopy = codeElement ? codeElement.textContent : '';

                // const encodedCode = button.getAttribute('data-code');
                // const codeToCopy = encodedCode ? decodeURIComponent(encodedCode) : '';

                if (codeToCopy) {
                    const originalText = button.querySelector('.copy-text')!.textContent;

                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(codeToCopy).then(() => {
                            button.querySelector('.copy-text')!.textContent = '已复制!';
                            setTimeout(() => {
                                button.querySelector('.copy-text')!.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('复制失败: ', err);
                        });
                    } else {
                        // 备用方法 for HTTP
                        const textArea = document.createElement('textarea');
                        textArea.value = codeToCopy;
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            button.querySelector('.copy-text')!.textContent = '已复制!';
                            setTimeout(() => {
                                button.querySelector('.copy-text')!.textContent = originalText;
                            }, 2000);
                        } catch (err) {
                            console.error('复制失败: ', err);
                        }
                        document.body.removeChild(textArea);
                    }
                }
            });
        });
    },
    setupAISettings() {
        // Since the UI is now static and doesn't need dynamic updates,
        // this function mainly ensures the page is properly initialized
        updateAISettingsDisplay();
    },

    _updateSendButtonState(isSending: boolean) {
        const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
        const sendIcon = document.getElementById('ai-send-icon');
        const stopIcon = document.getElementById('ai-stop-icon');
        const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
        const newChatBtn = document.getElementById('new-chat-btn') as HTMLButtonElement;

        if (!sendButton || !sendIcon || !stopIcon || !chatInput) return;

        if (isSending) {
            sendButton.disabled = false;
            sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            sendButton.classList.add('bg-red-600', 'hover:bg-red-700');
            sendIcon.classList.add('hidden');
            stopIcon.classList.remove('hidden');
            chatInput.disabled = true;
            if (newChatBtn) newChatBtn.disabled = true;
        } else {
            currentStreamController = null;
            sendButton.disabled = false;
            sendButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            sendButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
            sendIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');
            chatInput.disabled = false;
            if (newChatBtn) newChatBtn.disabled = false;
        }
    },

async handleChatSubmit() {
        if (currentStreamController) {
            console.log('用户请求停止生成...');
            currentStreamController.abort();
            return;
        }
        
        const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        const modelConfig = AI_MODELS.find(m => m.id === FIXED_MODEL_ID);
        const apiKey = FIXED_API_KEY;

        if (!modelConfig || !apiKey) {
             alert('模型配置错误。');
             return;
        }

        chatInput.value = '';
        
        this._updateSendButtonState(true);

        chatHistory.push({role:'user',content:userMessage});

        const userMsgHtml = `
            <div class="flex justify-end">
                <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs md:max-w-md break-words">${userMessage}</div>
            </div>
        `;
        chatMessages.innerHTML += userMsgHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let aiMsgElement = document.createElement('div');
        aiMsgElement.className = 'flex justify-start';
        let aiContentContainer = document.createElement('div');
        aiContentContainer.className = 'bg-[#3a3f41] text-gray-200 p-3 rounded-lg max-w-xs md:max-w-md break-words';
        aiContentContainer.innerHTML = '<span id="ai-typing-temp">AI 正在思考...</span>';
        
        aiMsgElement.appendChild(aiContentContainer);
        chatMessages.appendChild(aiMsgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        currentStreamController = new AbortController();

        try {
            const openai = new OpenAI({
                apiKey: apiKey,
                baseURL: modelConfig.base_url,
                dangerouslyAllowBrowser: true
            });

            const stream = await openai.chat.completions.create({
                model: modelConfig.model,
                messages: chatHistory,
                stream: true,
            }, {
                signal: currentStreamController.signal 
            });

            let aiResponseText = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';

                if (content) {
                    aiResponseText +=content;
                    // aiTypingTempSpan.textContent =await marked(aiResponseText);
                    // aiContentContainer.innerHTML = aiTypingTempSpan.textContent;
                     const renderedHtml = await marked(aiResponseText);
                     aiContentContainer.innerHTML = renderedHtml;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
            
            // const finalResponse = aiResponseText || '未能获取到响应文本。';
            // const renderedHtml = await marked(finalResponse); 
            // aiContentContainer.innerHTML = renderedHtml;

            if(aiResponseText){
                chatHistory.push({role:'assistant',content:aiResponseText})
            }

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('AI 响应被用户终止。');
                aiContentContainer.innerHTML += '<em class="text-xs text-gray-400"><br>[已终止]</em>';
            } else {
                console.error('AI 聊天请求失败:', error);
                aiContentContainer.textContent = `[错误] AI 响应失败: ${error instanceof Error ? error.message : '未知错误'}`;
                aiContentContainer.classList.remove('bg-[#3a3f41]');
                aiContentContainer.classList.add('bg-red-800');
            }
        } finally {
            this._updateSendButtonState(false);
            chatInput.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight;

            this.bindCopyButtons();
            // Save chat history after AI response
            saveChatHistory();
        }
    },
    
    setupChatDisplay: setupChatDisplay,
    AI_MODELS: AI_MODELS,
};
export default aichat;
