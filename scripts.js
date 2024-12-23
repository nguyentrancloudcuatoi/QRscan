// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.querySelector('.btn-login');
const registerBtn = document.querySelector('.btn-register');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const startCameraBtn = document.getElementById('startCamera');
const stopCameraBtn = document.getElementById('stopCamera');
const webcamElement = document.getElementById('webcam');
const lessonContent = document.getElementById('lessonContent');

// Navigation highlight
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');

// QR Scanner variables
let scanner = null;
let videoStream = null;
let isScanning = false;

// Lấy các elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startCamera');
const stopButton = document.getElementById('stopCamera');

// Modal functions
function openModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    loginModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Event Listeners
loginBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        closeModal();
    }
});

// Form handling
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Add login logic here
    console.log('Login submitted');
    closeModal();
});

// Scroll spy for navigation
function updateActiveNavLink() {
    let fromTop = window.scrollY + 100;

    sections.forEach(section => {
        const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
        if (!link) return;

        if (
            section.offsetTop <= fromTop &&
            section.offsetTop + section.offsetHeight > fromTop
        ) {
            navLinks.forEach(link => link.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', updateActiveNavLink);
window.addEventListener('load', updateActiveNavLink);

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// QR Scanner functions
async function startScanner() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Trình duyệt không hỗ trợ quét mã QR');
            return;
        }

        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        video.srcObject = videoStream;
        video.setAttribute('playsinline', true);
        await video.play();

        // Cập nhật trạng thái nút
        startCameraBtn.innerHTML = '<i class="fas fa-stop"></i> Dừng quét';
        isScanning = true;

        // Bắt đầu quét
        requestAnimationFrame(scanQRCode);
    } catch (err) {
        console.error('Lỗi truy cập camera:', err);
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
}

function stopScanner() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        
        // Cập nhật trạng thái nút
        startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> Bắt đầu quét';
        isScanning = false;

        // Xóa nội dung canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function scanQRCode() {
    if (!videoStream) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                console.log('Đã tìm thấy QR code:', code.data);
                handleQRCode(code.data);
                stopScanner();
                return;
            }
        } catch (error) {
            console.error('Lỗi khi quét QR:', error);
        }
    }

    requestAnimationFrame(scanQRCode);
}

function handleQRCode(data) {
    try {
        console.log('QR Data received:', data);
        
        // Kiểm tra nếu data là URL hợp lệ
        if (isValidUrl(data)) {
            const contentPreview = document.getElementById('content-preview');
            contentPreview.innerHTML = `
                <div class="iframe-container">
                    <iframe 
                        src="${data}"
                        frameborder="0"
                        width="100%"
                        height="500px"
                        allowfullscreen="true"
                        mozallowfullscreen="true"
                        webkitallowfullscreen="true">
                    </iframe>
                    <div class="iframe-controls">
                        <button class="btn-fullscreen" onclick="window.open('${data}', '_blank')">
                            <i class="fas fa-expand"></i> Xem toàn màn hình
                        </button>
                    </div>
                </div>`;
            return;
        }
        
        // Tìm kiếm content theo ID
        const contentItem = window.findContentById(data);
        
        if (contentItem) {
            console.log('Found content:', contentItem);
            
            // Kiểm tra nếu content là URL
            if (contentItem.content.startsWith('http')) {
                showContent({
                    type: 'slides',
                    url: contentItem.content
                });
            } else {
                // Xử lý nội dung text như cũ
                const contentPreview = document.getElementById('content-preview');
                contentPreview.innerHTML = `
                    <div class="content-text">
                        <h2>${contentItem.name || 'Nội dung'}</h2>
                        <div class="text-content">
                            ${contentItem.content}
                        </div>
                        <div class="text-controls">
                            <button class="btn-speak" onclick="speakText('${contentItem.content}')">
                                <i class="fas fa-volume-up"></i> Đọc văn bản
                            </button>
                            <button class="btn-stop-speak" onclick="stopSpeaking()">
                                <i class="fas fa-stop"></i> Dừng đọc
                            </button>
                        </div>
                    </div>`;
                
                // Tự động đọc văn bản
                speakText(contentItem.content);
            }
        } else {
            // Xử lý khi không tìm thấy content
            const contentPreview = document.getElementById('content-preview');
            contentPreview.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không tìm thấy nội dung với ID: ${data}</p>
                </div>`;
        }
    } catch (e) {
        console.error('Lỗi xử lý dữ liệu QR:', e);
        const contentPreview = document.getElementById('content-preview');
        contentPreview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-exclamation-circle"></i>
                <p>Không thể xử lý nội dung. Vui lòng thử lại.</p>
                <small>Lỗi: ${e.message}</small>
            </div>`;
    }
}

// Thêm hàm kiểm tra URL hợp lệ
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Biến lưu trữ đối tượng đọc và danh sách giọng đọc
let speechUtterance = null;
let voices = [];

// Khởi tạo và cập nhật danh sách giọng đọc
function initVoices() {
    return new Promise((resolve) => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                resolve(voices);
            };
        }
    });
}

// Tìm giọng đọc tiếng Việt phù hợp nhất
function findVietnameseVoice() {
    // Thứ tự ưu tiên các giọng đọc
    const preferredVoices = [
        voices.find(voice => voice.lang === 'vi-VN'),
        voices.find(voice => voice.lang.startsWith('vi')),
        voices.find(voice => voice.name.toLowerCase().includes('vietnamese')),
        // Fallback to first available voice if no Vietnamese voice found
        voices[0]
    ];
    
    return preferredVoices.find(voice => voice !== undefined);
}

async function speakText(text) {
    try {
        // Dừng phát âm hiện tại nếu có
        stopSpeaking();
        
        // Đảm bảo danh sách giọng đọc đã được tải
        await initVoices();
        
        // Khởi tạo đối tượng đọc
        speechUtterance = new SpeechSynthesisUtterance(text);
        
        // Cấu hình cơ bản
        speechUtterance.lang = 'vi-VN';
        speechUtterance.rate = 0.9; // Giảm tốc độ đọc một chút
        speechUtterance.pitch = 1.0;
        
        // Tìm và sử dụng giọng tiếng Việt
        const vietnameseVoice = findVietnameseVoice();
        if (vietnameseVoice) {
            console.log('Using voice:', vietnameseVoice.name);
            speechUtterance.voice = vietnameseVoice;
        }

        // Thêm xử lý lỗi
        speechUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };

        // Bắt đầu đọc
        window.speechSynthesis.speak(speechUtterance);
        
        // Log thông tin debug
        console.log('Available voices:', voices);
        console.log('Selected voice:', speechUtterance.voice);
        console.log('Language:', speechUtterance.lang);
        
    } catch (error) {
        console.error('Error in speech synthesis:', error);
    }
}

function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        speechUtterance = null;
    }
}

// Khởi tạo danh sách giọng khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    initVoices().then(() => {
        console.log('Voices initialized:', voices);
    });
});

function getEmbedUrl(url) {
    try {
        // Xử lý URL Google Slides
        if (url.includes('docs.google.com/presentation')) {
            const presentationId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (presentationId && presentationId[1]) {
                return `https://docs.google.com/presentation/d/${presentationId[1]}/embed?start=false&loop=false&delayms=3000`;
            }
        }
        // Xử lý URL Google Docs
        else if (url.includes('docs.google.com/document')) {
            const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (docId && docId[1]) {
                return `https://docs.google.com/document/d/${docId[1]}/preview`;
            }
        }
        return url;
    } catch (error) {
        console.error('Lỗi chuyển đổi URL:', error);
        return url;
    }
}

function showContent(content) {
    const contentPreview = document.getElementById('content-preview');
    if (!contentPreview) {
        console.error('Không tìm thấy element content-preview');
        return;
    }

    console.log('Showing content:', content);

    switch (content.type?.toLowerCase()) {
        case 'slides':
            const embedUrl = getEmbedUrl(content.url);
            console.log('Embed URL:', embedUrl);
            contentPreview.innerHTML = `
                <div class="slides-container">
                    <iframe 
                        src="${embedUrl}"
                        frameborder="0"
                        width="100%"
                        height="500px"
                        allowfullscreen="true"
                        mozallowfullscreen="true"
                        webkitallowfullscreen="true">
                    </iframe>
                </div>`;
            break;

        case 'youtube':
            const videoId = content.videoId || content.url.split('v=')[1] || '';
            contentPreview.innerHTML = `
                <div class="video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                        frameborder="0"
                        width="100%"
                        height="500px"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" 
                        allowfullscreen>
                    </iframe>
                </div>`;
            break;

        default:
            // Thử hiển thị như một URL thông thường
            contentPreview.innerHTML = `
                <div class="slides-container">
                    <iframe 
                        src="${content.url || content}"
                        frameborder="0"
                        width="100%"
                        height="500px"
                        allowfullscreen="true">
                    </iframe>
                </div>`;
    }
}

// Event Listeners
startCameraBtn.addEventListener('click', () => {
    if (isScanning) {
        stopScanner();
    } else {
        startScanner();
    }
});


// Animation for feature cards
const observerOptions = {
    threshold: 0.2
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .resource-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    observer.observe(card);
});

// Resource download handling
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const resourceName = this.closest('.resource-card').querySelector('h3').textContent;
        alert(`Đang tải xuống tài liệu: ${resourceName}`);
        // Add actual download logic here
    });
});

// Mobile menu handling (you might want to add a hamburger menu for mobile)
function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.classList.add('mobile-menu-btn');
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    
    mobileMenuBtn.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('show');
    });
    
    navbar.insertBefore(mobileMenuBtn, navbar.firstChild);
}

// Call mobile menu setup on load
if (window.innerWidth <= 768) {
    createMobileMenu();
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.mobile-menu-btn')) {
            createMobileMenu();
        }
    } else {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.remove();
        }
        document.querySelector('.nav-links').classList.remove('show');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.resource-container');
    const resourceGrid = document.querySelector('.resource-grid');
    const prevBtn = document.querySelector('.scroll-btn.prev');
    const nextBtn = document.querySelector('.scroll-btn.next');
    const cards = document.querySelectorAll('.resource-card');
    
    let currentIndex = 0;
    const cardWidth = cards[0].offsetWidth + 20; // width + gap
    const visibleCards = Math.floor(container.offsetWidth / cardWidth);
    const maxIndex = cards.length - visibleCards;

    // Khởi tạo trạng thái nút
    updateButtonStates();

    // Xử lý click nút Previous
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSliderPosition();
        }
    });

    // Xử lý click nút Next
    nextBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateSliderPosition();
        }
    });

    // Cập nhật vị trí slider
    function updateSliderPosition() {
        const translateX = -currentIndex * cardWidth;
        resourceGrid.style.transform = `translateX(${translateX}px)`;
        updateButtonStates();
    }

    // Cập nhật trạng thái các nút
    function updateButtonStates() {
        prevBtn.classList.toggle('disabled', currentIndex === 0);
        nextBtn.classList.toggle('disabled', currentIndex >= maxIndex);
    }

    // Xử lý resize window
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reset vị trí khi resize
            currentIndex = 0;
            updateSliderPosition();
        }, 100);
    });
});


