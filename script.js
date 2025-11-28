// بيانات جهات الاتصال
let contacts = [
    { id: 1, name: "أحمد محمد", title: "الأخ", job: "مهندس", phone: "+966501234567", email: "ahmed@example.com", category: "عائلة", favorite: false },
    { id: 2, name: "فاطمة علي", title: "الأخت", job: "معلمة", phone: "+966502345678", email: "fatima@example.com", category: "أصدقاء", favorite: false },
    { id: 3, name: "محمود سالم", title: "المدير", job: "مدير مبيعات", phone: "+966503456789", email: "mahmoud@example.com", category: "عمل", favorite: false },
    { id: 4, name: "نور الدين", title: "العم", job: "طبيب", phone: "+966504567890", email: "noor@example.com", category: "عائلة", favorite: false },
    { id: 5, name: "ليلى حسن", title: "الصديقة", job: "مبرمجة", phone: "+966505678901", email: "layla@example.com", category: "أصدقاء", favorite: false },
    { id: 6, name: "خالد إبراهيم", title: "مسؤول", job: "مسؤول مشروع", phone: "+966506789012", email: "khaled@example.com", category: "عمل", favorite: false },
    { id: 7, name: "سارة محمود", title: "الصديقة", job: "ترجمة", phone: "+966507890123", email: "sarah@example.com", category: "أصدقاء", favorite: false },
    { id: 8, name: "عمر فارس", title: "الزميل", job: "محللل بيانات", phone: "+966508901234", email: "omar@example.com", category: "عمل", favorite: false },
    { id: 9, name: "مريم أحمد", title: "العمة", job: "مربية", phone: "+966509012345", email: "maryam@example.com", category: "عائلة", favorite: false },
    { id: 10, name: "يوسف علي", title: "الصديق", job: "معمار", phone: "+966510123456", email: "youssef@example.com", category: "أصدقاء", favorite: false }
];

let selectedCategory = "الكل";
let searchTerm = "";
let nextId = 11;
let editingId = null;

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
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const editId = document.getElementById("editId");

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

// إضافة/تعديل جهة اتصال
addContactForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const name = document.getElementById("newName").value;
    const title = document.getElementById("newTitle").value;
    const job = document.getElementById("newJob").value;
    const phone = document.getElementById("newPhone").value;
    const email = document.getElementById("newEmail").value;
    const category = document.getElementById("newCategory").value;
    
    if (editingId) {
        // تعديل
        const contact = contacts.find(c => c.id === editingId);
        if (contact) {
            contact.name = name;
            contact.title = title;
            contact.job = job;
            contact.phone = phone;
            contact.email = email;
            contact.category = category;
        }
        editingId = null;
    } else {
        // إضافة
        const newContact = {
            id: nextId++,
            name: name,
            title: title,
            job: job,
            phone: phone,
            email: email,
            category: category,
            favorite: false
        };
        contacts.push(newContact);
    }

    saveContacts();
    addContactForm.reset();
    addFormModal.classList.remove("show");
    formTitle.textContent = "إضافة جهة اتصال جديدة";
    submitBtn.textContent = "إضافة";
    
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
            <div class="contact-subtitle">${contact.title} - ${contact.job}</div>
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
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✍️ تعديل</button>
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
            <div class="contact-subtitle">${contact.title} - ${contact.job}</div>
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
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✍️ تعديل</button>
                <button class="action-btn favorite-btn active" onclick="toggleFavorite(${contact.id})">
                    ❤️ إزالة من المفضلة
                </button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");

    favCount.textContent = favorites.length;
}

// دالة تعديل جهة اتصال
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        editingId = id;
        document.getElementById("newName").value = contact.name;
        document.getElementById("newTitle").value = contact.title;
        document.getElementById("newJob").value = contact.job;
        document.getElementById("newPhone").value = contact.phone;
        document.getElementById("newEmail").value = contact.email;
        document.getElementById("newCategory").value = contact.category;
        
        formTitle.textContent = "تعديل جهة اتصال";
        submitBtn.textContent = "حفظ التغييرات";
        
        addFormModal.classList.add("show");
    }
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
