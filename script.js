// بيانات جهات الاتصال
let contacts = [
    { id: 1, name: "أحمد محمد", phone: "+966501234567", email: "ahmed@example.com", category: "عائلة", favorite: false },
    { id: 2, name: "فاطمة علي", phone: "+966502345678", email: "fatima@example.com", category: "أصدقاء", favorite: false },
    { id: 3, name: "محمود سالم", phone: "+966503456789", email: "mahmoud@example.com", category: "عمل", favorite: false },
    { id: 4, name: "نور الدين", phone: "+966504567890", email: "noor@example.com", category: "عائلة", favorite: false },
    { id: 5, name: "ليلى حسن", phone: "+966505678901", email: "layla@example.com", category: "أصدقاء", favorite: false },
    { id: 6, name: "خالد إبراهيم", phone: "+966506789012", email: "khaled@example.com", category: "عمل", favorite: false },
    { id: 7, name: "سارة محمود", phone: "+966507890123", email: "sarah@example.com", category: "أصدقاء", favorite: false },
    { id: 8, name: "عمر فارس", phone: "+966508901234", email: "omar@example.com", category: "عمل", favorite: false },
    { id: 9, name: "مريم أحمد", phone: "+966509012345", email: "maryam@example.com", category: "عائلة", favorite: false },
    { id: 10, name: "يوسف علي", phone: "+966510123456", email: "youssef@example.com", category: "أصدقاء", favorite: false }
];

let selectedCategory = "الكل";
let searchTerm = "";
let nextId = 11;

// عناصر الـ DOM
const searchInput = document.getElementById("searchInput");
const contactsList = document.getElementById("contactsList");
const countSpan = document.getElementById("count");
const filterButtons = document.querySelectorAll(".filter-btn");
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const openAddFormBtn = document.getElementById("openAddForm");
const addFormModal = document.getElementById("addFormModal");
const addContactForm = document.getElementById("addContactForm");
const closeBtn = document.querySelector(".close");
const favoritesList = document.getElementById("favoritesList");
const favCount = document.getElementById("favCount");

// حفظ البيانات في Local Storage
function saveContacts() {
    localStorage.setItem("contacts", JSON.stringify(contacts));
}

// تحميل البيانات من Local Storage
function loadContacts() {
    const saved = localStorage.getItem("contacts");
    if (saved) {
        contacts = JSON.parse(saved);
        // تحديث nextId
        if (contacts.length > 0) {
            nextId = Math.max(...contacts.map(c => c.id)) + 1;
        }
    }
}

// حدث البحث
searchInput.addEventListener("input", function() {
    searchTerm = this.value.toLowerCase();
    displayContacts();
});

// حدث التصفية
filterButtons.forEach(button => {
    button.addEventListener("click", function() {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        selectedCategory = this.dataset.filter;
        displayContacts();
    });
});

// حدث التنقل بين الصفحات
navButtons.forEach(button => {
    button.addEventListener("click", function() {
        const page = this.dataset.page;
        
        navButtons.forEach(btn => btn.classList.remove("active"));
        this.classList.add("active");
        
        pages.forEach(p => p.classList.remove("active"));
        document.getElementById(page + "Page").classList.add("active");

        if (page === "favorites") {
            displayFavorites();
        }
    });
});

// فتح نموذج الإضافة
openAddFormBtn.addEventListener("click", function() {
    addFormModal.classList.add("show");
});

// إغلاق نموذج الإضافة
closeBtn.addEventListener("click", function() {
    addFormModal.classList.remove("show");
});

window.addEventListener("click", function(e) {
    if (e.target === addFormModal) {
        addFormModal.classList.remove("show");
    }
});

// إضافة جهة اتصال جديدة
addContactForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const newContact = {
        id: nextId++,
        name: document.getElementById("newName").value,
        phone: document.getElementById("newPhone").value,
        email: document.getElementById("newEmail").value,
        category: document.getElementById("newCategory").value,
        favorite: false
    };

    contacts.push(newContact);
    saveContacts();
    
    addContactForm.reset();
    addFormModal.classList.remove("show");
    
    // العودة إلى الصفحة الرئيسية
    navButtons[0].click();
    displayContacts();
});

// دالة عرض جهات الاتصال
function displayContacts() {
    let filtered = contacts;

    if (selectedCategory !== "الكل") {
        filtered = filtered.filter(contact => contact.category === selectedCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        contactsList.innerHTML = '<div class="empty-message">لم يتم العثور على جهات اتصال</div>';
        countSpan.textContent = 0;
        return;
    }

    contactsList.innerHTML = filtered.map(contact => `
        <div class="contact-card ${contact.favorite ? 'favorite' : ''}">
            <div class="contact-name">${contact.name}</div>
            <div class="contact-category">${contact.category}</div>
            <div class="contact-info">
                <strong>📱 الهاتف:</strong><br>
                <a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>
            </div>
            <div class="contact-info">
                <strong>📧 البريد:</strong><br>
                <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
            </div>
            <div class="contact-actions">
                <button class="action-btn favorite-btn ${contact.favorite ? 'active' : ''}" onclick="toggleFavorite(${contact.id})">
                    ${contact.favorite ? '❤️ مفضل' : '🤍 إضافة'}
                </button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");

    countSpan.textContent = filtered.length;
}

// دالة عرض المفضلة
function displayFavorites() {
    const favorites = contacts.filter(c => c.favorite);

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-message">لا توجد جهات اتصال مفضلة</div>';
        favCount.textContent = 0;
        return;
    }

    favoritesList.innerHTML = favorites.map(contact => `
        <div class="contact-card favorite">
            <div class="contact-name">${contact.name}</div>
            <div class="contact-category">${contact.category}</div>
            <div class="contact-info">
                <strong>📱 الهاتف:</strong><br>
                <a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>
            </div>
            <div class="contact-info">
                <strong>📧 البريد:</strong><br>
                <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
            </div>
            <div class="contact-actions">
                <button class="action-btn favorite-btn active" onclick="toggleFavorite(${contact.id})">
                    ❤️ إزالة من المفضلة
                </button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");

    favCount.textContent = favorites.length;
}

// دالة حذف جهة اتصال
function deleteContact(id) {
    if (confirm("هل أنت متأكد من حذف هذه الجهة؟")) {
        contacts = contacts.filter(c => c.id !== id);
        saveContacts();
        displayContacts();
    }
}

// دالة إضافة/إزالة من المفضلة
function toggleFavorite(id) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        contact.favorite = !contact.favorite;
        saveContacts();
        displayContacts();
        
        // إذا كنا في صفحة المفضلة، نحدثها
        if (document.getElementById("favoritesPage").classList.contains("active")) {
            displayFavorites();
        }
    }
}

// تحميل البيانات عند فتح الصفحة
loadContacts();
displayContacts();
