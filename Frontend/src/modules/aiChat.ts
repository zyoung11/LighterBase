import { slideBarContent, workspaceContent, sidebarContent } from "../utils/contents";
import conponents from "../utils/conponents";

// 定义支持的 AI 模型
const AI_MODELS = [
    { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    { id: 'kimi', name: 'Kimi', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' },
    { id: 'qwen', name: '千问 (Qwen)', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/chat/completion', model: 'qwen-turbo' }, // 阿里云通义千问
    { id: 'glm', name: 'GLM (Zhipu)', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4' }, // 智谱AI
];

const AI_KEY_STORAGE_PREFIX = 'ai_api_key_';
const SELECTED_MODEL_STORAGE_KEY = 'selected_ai_model_id';

/**
 * 从 localStorage 获取所有已存储的 AI API Keys。
 * @returns {Record<string, string>} 键是模型ID，值是API Key。
 */
function getStoredApiKeys(): Record<string, string> {
    const keys: Record<string, string> = {};
    AI_MODELS.forEach(model => {
        const key = localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${model.id}`);
        if (key) {
            keys[model.id] = key;
        }
    });
    return keys;
}

/**
 * 保存 API Key 到 localStorage。
 * @param modelId 模型ID
 * @param apiKey API Key
 */
function saveApiKey(modelId: string, apiKey: string) {
    localStorage.setItem(`${AI_KEY_STORAGE_PREFIX}${modelId}`, apiKey);
}

/**
 * 获取当前选中的模型ID。
 */
function getSelectedModelId(): string | null {
    return localStorage.getItem(SELECTED_MODEL_STORAGE_KEY);
}

/**
 * 设置当前选中的模型ID。
 * @param modelId 模型ID
 */
function setSelectedModelId(modelId: string | null) {
    if (modelId) {
        localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, modelId);
    } else {
        localStorage.removeItem(SELECTED_MODEL_STORAGE_KEY);
    }
}

/**
 * 更新 AI 设置界面的下拉菜单和显示文本。
 */
function updateAISettingsDisplay(selectedModelId: string | null) {
    const dropdownMenu = document.getElementById('ai-dropdown-menu');
    const selectedNameSpan = document.getElementById('selected-ai-name');
    if (!dropdownMenu || !selectedNameSpan) return;

    const storedKeys = getStoredApiKeys();
    
    // 清除现有模型按钮，保留“添加新的 AI”
    const existingModelButtons = dropdownMenu.querySelectorAll('.ai-model-select-btn');
    existingModelButtons.forEach(btn => btn.remove());

    let selectedModel = null;
    let buttonHTML = '';

    AI_MODELS.forEach(model => {
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
    });
    
    // 在 '添加新的 AI' 按钮前插入模型列表
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


/**
 * 设置 AI 聊天界面的显示，并在聊天侧边栏打开时运行。
 * @param selectedModelId 当前选中的模型ID
 */
function setupChatDisplay(selectedModelId: string | null) {
    const currentModelDisplay = document.getElementById('current-ai-model');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
    const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
    const switchButton = document.getElementById('chat-model-switch-btn'); // 获取切换按钮

    // 检查所有元素是否存在，如果侧边栏内容未加载，则退出
    if (!currentModelDisplay || !chatMessages || !sendButton || !chatInput || !switchButton) return; 

    const selectedModel = AI_MODELS.find(m => m.id === selectedModelId);
    // 从 localStorage 获取 API Key
    const apiKey = selectedModelId ? localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${selectedModelId}`) : null;

    // 定义跳转到 AI 设置的逻辑
    const goToSettings = () => {
         // 模拟点击设置按钮
         (document.getElementById("settings-btn") as HTMLElement)?.click();
         
         // 更新右侧侧边栏和主工作区的 HTML 内容
         const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;
         const mainWorkspace = document.getElementById("main-workspace") as HTMLElement;
         
         rightSidebar.innerHTML = sidebarContent.settings;
         mainWorkspace.innerHTML = workspaceContent.aiSettings;
         
         // 激活 AI 设置逻辑
         aichat.setupAISettings();
         
         // 关闭聊天侧边栏 (假设 conponents.hideRightSlidebar 存在并已导入)
         conponents.hideRightSlidebar(); 
    }
    
    // 绑定切换按钮的监听器：点击后跳转到设置界面
    switchButton.onclick = goToSettings;


    if (selectedModel && apiKey) {
        // 配置完整且有效
        currentModelDisplay.textContent = selectedModel.name;
        chatMessages.innerHTML = `<div class="text-center text-gray-500 text-sm py-2">您正在与 ${selectedModel.name} 对话</div>`;
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.placeholder = "输入你的问题...";
    } else {
        // 配置缺失或无效
        currentModelDisplay.textContent = '未选择或 Key 未设置';
        
        chatMessages.innerHTML = `
            <div class="text-center text-red-400 text-sm py-2">
                请先在 <a href="javascript:void(0)" id="go-to-ai-settings-link" class="underline hover:text-red-300">AI 设置界面</a> 选择模型并设置 API Key。
            </div>
        `;
        
        sendButton.disabled = true;
        chatInput.disabled = true;
        chatInput.placeholder = "请先选择并配置 AI 模型";

        // 绑定错误提示链接的监听器
        document.getElementById('go-to-ai-settings-link')?.addEventListener('click', goToSettings);
    }
}

const aichat = {
    /**
     * 设置 AI 设置界面的事件监听。
     */
    setupAISettings() {
        const dropdownButton = document.getElementById('ai-dropdown-button');
        const dropdownMenu = document.getElementById('ai-dropdown-menu');
        const addAiSection = document.getElementById('add-ai-key-section');
        const addAiBtn = document.getElementById('add-api-key-btn') as HTMLButtonElement;
        const newApiKeyInput = document.getElementById('new-api-key-input') as HTMLInputElement;
        const aiKeyMessage = document.getElementById('ai-key-message') as HTMLElement;
        const newAiNameInput = document.getElementById('new-ai-name-input') as HTMLInputElement; // 用于显示选择的模型名

        let selectedModelForConfig: { id: string, name: string } | null = null;
        const currentSelectedModelId = getSelectedModelId();
        
        // 初始显示
        updateAISettingsDisplay(currentSelectedModelId);
        
        // 绑定下拉菜单开关
        dropdownButton?.addEventListener('click', () => {
            dropdownMenu?.classList.toggle('hidden');
        });

        // 绑定模型选择和配置逻辑
        dropdownMenu?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const modelButton = target.closest('.ai-model-select-btn');

            if (modelButton) {
                const modelId = modelButton.getAttribute('data-model-id')!;
                const model = AI_MODELS.find(m => m.id === modelId);
                if (!model) return;

                // 1. 选中模型
                setSelectedModelId(modelId);
                
                // 2. 更新显示
                updateAISettingsDisplay(modelId);
                dropdownMenu?.classList.add('hidden');

                // 3. 准备配置输入
                selectedModelForConfig = model;
                const storedKey = localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${modelId}`) || '';

                (document.getElementById('ai-input-title') as HTMLElement).textContent = `配置 ${model.name} 的 API Key`;
                newAiNameInput.value = model.name;
                newAiNameInput.disabled = true; // 模型名称不可编辑
                newApiKeyInput.value = storedKey;
                newApiKeyInput.type = 'password'; // 隐藏 Key
                addAiBtn.textContent = storedKey ? '更新 Key' : '添加 Key';
                addAiBtn.style.display = 'block'; // 显示添加/更新按钮
                aiKeyMessage.classList.add('hidden');
                addAiSection?.classList.remove('hidden');

            } else if (target.closest('#add-ai-btn')) {
                 // '添加新的 AI' 按钮 - 此时应引导用户在下拉菜单中选择一个模型
                 // 因为所有模型都是预定义的，不接受自定义模型，这个按钮现在应作为提示
                 aiKeyMessage.textContent = '请在上方列表中选择一个 AI 模型进行配置。';
                 aiKeyMessage.classList.remove('hidden');
            }
        });

        // 绑定 Key 提交逻辑
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

            // 保存 Key
            saveApiKey(selectedModelForConfig.id, apiKey);
            
            // 更新 UI 状态
            updateAISettingsDisplay(selectedModelForConfig.id);
            addAiSection?.classList.add('hidden'); // 隐藏配置区
            aiKeyMessage.classList.remove('text-red-400');
            aiKeyMessage.classList.add('text-green-400');
            aiKeyMessage.textContent = `${selectedModelForConfig.name} 的 Key 已成功保存!`;
            aiKeyMessage.classList.remove('hidden');

            // 2秒后清除提示
            setTimeout(() => {
                aiKeyMessage.classList.add('hidden');
            }, 2000);
        });
    },

    /**
     * 处理聊天提交的逻辑。
     */
    async handleChatSubmit() {
        const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;
        const chatMessages = document.getElementById('chat-messages') as HTMLElement;
        const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;

        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        const selectedModelId = getSelectedModelId();
        const apiKey = selectedModelId ? localStorage.getItem(`${AI_KEY_STORAGE_PREFIX}${selectedModelId}`) : null;
        const modelConfig = AI_MODELS.find(m => m.id === selectedModelId);

        if (!modelConfig || !apiKey) {
             // 理论上在 setupChatDisplay 中已禁用，这里是安全检查
             alert('请先在 AI 设置中选择模型并设置 API Key。');
             return;
        }

        // 禁用输入和发送按钮
        chatInput.value = '';
        sendButton.disabled = true;
        chatInput.disabled = true;

        // 1. 显示用户消息
        const userMsgHtml = `
            <div class="flex justify-end">
                <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs md:max-w-md break-words">${userMessage}</div>
            </div>
        `;
        chatMessages.innerHTML += userMsgHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 2. 显示 AI 占位符
        let aiMsgElement = document.createElement('div');
        aiMsgElement.className = 'flex justify-start';
        aiMsgElement.innerHTML = `
            <div class="bg-[#3a3f41] text-gray-200 p-3 rounded-lg max-w-xs md:max-w-md break-words">
                <span id="ai-typing-${Date.now()}">AI 正在思考...</span>
            </div>
        `;
        chatMessages.appendChild(aiMsgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            };
            
            // 针对千问 (Qwen) 的特殊处理：使用 X-DashScope-Apikey
            if (modelConfig.id === 'qwen') {
                delete headers['Authorization']; // 删除通用授权头
                headers['X-DashScope-ApiKey'] = apiKey; // 使用千问专用 Key 头
            }

            const body = JSON.stringify({
                // 通用 ChatCompletions API 格式
                model: modelConfig.model,
                messages: [{ role: 'user', content: userMessage }],
                // 其他参数可根据需要添加，例如 temperature, max_tokens 等
            });

            const response = await fetch(modelConfig.endpoint, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 错误: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            let aiResponseText = '未能获取到响应文本。';

            // 提取响应文本
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                aiResponseText = data.choices[0].message.content.trim();
            } else if (data.output && data.output.choices && data.output.choices.length > 0) {
                 // 适配阿里云千问的响应结构
                aiResponseText = data.output.choices[0].message.content.trim();
            }

            // 3. 更新 AI 消息
            aiMsgElement.querySelector('span')!.textContent = aiResponseText;

        } catch (error) {
            console.error('AI 聊天请求失败:', error);
            aiMsgElement.querySelector('span')!.textContent = `[错误] AI 响应失败: ${error instanceof Error ? error.message : '未知错误'}`;
            aiMsgElement.querySelector('div')!.classList.remove('bg-[#3a3f41]');
            aiMsgElement.querySelector('div')!.classList.add('bg-red-800'); // 红色背景表示错误
        } finally {
            // 重新启用输入和发送按钮
            sendButton.disabled = false;
            chatInput.disabled = false;
            chatInput.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },
    
    // 导出 setupChatDisplay 供其他模块（如 main.ts）在打开聊天侧边栏时调用
    setupChatDisplay: setupChatDisplay,
    // 导出 AI_MODELS 列表
    AI_MODELS: AI_MODELS,
};

export default aichat;
