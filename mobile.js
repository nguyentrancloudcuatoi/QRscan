// Biến toàn cục
let contentData = [];
let videoStream = null;
let isScanning = false;
let speechUtterance = null;

// Khởi tạo khi trang được load
document.addEventListener('DOMContentLoaded', function() {
    // Fetch dữ liệu từ Google Sheet
    fetchSheet
        .fetch({
            gSheetId: "1Ou0lWPoS4saNYh8stySSpJc_A3kw9WgZY8JLPWIbv9M",
            wSheetName: "Trang tính1",
        })
        .then((rows) => {
            contentData = rows;
            console.log('Loaded content data:', contentData);
        })
        .catch(error => {
            console.error('Error fetching sheet data:', error);
        });

    // Xử lý navigation
    const navButtons = document.querySelectorAll('.nav-button');
    const views = {
        scanner: document.getElementById('scannerView'),
        content: document.getElementById('contentView')
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const viewName = button.dataset.view;
            
            // Update navigation buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update views
            Object.values(views).forEach(view => view.classList.remove('active'));
            views[viewName].classList.add('active');

            // Dừng camera nếu chuyển khỏi màn hình scanner
            if (viewName !== 'scanner' && isScanning) {
                stopScanner();
            }
        });
    });

    // Xử lý nút bắt đầu quét
    const startCameraBtn = document.getElementById('startCamera');
    startCameraBtn.addEventListener('click', () => {
        if (isScanning) {
            stopScanner();
        } else {
            startScanner();
        }
    });
});

// Tìm content theo ID
function findContentById(id) {
    return contentData.find(item => item.ID === id);
}

// Khởi tạo và cập nhật danh sách giọng đọc
let voices = [];
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

// Tìm giọng đọc tiếng Việt
function findVietnameseVoice() {
    const preferredVoices = [
        voices.find(voice => voice.lang === 'vi-VN'),
        voices.find(voice => voice.lang.startsWith('vi')),
        voices.find(voice => voice.name.toLowerCase().includes('vietnamese')),
        voices[0]
    ];
    return preferredVoices.find(voice => voice !== undefined);
}

// Xử lý quét QR
async function startScanner() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Trình duyệt không hỗ trợ quét mã QR');
            return;
        }

        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        const video = document.getElementById('webcam');
        video.srcObject = videoStream;
        video.setAttribute('playsinline', true);
        await video.play();

        const startCameraBtn = document.getElementById('startCamera');
        startCameraBtn.innerHTML = '<i class="fas fa-stop"></i><span>Dừng quét</span>';
        isScanning = true;

        requestAnimationFrame(scanQRCode);
    } catch (err) {
        console.error('Lỗi truy cập camera:', err);
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
    }
}

function stopScanner() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        const video = document.getElementById('webcam');
        video.srcObject = null;
        
        const startCameraBtn = document.getElementById('startCamera');
        startCameraBtn.innerHTML = '<i class="fas fa-camera"></i><span>Bắt đầu quét</span>';
        isScanning = false;
    }
}

function scanQRCode() {
    if (!videoStream || !isScanning) return;

    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');

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
                
                // Chuyển sang tab nội dung
                document.querySelector('[data-view="content"]').click();
                return;
            }
        } catch (error) {
            console.error('Lỗi khi quét QR:', error);
        }
    }

    if (isScanning) {
        requestAnimationFrame(scanQRCode);
    }
}

function handleQRCode(data) {
    try {
        console.log('QR Data received:', data);
        
        // Tìm kiếm content theo ID
        const contentItem = findContentById(data);
        
        if (contentItem) {
            console.log('Found content:', contentItem);
            
            // Kiểm tra nếu content là URL
            if (contentItem.content.startsWith('http')) {
                showContent({
                    type: 'slides',
                    url: contentItem.content
                });
            } else {
                // Nếu không phải URL, hiển thị như text
                const contentPreview = document.getElementById('content-preview');
                contentPreview.innerHTML = `
                    <div class="content-text">
                        <h2>${contentItem.name || 'Nội dung'}</h2>
                        <div class="text-content">
                            ${contentItem.content}
                        </div>
                        <div class="text-controls">
                            <button class="btn-speak" onclick="speakText('${contentItem.content.replace(/'/g, "\\'")}')">
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

function showContent(content) {
    const contentPreview = document.getElementById('content-preview');
    
    switch (content.type?.toLowerCase()) {
        case 'slides':
            const embedUrl = getEmbedUrl(content.url);
            contentPreview.innerHTML = `
                <div class="slides-container">
                    <iframe 
                        src="${embedUrl}"
                        frameborder="0"
                        width="100%"
                        height="100%"
                        allowfullscreen="true"
                        mozallowfullscreen="true"
                        webkitallowfullscreen="true">
                    </iframe>
                </div>`;
            break;

        default:
            contentPreview.innerHTML = `
                <div class="preview-placeholder">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Định dạng không được hỗ trợ</p>
                </div>`;
    }
}

function getEmbedUrl(url) {
    try {
        if (url.includes('docs.google.com/presentation')) {
            const presentationId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (presentationId && presentationId[1]) {
                return `https://docs.google.com/presentation/d/${presentationId[1]}/embed?start=false&loop=false&delayms=3000`;
            }
        }
        return url;
    } catch (error) {
        console.error('Lỗi chuyển đổi URL:', error);
        return url;
    }
}

async function speakText(text) {
    try {
        stopSpeaking();
        
        await initVoices();
        
        speechUtterance = new SpeechSynthesisUtterance(text);
        speechUtterance.lang = 'vi-VN';
        speechUtterance.rate = 0.9;
        speechUtterance.pitch = 1.0;
        
        const vietnameseVoice = findVietnameseVoice();
        if (vietnameseVoice) {
            console.log('Using voice:', vietnameseVoice.name);
            speechUtterance.voice = vietnameseVoice;
        }

        speechUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
        };

        window.speechSynthesis.speak(speechUtterance);
        
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