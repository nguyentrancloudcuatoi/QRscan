let contentData = [];

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

// Thêm hàm để tìm content theo ID
function findContentById(id) {
    return contentData.find(item => item.ID === id);
}

// Export để scripts.js có thể sử dụng
window.findContentById = findContentById;

document.addEventListener('DOMContentLoaded', function() {
    const lessonModal = document.getElementById('lessonModal');
    const lessonTitle = document.getElementById('lessonTitle'); 
    console.log("Lesson Modal:", lessonModal); // Log for debugging
    console.log("Lesson Title Element:", lessonTitle); // Log for debugging
    const lessonDescription = document.getElementById('lessonDescription');

    const downloadLinks = {
        "Tiếng Anh": "https://www.dropbox.com/scl/fo/9b1usyu53yy3nkqu3nx1x/AHtdfRzesPuaD-ZmXvgWQrg?rlkey=h3pafxc13rkfvs1y6lprrty3e&st=osxu20pz&dl=1",
        "KHTN (Lý, Hóa, Sinh)": "https://www.dropbox.com/scl/fo/fef72zb89jidz407535a0/ABg5jMVGAplDKHm3caHTENU?rlkey=14ucgq8irwrlws2dyqbnspmn3&st=wp97mwi0&dl=1", 
        "Toán": "https://www.dropbox.com/scl/fo/dxi8g92sakcpwyi44fzvg/AJt4Q6VsfiYBCse4o1LLOkw?rlkey=r9cf1rhq6mbgszqh9njgu6i62&st=c9c0wgfo&dl=1",
        "Ngữ Văn": "https://www.dropbox.com/scl/fo/itij78m3ivvv31cdcu95p/AESnX18rIvk_U3uZ_Xca6s4?rlkey=p2fzxtdb90qq1lot0tsb66aif&st=0jqdyb2y&dl=1"
    };

    const resourceCards = document.querySelectorAll('.resource-card');
    console.log("Resource Cards:", resourceCards); // Log for debugging
    resourceCards.forEach(card => {
        const downloadButton = card.querySelector('.btn-download');
        if (!downloadButton) {
            console.error("Download button not found in card:", card);
        }
        const subject = card.querySelector('h3').innerText; // Get the subject from the card

        // Set the download button's onclick event
        downloadButton.onclick = function() {
            const downloadUrl = downloadLinks[subject] || '#'; // Fallback if subject not found
            window.location.href = downloadUrl;
        };

        card.addEventListener('click', function() {
            const lessonName = this.querySelector('h3').innerText; // Lấy tên bài học
            const lessonDesc = this.querySelector('p').innerText; // Lấy mô tả bài học
            const lessonUrl = this.dataset.url; // Lấy URL từ thuộc tính data-url
            const lessonList = document.getElementById('lessonList');
            lessonList.innerHTML = ''; // Clear existing list items

            // Define the lesson topics and their links
            const lessonTopics = {
                "Tiếng Anh": [
                    { chapter: "Chương 1", link: "link_to_lesson_english_chapter1.html" },
                    { chapter: "Chương 2", link: "link_to_lesson_english_chapter2.html" },
                    { chapter: "Chương 3", link: "link_to_lesson_english_chapter3.html" }
                ],
                "KHTN (Lý, Hóa, Sinh)": [
                    { chapter: "Chương 1", link: "link_to_khtn_chapter1.html" },
                    { chapter: "Chương 2", link: "link_to_khtn_chapter2.html" },
                    { chapter: "Chương 3", link: "link_to_khtn_chapter3.html" }
                ],
                "Toán": [
                    { chapter: "Chương 1", link: "link_to_math_chapter1.html" },
                    { chapter: "Chương 2", link: "link_to_math_chapter2.html" },
                    { chapter: "Chương 3", link: "link_to_math_chapter3.html" }
                ],
                "Ngữ Văn": [
                    { chapter: "Chương 1", link: "link_to_literature_chapter1.html" },
                    { chapter: "Chương 2", link: "link_to_literature_chapter2.html" },
                    { chapter: "Chương 3", link: "link_to_literature_chapter3.html" }
                ]
            };

            // Populate the lesson list with topics and links
            const topics = lessonTopics[lessonName] || [];
            topics.forEach(topic => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span>${topic.chapter}</span>
                    <button onclick="window.location.href='${topic.link}'" class="btn-icon"><i class="fas fa-arrow-right"></i></button>
                `;
                lessonList.appendChild(listItem);
            });

            // Create a list item for the lesson
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${lessonName}</span>
                <button onclick="window.location.href='${lessonUrl}'" class="btn-icon"><i class="fas fa-arrow-right"></i></button>
            `;
            lessonList.appendChild(listItem);

            lessonTitle.innerText = lessonName;
            lessonDescription.innerText = lessonDesc;

            console.log("Opening modal for lesson:", lessonName); // Log for debugging
            lessonModal.style.display = 'block'; // Hiển thị modal
        });
    });

    // Log for debugging the close button
    const closeButton = document.querySelector('.close');
    console.log("Close Button:", closeButton); // Log for debugging
    if (closeButton) {
        closeButton.onclick = function() {
            lessonModal.style.display = 'none';
        };
    } else {
        console.error("Close button not found!");
    }

    // Đóng modal khi nhấp ra ngoài modal
    window.onclick = function(event) {
        if (event.target === lessonModal) {
            lessonModal.style.display = 'none';
        }
    };
});