// 文件名: src/main.ts

const textarea = document.querySelector('textarea');
const allButtons = document.querySelectorAll('button');
const toggleRightSidebarBtn = document.getElementById('toggle-right-sidebar-btn');
const rightSidebar = document.getElementById('right-sidebar');
const aiGenerateBtn = document.getElementById('ai-generate-btn');
const aiSidebar = document.getElementById('ai-sidebar');
const editorArea = document.getElementById('editor-area');

if (textarea) {
    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const spaces = '    ';
            
            textarea.value = textarea.value.substring(0, start) + spaces + textarea.value.substring(end);
            
            textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        }
    });
}

allButtons.forEach(button => {
    button.addEventListener('click', function(this: HTMLButtonElement) {
        if (this.id !== 'toggle-right-sidebar-btn') {
            console.log('点击了按钮:', this.textContent?.trim());
        }
    });
});

function toggleRightSidebar(open: boolean) {
    if (rightSidebar) {
        if (open) {
            rightSidebar.classList.remove('translate-x-full');
        } else {
            rightSidebar.classList.add('translate-x-full');
        }
    }
}

toggleRightSidebarBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    console.log('点击了按钮:', toggleRightSidebarBtn.textContent?.trim());
    const isOpen = rightSidebar?.classList.contains('translate-x-full');
    if(isOpen)
    toggleRightSidebar(isOpen);
});

document.addEventListener('click', (e: MouseEvent) => {
    const isSidebarOpen = !rightSidebar?.classList.contains('translate-x-full');
    
    if (isSidebarOpen && rightSidebar && toggleRightSidebarBtn) {
        const target = e.target as HTMLElement;
        
        if (!rightSidebar.contains(target) && !toggleRightSidebarBtn.contains(target)) {
            toggleRightSidebar(false);
        }
    }
});

function toggleAISidebar(open: boolean) {
    if (aiSidebar) {
        if (open) {
            aiSidebar.classList.remove('translate-x-full');
        } else {
            aiSidebar.classList.add('translate-x-full');
        }
    }
}

aiGenerateBtn?.addEventListener('click', () => {
    toggleAISidebar(true);
});

document.addEventListener('click', (e: MouseEvent) => {
    const isSidebarOpen = !aiSidebar?.classList.contains('translate-x-full');
    
    if (isSidebarOpen && aiSidebar && aiGenerateBtn) {
        const target = e.target as HTMLElement;
        
        if (!aiSidebar.contains(target) && !aiGenerateBtn.contains(target)) {
            toggleAISidebar(false);
        }
    }
});