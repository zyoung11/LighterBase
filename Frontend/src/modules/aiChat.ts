import { slideBarContent, workspaceContent, sidebarContent } from "../utils/contents";
import conponents from "../utils/conponents";
import OpenAI from "openai";
import type { ChatCompletionChunk } from "openai/resources";
import { marked } from 'marked';
import hljs from 'highlight.js';
import type { shrink } from "bun";
import { Assistants } from "openai/resources/beta.mjs";
declare const marked: any;
declare const hljs: any;

type AIModel = {
    id: string;
    name: string;
    model: string;
    base_url?: string;
};

const AI_MODELS: AIModel[] = [
    { id: 'deepseek', name: 'DeepSeek', base_url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    { id: 'kimi', name: 'Kimi', base_url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    { id: 'qwen', name: '千问 (Qwen)', base_url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/chat', model: 'qwen-turbo' },
    { id: 'glm', name: 'GLM (Zhipu)', base_url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
];

let chatHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

let currentStreamController: AbortController | null = null;

const AI_KEY_STORAGE_PREFIX = 'ai_api_key_';
const SELECTED_MODEL_STORAGE_KEY = 'selected_ai_model_id';

function getStoredApiKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    for (const model of AI_MODELS) {
        const apiKey = localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${model.id}`);
        if (apiKey) {
            keys[model.id] = apiKey;
        }
    }
    return keys;
}

function saveApiKey(modelId: string, apiKey: string) {
    localStorage.setItem(`${AI_KEY_STORAGE_PREFIX}${modelId}`, apiKey);
}

function getSelectedModelId(): string | null {
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY);
}

function setSelectedModelId(modelId: string | null) {
    if (modelId) {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId);
    } else {
        localStorage.removeItem(SELECTED_MODEL_STORAGE_KEY);
    }
}

function updateAISettingsDisplay(selectedModelId: string | null) {
    const dropdownMenu = document.getElementById('ai-dropdown-menu');
    const selectedNameSpan = document.getElementById('selected-ai-name');
    if (!dropdownMenu || !selectedNameSpan) return;

    const storedKeys = getStoredApiKeys();
    
    const existingModelButtons = dropdownMenu.querySelectorAll('.ai-model-select-btn');
    existingModelButtons.forEach(btn => btn.remove());

    let selectedModel: AIModel | null = null;
    let buttonHTML = '';

    for (const model of AI_MODELS) {
        const isKeySet = !!storedKeys[model.id];
        const isSelected = model.id === selectedModelId;

        if (isSelected) {
            selectedModel = model;
        }

        const statusClass = isKeySet ? 'text-green-400' : 'text-red-400';
        const statusText = isKeySet ? ' (已设置 Key)' : ' (未设置 Key)';
        
        buttonHTML += `
            <button data-model-id="${model.id}" class="ai-model-select-btn w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#3a3f41] flex justify-between items-center transition-colors">
                <span>${model.name}</span>
                <span class="${statusClass} text-xs">${statusText}</span>
            </button>
        `;
    }
    
    const addAiBtn = document.getElementById('add-ai-btn');
    if(addAiBtn) {
        addAiBtn.insertAdjacentHTML('beforebegin', buttonHTML);
    }

    if (selectedModel) {
        selectedNameSpan.textContent = `${selectedModel.name} ${storedKeys[selectedModel.id] ? '(已启用)' : '(未设置 Key)'}`;
    } else {
        selectedNameSpan.textContent = '点击选择 AI 模型';
    }
}

function setupChatDisplay(selectedModelId: string | null) {
    const currentModelDisplay = document.getElementById('current-ai-model');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
    const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
    const switchButton = document.getElementById('chat-model-switch-btn');

    if (!currentModelDisplay || !chatMessages || !sendButton || !chatInput || !switchButton) return; 

    const selectedModel = AI_MODELS.find(m => m.id === selectedModelId);
    const apiKey = selectedModelId ? localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${selectedModelId}`) : null;

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

    if (selectedModel && apiKey) {
        currentModelDisplay.textContent = selectedModel.name;
        chatHistory = [];
        chatMessages.innerHTML = `<div class="text-center text-gray-500 text-sm py-2">您正在与 ${selectedModel.name} 对话</div>`;
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.placeholder = "输入你的问题...";
    } else {
        currentModelDisplay.textContent = '未选择或 Key 未设置';
        
        chatMessages.innerHTML = `
            <div class="text-center text-red-400 text-sm py-2">
                请先在 <a href="javascript:void(0)" id="go-to-ai-settings-link" class="underline hover:text-red-300">AI 设置界面</a> 选择模型并设置 API Key。
            </div>
        `;
        
        sendButton.disabled = true;
        chatInput.disabled = true;
        chatInput.placeholder = "请先选择并配置 AI 模型";

        document.getElementById('go-to-ai-settings-link')?.addEventListener('click', goToSettings);
    }
}

const renderer = new marked.Renderer();
renderer.code = (code:any) => {
    // console.log("显示原始数据：",code)
    let codeString = code.raw;
    const lines = codeString.split('\n')
    if(lines.length >2){
        codeString = lines.slice(1,-1).join('\n');
    }else{
        codeString = "";
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
    sanitize: true,
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
                    navigator.clipboard.writeText(codeToCopy).then(() => {
                        const originalText = button.querySelector('.copy-text')!.textContent;
                        button.querySelector('.copy-text')!.textContent = '已复制!';
                        
                        setTimeout(() => {
                            button.querySelector('.copy-text')!.textContent = originalText;
                        }, 2000);
                    }).catch(err => {
                        console.error('复制失败: ', err);
                    });
                }
            });
        });
    },
    setupAISettings() {
        const dropdownButton = document.getElementById('ai-dropdown-button');
        const dropdownMenu = document.getElementById('ai-dropdown-menu');
        const addAiSection = document.getElementById('add-ai-key-section');
        const addAiBtn = document.getElementById('add-api-key-btn') as HTMLButtonElement;
        const newApiKeyInput = document.getElementById('new-api-key-input') as HTMLInputElement;
        const aiKeyMessage = document.getElementById('ai-key-message') as HTMLElement;
        const newAiNameInput = document.getElementById('new-ai-name-input') as HTMLInputElement;

        let selectedModelForConfig: { id: string, name: string } | null = null;
        const currentSelectedModelId = getSelectedModelId();
        
        updateAISettingsDisplay(currentSelectedModelId);
        
        dropdownButton?.addEventListener('click', () => {
            dropdownMenu?.classList.toggle('hidden');
        });

        dropdownMenu?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const modelButton = target.closest('.ai-model-select-btn');

            if (modelButton) {
                const modelId = modelButton.getAttribute('data-model-id')!;
                const model = AI_MODELS.find(m => m.id === modelId);
                if (!model) return;

                setSelectedModelId(modelId);
                
                updateAISettingsDisplay(modelId);
                dropdownMenu?.classList.add('hidden');

                selectedModelForConfig = model;
                const storedKey = localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${modelId}`) || '';

                (document.getElementById('ai-input-title') as HTMLElement).textContent = `配置 ${model.name} 的 API Key`;
                newAiNameInput.value = model.name;
                newAiNameInput.disabled = true;
                newApiKeyInput.value = storedKey;
                newApiKeyInput.type = 'password';
                addAiBtn.textContent = storedKey ? '更新 Key' : '添加 Key';
                addAiBtn.style.display = 'block';
                aiKeyMessage.classList.add('hidden');
                addAiSection?.classList.remove('hidden');

            } else if (target.closest('#add-ai-btn')) {
                 aiKeyMessage.textContent = '请在上方列表中选择一个 AI 模型进行配置。';
                 aiKeyMessage.classList.remove('hidden');
            }
        });

        addAiBtn.addEventListener('click', () => {
            if (!selectedModelForConfig) {
                aiKeyMessage.textContent = '请先在下拉菜单中选择一个 AI 模型。';
                aiKeyMessage.classList.remove('hidden');
                return;
            }

            const apiKey = newApiKeyInput.value.trim();
            if (!apiKey) {
                aiKeyMessage.textContent = 'API Key 不能为空。';
                aiKeyMessage.classList.remove('hidden');
                return;
            }

            saveApiKey(selectedModelForConfig.id, apiKey);
            
            updateAISettingsDisplay(selectedModelForConfig.id);
            addAiSection?.classList.add('hidden');
            aiKeyMessage.classList.remove('text-red-400');
            aiKeyMessage.classList.add('text-green-400');
            aiKeyMessage.textContent = `${selectedModelForConfig.name} 的 Key 已成功保存!`;
            aiKeyMessage.classList.remove('hidden');

            setTimeout(() => {
                aiKeyMessage.classList.add('hidden');
            }, 2000);
        });
    },

    _updateSendButtonState(isSending: boolean) {
        const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
        const sendIcon = document.getElementById('ai-send-icon');
        const stopIcon = document.getElementById('ai-stop-icon');
        const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;

        if (!sendButton || !sendIcon || !stopIcon || !chatInput) return;

        if (isSending) {
            sendButton.disabled = false; 
            sendButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            sendButton.classList.add('bg-red-600', 'hover:bg-red-700'); 
            sendIcon.classList.add('hidden');
            stopIcon.classList.remove('hidden');
            chatInput.disabled = true;
        } else {
            currentStreamController = null; 
            sendButton.disabled = false;
            sendButton.classList.remove('bg-red-600', 'hover:bg-red-700');
            sendButton.classList.add('bg-blue-600', 'hover:bg-blue-700'); 
            sendIcon.classList.remove('hidden');
            stopIcon.classList.add('hidden');
            chatInput.disabled = false;
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

        const selectedModelId = getSelectedModelId();
        const apiKey = selectedModelId ? localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${selectedModelId}`) : null;
        const modelConfig = AI_MODELS.find(m => m.id === selectedModelId);

        if (!modelConfig || !apiKey) {
             alert('请先在 AI 设置中选择模型并设置 API Key。');
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
                    const renderedHtml = marked(aiResponseText);
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
        }
    },
    
    setupChatDisplay: setupChatDisplay,
    AI_MODELS: AI_MODELS,
};
export default aichat;