// تطبيق دليل الهاتف - يعمل أوفلاين مع IndexedDB
// البيانات تأتي من ملف data.js (بيانات من phonebook.sql)

let contacts = [];
let currentFilter = "الكل";
let searchTerm = "";
let editingId = null;
let db = null;

// عناصر DOM
const splashScreen = document.getElementById("splash");
const mainApp = document.getElementById("mainApp");
const enterBtn = document.getElementById("enterBtn");
const navBtns = document.querySelectorAll(".nav-btn");
const tabs = document.querySelectorAll(".tab");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const addBtn = document.getElementById("addBtn");
const contactsList = document.getElementById("contactsList");
const favoritesList = document.getElementById("favoritesList");
const modal = document.getElementById("modal");
const closeBtn = document.querySelector(".close");
const contactForm = document.getElementById("contactForm");
const toast = document.getElementById("toast");

// جميع البيانات تأتي من ملف data.js (بيانات من phonebook.sql)
// لا توجد بيانات مدمجة في ملف JavaScript

// تهيئة IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        // حذف قاعدة البيانات القديمة
        const deleteRequest = indexedDB.deleteDatabase("phonebook_db");
        
        deleteRequest.onsuccess = () => {
            const request = indexedDB.open("phonebook_db", 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (!database.objectStoreNames.contains("contacts")) {
                    const store = database.createObjectStore("contacts", { keyPath: "id" });
                    store.createIndex("name", "firstName", { unique: false });
                    store.createIndex("category", "category", { unique: false });
                }
            };
        };
        
        deleteRequest.onerror = () => {
            // إذا فشل الحذف، حاول فتح قاعدة البيانات مباشرة
            const request = indexedDB.open("phonebook_db", 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                if (database.objectStoreNames.contains("contacts")) {
                    database.deleteObjectStore("contacts");
                }
                const store = database.createObjectStore("contacts", { keyPath: "id" });
                store.createIndex("name", "firstName", { unique: false });
                store.createIndex("category", "category", { unique: false });
            };
        };
    });
}

// تحميل البيانات الأولية من data.js إلى IndexedDB
function loadInitialDataFromFile() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["contacts"], "readwrite");
        const store = transaction.objectStore("contacts");
        
        // البيانات من data.js
        if (typeof phonebookData !== 'undefined' && phonebookData.length > 0) {
            phonebookData.forEach(contact => {
                store.add(contact);
            });
        }
        
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
            resolve();
        };
    });
}

// تحميل البيانات من IndexedDB
function loadContacts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["contacts"], "readonly");
        const store = transaction.objectStore("contacts");
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            contacts = request.result;
            
            // إذا كانت قاعدة البيانات فارغة، حمّل البيانات من data.js
            if (contacts.length === 0) {
                loadInitialDataFromFile().then(() => {
                    // أعد تحميل البيانات بعد إدراجها
                    const transaction2 = db.transaction(["contacts"], "readonly");
                    const store2 = transaction2.objectStore("contacts");
                    const request2 = store2.getAll();
                    request2.onsuccess = () => {
                        contacts = request2.result;
                        resolve(contacts);
                    };
                }).catch(reject);
            } else {
                resolve(contacts);
            }
        };
    });
}

// حفظ جهة اتصال في IndexedDB
function saveContact(contact) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["contacts"], "readwrite");
        const store = transaction.objectStore("contacts");
        
        if (contact.id) {
            store.put(contact);
        } else {
            contact.id = Math.max(...contacts.map(c => c.id), 0) + 1;
            store.add(contact);
        }
        
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(contact);
    });
}

// حذف جهة اتصال من IndexedDB
function deleteContactFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["contacts"], "readwrite");
        const store = transaction.objectStore("contacts");
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

// عرض الإشعار
function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = `toast ${type === "error" ? "error" : ""}`;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

// الدخول للموقع
enterBtn.addEventListener("click", () => {
    splashScreen.style.display = "none";
    mainApp.classList.remove("hidden");
});

// تبديل التابات
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        
        navBtns.forEach(b => b.classList.remove("active"));
        tabs.forEach(t => t.classList.remove("active"));
        
        btn.classList.add("active");
        document.getElementById(tabName).classList.add("active");
        
        if (tabName === "favorites") {
            displayFavorites();
        }
    });
});

// البحث
searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    displayContacts();
});

// التصفية
categoryFilter.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    displayContacts();
});

// عرض جهات الاتصال
function displayContacts() {
    let filtered = contacts;
    
    if (currentFilter !== "الكل") {
        filtered = filtered.filter(c => c.category === currentFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(c => 
            (c.firstName + " " + c.lastName).toLowerCase().includes(searchTerm) || 
            c.nickname.toLowerCase().includes(searchTerm) || 
            c.jobTitle.toLowerCase().includes(searchTerm) || 
            c.phone.includes(searchTerm) || 
            c.email.includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        contactsList.innerHTML = '<div class="empty-state">لا توجد جهات اتصال</div>';
        return;
    }
    
    contactsList.innerHTML = filtered.map(contact => `
        <div class="contact-card ${contact.favorite ? 'favorite' : ''}">
            <div class="contact-name">${contact.firstName} ${contact.lastName}${contact.nickname ? ` (${contact.nickname})` : ''}</div>
            <div class="contact-category">${contact.category}</div>
            ${contact.jobTitle ? `
            <div class="contact-info">
                <strong>💼 الوظيفة:</strong><br>
                ${contact.jobTitle}
            </div>
            ` : ''}
            <div class="contact-info">
                <strong>📱 الهاتف:</strong><br>
                <a href="tel:${contact.phone}">${contact.phone}</a>
            </div>
            <div class="contact-info">
                <strong>📧 البريد:</strong><br>
                <a href="mailto:${contact.email}">${contact.email}</a>
            </div>
            <div class="contact-actions">
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✏️ تعديل</button>
                <button class="action-btn favorite-btn ${contact.favorite ? 'active' : ''}" onclick="toggleFavorite(${contact.id})">
                    ${contact.favorite ? '❤️ مفضل' : '🤍 إضافة'}
                </button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");
}

// عرض المفضلة
function displayFavorites() {
    const favorites = contacts.filter(c => c.favorite);
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-state">لا توجد جهات مفضلة</div>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(contact => `
        <div class="contact-card favorite">
            <div class="contact-name">${contact.firstName} ${contact.lastName}${contact.nickname ? ` (${contact.nickname})` : ''}</div>
            <div class="contact-category">${contact.category}</div>
            ${contact.jobTitle ? `
            <div class="contact-info">
                <strong>💼 الوظيفة:</strong><br>
                ${contact.jobTitle}
            </div>
            ` : ''}
            <div class="contact-info">
                <strong>📱 الهاتف:</strong><br>
                <a href="tel:${contact.phone}">${contact.phone}</a>
            </div>
            <div class="contact-info">
                <strong>📧 البريد:</strong><br>
                <a href="mailto:${contact.email}">${contact.email}</a>
            </div>
            <div class="contact-actions">
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✏️ تعديل</button>
                <button class="action-btn favorite-btn active" onclick="toggleFavorite(${contact.id})">❤️ إزالة</button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");
}

// إضافة جهة اتصال
addBtn.addEventListener("click", () => {
    editingId = null;
    document.getElementById("modalTitle").textContent = "إضافة جهة اتصال";
    contactForm.reset();
    document.getElementById("contactId").value = "";
    modal.classList.remove("hidden");
    modal.classList.add("active");
});

// تعديل جهة اتصال
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    editingId = id;
    document.getElementById("modalTitle").textContent = "تعديل جهة اتصال";
    document.getElementById("contactId").value = id;
    document.getElementById("firstName").value = contact.firstName;
    document.getElementById("lastName").value = contact.lastName;
    document.getElementById("nickname").value = contact.nickname;
    document.getElementById("jobTitle").value = contact.jobTitle;
    document.getElementById("phone").value = contact.phone;
    document.getElementById("email").value = contact.email;
    document.getElementById("category").value = contact.category;
    modal.classList.remove("hidden");
    modal.classList.add("active");
}

// حفظ جهة اتصال
contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const nickname = document.getElementById("nickname").value;
    const jobTitle = document.getElementById("jobTitle").value;
    const phone = document.getElementById("phone").value;
    const email = document.getElementById("email").value;
    const category = document.getElementById("category").value;
    
    try {
        if (editingId) {
            const contact = contacts.find(c => c.id === editingId);
            if (contact) {
                contact.firstName = firstName;
                contact.lastName = lastName;
                contact.nickname = nickname;
                contact.jobTitle = jobTitle;
                contact.phone = phone;
                contact.email = email;
                contact.category = category;
                await saveContact(contact);
                showToast("تم تحديث جهة الاتصال بنجاح");
            }
        } else {
            const newContact = {
                firstName,
                lastName,
                nickname,
                jobTitle,
                phone,
                email,
                category,
                favorite: false
            };
            await saveContact(newContact);
            showToast("تمت إضافة جهة الاتصال بنجاح");
        }
        
        await loadContacts();
        displayContacts();
        modal.classList.add("hidden");
        modal.classList.remove("active");
        editingId = null;
    } catch (error) {
        showToast("حدث خطأ: " + error.message, "error");
    }
});

// حذف جهة اتصال
async function deleteContact(id) {
    if (confirm("هل أنت متأكد من حذف هذه الجهة؟")) {
        try {
            await deleteContactFromDB(id);
            await loadContacts();
            displayContacts();
            showToast("تم حذف جهة الاتصال");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
}

// إضافة/إزالة من المفضلة
async function toggleFavorite(id) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        try {
            contact.favorite = !contact.favorite;
            await saveContact(contact);
            await loadContacts();
            displayContacts();
            showToast(contact.favorite ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
}

// إغلاق المودال
closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("active");
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
        modal.classList.remove("active");
    }
});

// التهيئة
async function init() {
    try {
        await initDB();
        await loadContacts();
        displayContacts();
    } catch (error) {
        console.error("Error initializing app:", error);
        showToast("حدث خطأ في تحميل البيانات", "error");
    }
}

// بدء التطبيق
init();
