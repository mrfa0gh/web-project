// دليل الهاتف - Phone Book
// البيانات تأتي من ملف data.js (بيانات من phonebook.sql)

let contacts = [];
let currentFilter = "الكل";
let searchTerm = "";
let editingId = null;
let db = null;
let selectionMode = false;
let selectedIds = new Set();

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
const selectBtn = document.getElementById("selectBtn");
const deleteAllBtn = document.getElementById("deleteAllBtn");
const bulkActionsPanel = document.getElementById("bulkActionsPanel");
const selectedCount = document.getElementById("selectedCount");
const cancelSelectBtn = document.getElementById("cancelSelectBtn");
const bulkAddFavoriteBtn = document.getElementById("bulkAddFavoriteBtn");
const bulkRemoveFavoriteBtn = document.getElementById("bulkRemoveFavoriteBtn");
const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
const bulkEditBtn = document.getElementById("bulkEditBtn");

// تهيئة IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
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
                store.add(contact).catch(() => {
                    // تجاهل الأخطاء إذا كانت البيانات موجودة بالفعل
                });
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
        const request = store.put(contact);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
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
        <div class="contact-card ${contact.favorite ? 'favorite' : ''} ${selectedIds.has(contact.id) ? 'selected' : ''}">
            <div class="card-header">
                ${selectionMode ? `<input type="checkbox" class="contact-checkbox" data-id="${contact.id}" ${selectedIds.has(contact.id) ? 'checked' : ''}>` : ''}
                <div class="card-title-section">
                    <div class="contact-name">${contact.firstName} ${contact.lastName}</div>
                    ${contact.nickname ? `<div class="contact-nickname">(${contact.nickname})</div>` : ''}
                </div>
                <div class="contact-category-badge">${contact.category}</div>
            </div>
            <div class="card-body">
                ${contact.jobTitle ? `<div class="contact-job"><strong>💼</strong> ${contact.jobTitle}</div>` : ''}
                <div class="contact-phone"><strong>📱</strong> <a href="tel:${contact.phone}">${contact.phone}</a></div>
                <div class="contact-email"><strong>📧</strong> <a href="mailto:${contact.email}">${contact.email}</a></div>
            </div>
            <div class="card-footer">
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✏️ تعديل</button>
                <button class="action-btn favorite-btn ${contact.favorite ? 'active' : ''}" onclick="toggleFavorite(${contact.id})">
                    ${contact.favorite ? '❤️ مفضل' : '🤍 إضافة'}
                </button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");
    
    // إضافة مستمعات الاختيار عند التحديث
    if (selectionMode) {
        document.querySelectorAll(".contact-checkbox").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedIds.add(id);
                } else {
                    selectedIds.delete(id);
                }
                updateSelectedCount();
            });
        });
    }
}

// تحديث عداد المحددة
function updateSelectedCount() {
    selectedCount.textContent = "تم تحديد " + selectedIds.size;
}

// عرض المفضلة
function displayFavorites() {
    const favorites = contacts.filter(c => c.favorite);
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<div class="empty-state">لا توجد جهات مفضلة</div>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(contact => `
        <div class="contact-card favorite ${selectedIdsFavorites.has(contact.id) ? 'selected' : ''}">
            <div class="card-header">
                <div class="card-title-section">
                    ${selectionModeFavorites ? `<input type="checkbox" class="contact-checkbox-fav" data-id="${contact.id}" ${selectedIdsFavorites.has(contact.id) ? 'checked' : ''}>` : ''}
                    <div class="contact-name">${contact.firstName} ${contact.lastName}</div>
                    ${contact.nickname ? `<div class="contact-nickname">(${contact.nickname})</div>` : ''}
                </div>
                <div class="contact-category-badge">${contact.category}</div>
            </div>
            <div class="card-body">
                ${contact.jobTitle ? `<div class="contact-job"><strong>💼</strong> ${contact.jobTitle}</div>` : ''}
                <div class="contact-phone"><strong>📱</strong> <a href="tel:${contact.phone}">${contact.phone}</a></div>
                <div class="contact-email"><strong>📧</strong> <a href="mailto:${contact.email}">${contact.email}</a></div>
            </div>
            <div class="card-footer">
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✏️ تعديل</button>
                <button class="action-btn favorite-btn active" onclick="toggleFavorite(${contact.id})">❤️ إزالة</button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");
    
    // إضافة مستمعات الاختيار
    if (selectionModeFavorites) {
        document.querySelectorAll(".contact-checkbox-fav").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedIdsFavorites.add(id);
                } else {
                    selectedIdsFavorites.delete(id);
                }
                updateSelectedCountFavorites();
            });
        });
    }
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
    document.getElementById("contactId").value = contact.id;
    document.getElementById("firstName").value = contact.firstName;
    document.getElementById("lastName").value = contact.lastName;
    document.getElementById("nickname").value = contact.nickname || "";
    document.getElementById("jobTitle").value = contact.jobTitle || "";
    document.getElementById("phone").value = contact.phone;
    document.getElementById("email").value = contact.email;
    document.getElementById("category").value = contact.category;
    
    modal.classList.remove("hidden");
    modal.classList.add("active");
}

// حفظ أو تحديث جهة اتصال
contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const contact = {
        id: editingId || Date.now(),
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        nickname: document.getElementById("nickname").value,
        jobTitle: document.getElementById("jobTitle").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        category: document.getElementById("category").value,
        favorite: editingId ? contacts.find(c => c.id === editingId)?.favorite || false : false
    };
    
    try {
        await saveContact(contact);
        await loadContacts();
        displayContacts();
        modal.classList.add("hidden");
        modal.classList.remove("active");
        showToast(editingId ? "تم تحديث جهة الاتصال" : "تمت إضافة جهة الاتصال");
    } catch (error) {
        showToast("حدث خطأ: " + error.message, "error");
    }
});

// حذف جهة اتصال
async function deleteContact(id) {
    if (confirm("هل أنت متأكد من حذف جهة الاتصال؟")) {
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

// تبديل المفضلة
async function toggleFavorite(id) {
    const contact = contacts.find(c => c.id === id);
    if (contact) {
        contact.favorite = !contact.favorite;
        try {
            await saveContact(contact);
            await loadContacts();
            displayContacts();
            showToast(contact.favorite ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
}

// حذف جميع البيانات
deleteAllBtn.addEventListener("click", async () => {
    if (confirm("هل أنت متأكد من حذف جميع البيانات\nهذه عملية لا يمكن التراجع عنها!")) {
        try {
            const transaction = db.transaction(["contacts"], "readwrite");
            const store = transaction.objectStore("contacts");
            store.clear();
            
            transaction.oncomplete = () => {
                contacts = [];
                displayContacts();
                showToast("تم حذف جميع البيانات");
            };
            
            transaction.onerror = () => {
                showToast("حدث خطأ في حذف البيانات", "error");
            };
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
});

// تفعيل وضع التحديد
selectBtn.addEventListener("click", () => {
    selectionMode = !selectionMode;
    selectedIds.clear();
    selectBtn.classList.toggle("active");
    bulkActionsPanel.classList.toggle("hidden");
    displayContacts();
});

// إلغاء التحديد
cancelSelectBtn.addEventListener("click", () => {
    selectionMode = false;
    selectedIds.clear();
    selectBtn.classList.remove("active");
    bulkActionsPanel.classList.add("hidden");
    displayContacts();
});

// إضافة المحددة للمفضلة
bulkAddFavoriteBtn.addEventListener("click", async () => {
    try {
        for (let id of selectedIds) {
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                contact.favorite = true;
                await saveContact(contact);
            }
        }
        await loadContacts();
        displayContacts();
        showToast("تم إضافة " + selectedIds.size + " للمفضلة");
        selectionMode = false;
        selectedIds.clear();
        selectBtn.classList.remove("active");
        bulkActionsPanel.classList.add("hidden");
    } catch (error) {
        showToast("حدث خطأ: " + error.message, "error");
    }
});

// إزالة المحددة من المفضلة
bulkRemoveFavoriteBtn.addEventListener("click", async () => {
    try {
        for (let id of selectedIds) {
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                contact.favorite = false;
                await saveContact(contact);
            }
        }
        await loadContacts();
        displayContacts();
        showToast("تم إزالة " + selectedIds.size + " من المفضلة");
        selectionMode = false;
        selectedIds.clear();
        selectBtn.classList.remove("active");
        bulkActionsPanel.classList.add("hidden");
    } catch (error) {
        showToast("حدث خطأ: " + error.message, "error");
    }
});

// حذف المحددة
bulkDeleteBtn.addEventListener("click", async () => {
    if (confirm("هل أنت متأكد من حذف " + selectedIds.size + " جهة اتصال؟")) {
        try {
            for (let id of selectedIds) {
                await deleteContactFromDB(id);
            }
            await loadContacts();
            displayContacts();
            showToast("تم حذف " + selectedIds.size + " جهة اتصال");
            selectionMode = false;
            selectedIds.clear();
            selectBtn.classList.remove("active");
            bulkActionsPanel.classList.add("hidden");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
});

// تعديل جماعي
bulkEditBtn.addEventListener("click", () => {
    if (selectedIds.size === 0) {
        showToast("يجب تحديد جهات اتصال أولاً", "error");
        return;
    }
    
    // عرض نافذة التعديل الجماعي
    const bulkEditModal = document.createElement("div");
    bulkEditModal.className = "modal active";
    bulkEditModal.id = "bulkEditModal";
    bulkEditModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="document.getElementById('bulkEditModal').remove()">&times;</span>
            <h2>تعديل جماعي (للمحددة)</h2>
            <form id="bulkEditForm">
                <div class="form-group">
                    <label>الوظيفة:</label>
                    <input type="text" id="bulkJobTitle" placeholder="الوظيفة (اختياري)">
                </div>
                <div class="form-group">
                    <label>الكنية:</label>
                    <input type="text" id="bulkNickname" placeholder="الكنية (اختياري)">
                </div>
                <div class="form-group">
                    <label>الفئة:</label>
                    <select id="bulkCategory">
                        <option value="">بدون تغيير</option>
                        <option value="عائلة">عائلة</option>
                        <option value="أصدقاء">أصدقاء</option>
                        <option value="عمل">عمل</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">تطبيق</button>
            </form>
        </div>
    `;
    document.body.appendChild(bulkEditModal);
    
    document.getElementById("bulkEditForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const jobTitle = document.getElementById("bulkJobTitle").value;
        const nickname = document.getElementById("bulkNickname").value;
        const category = document.getElementById("bulkCategory").value;
        
        try {
            for (let id of selectedIds) {
                const contact = contacts.find(c => c.id === id);
                if (contact) {
                    if (jobTitle) contact.jobTitle = jobTitle;
                    if (nickname) contact.nickname = nickname;
                    if (category) contact.category = category;
                    await saveContact(contact);
                }
            }
            await loadContacts();
            displayContacts();
            showToast("تم تعديل " + selectedIds.size + " جهة اتصال");
            document.getElementById("bulkEditModal").remove();
            selectionMode = false;
            selectedIds.clear();
            selectBtn.classList.remove("active");
            bulkActionsPanel.classList.add("hidden");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    });
});

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

// متغيرات للمفضلة
const searchFavorites = document.getElementById("searchFavorites");
const categoryFilterFavorites = document.getElementById("categoryFilterFavorites");
const selectBtnFavorites = document.getElementById("selectBtnFavorites");
const deleteFavoritesBtn = document.getElementById("deleteFavoritesBtn");
const bulkActionsPanelFavorites = document.getElementById("bulkActionsPanelFavorites");
const selectedCountFavorites = document.getElementById("selectedCountFavorites");
const cancelSelectBtnFavorites = document.getElementById("cancelSelectBtnFavorites");
const bulkRemoveFavoriteBtnFav = document.getElementById("bulkRemoveFavoriteBtnFav");
const bulkDeleteBtnFav = document.getElementById("bulkDeleteBtnFav");

let selectionModeFavorites = false;
let selectedIdsFavorites = new Set();

// البحث في المفضلة
searchFavorites.addEventListener("input", () => {
    const searchTerm = searchFavorites.value.toLowerCase();
    const categoryFilter = categoryFilterFavorites.value;
    
    const filtered = contacts.filter(c => {
        const matchesSearch = c.firstName.toLowerCase().includes(searchTerm) || 
                            c.lastName.toLowerCase().includes(searchTerm) ||
                            c.phone.includes(searchTerm) ||
                            c.email.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === "الكل" || c.category === categoryFilter;
        return c.favorite && matchesSearch && matchesCategory;
    });
    
    if (filtered.length === 0) {
        favoritesList.innerHTML = '<div class="empty-state">لا توجد نتائج</div>';
        return;
    }
    
    displayFilteredFavorites(filtered);
});

// تصفية المفضلة حسب الفئة
categoryFilterFavorites.addEventListener("change", () => {
    const searchTerm = searchFavorites.value.toLowerCase();
    const categoryFilter = categoryFilterFavorites.value;
    
    const filtered = contacts.filter(c => {
        const matchesSearch = c.firstName.toLowerCase().includes(searchTerm) || 
                            c.lastName.toLowerCase().includes(searchTerm) ||
                            c.phone.includes(searchTerm) ||
                            c.email.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryFilter === "الكل" || c.category === categoryFilter;
        return c.favorite && matchesSearch && matchesCategory;
    });
    
    if (filtered.length === 0) {
        favoritesList.innerHTML = '<div class="empty-state">لا توجد نتائج</div>';
        return;
    }
    
    displayFilteredFavorites(filtered);
});

// عرض المفضلة المصفاة
function displayFilteredFavorites(favorites) {
    favoritesList.innerHTML = favorites.map(contact => `
        <div class="contact-card favorite ${selectedIdsFavorites.has(contact.id) ? 'selected' : ''}">
            <div class="card-header">
                <div class="card-title-section">
                    ${selectionModeFavorites ? `<input type="checkbox" class="contact-checkbox-fav" data-id="${contact.id}" ${selectedIdsFavorites.has(contact.id) ? 'checked' : ''}>` : ''}
                    <div class="contact-name">${contact.firstName} ${contact.lastName}</div>
                    ${contact.nickname ? `<div class="contact-nickname">(${contact.nickname})</div>` : ''}
                </div>
                <div class="contact-category-badge">${contact.category}</div>
            </div>
            <div class="card-body">
                ${contact.jobTitle ? `<div class="contact-job"><strong>💼</strong> ${contact.jobTitle}</div>` : ''}
                <div class="contact-phone"><strong>📱</strong> <a href="tel:${contact.phone}">${contact.phone}</a></div>
                <div class="contact-email"><strong>📧</strong> <a href="mailto:${contact.email}">${contact.email}</a></div>
            </div>
            <div class="card-footer">
                <button class="action-btn edit-btn" onclick="editContact(${contact.id})">✏️ تعديل</button>
                <button class="action-btn favorite-btn active" onclick="toggleFavorite(${contact.id})">❤️ إزالة</button>
                <button class="action-btn delete-btn" onclick="deleteContact(${contact.id})">🗑️ حذف</button>
            </div>
        </div>
    `).join("");
    
    // إضافة مستمعات الاختيار
    if (selectionModeFavorites) {
        document.querySelectorAll(".contact-checkbox-fav").forEach(checkbox => {
            checkbox.addEventListener("change", (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedIdsFavorites.add(id);
                } else {
                    selectedIdsFavorites.delete(id);
                }
                updateSelectedCountFavorites();
            });
        });
    }
}

// تحديث عداد المحددة في المفضلة
function updateSelectedCountFavorites() {
    selectedCountFavorites.textContent = "تم تحديد " + selectedIdsFavorites.size;
}

// تفعيل وضع التحديد في المفضلة
selectBtnFavorites.addEventListener("click", () => {
    selectionModeFavorites = !selectionModeFavorites;
    selectedIdsFavorites.clear();
    selectBtnFavorites.classList.toggle("active");
    bulkActionsPanelFavorites.classList.toggle("hidden");
    displayFavorites();
});

// إلغاء التحديد في المفضلة
cancelSelectBtnFavorites.addEventListener("click", () => {
    selectionModeFavorites = false;
    selectedIdsFavorites.clear();
    selectBtnFavorites.classList.remove("active");
    bulkActionsPanelFavorites.classList.add("hidden");
    displayFavorites();
});

// إزالة المحددة من المفضلة
bulkRemoveFavoriteBtnFav.addEventListener("click", async () => {
    try {
        for (let id of selectedIdsFavorites) {
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                contact.favorite = false;
                await saveContact(contact);
            }
        }
        await loadContacts();
        displayFavorites();
        showToast("تم إزالة " + selectedIdsFavorites.size + " من المفضلة");
        selectionModeFavorites = false;
        selectedIdsFavorites.clear();
        selectBtnFavorites.classList.remove("active");
        bulkActionsPanelFavorites.classList.add("hidden");
    } catch (error) {
        showToast("حدث خطأ: " + error.message, "error");
    }
});

// حذف المحددة من المفضلة
bulkDeleteBtnFav.addEventListener("click", async () => {
    if (confirm("هل أنت متأكد من حذف " + selectedIdsFavorites.size + " جهة اتصال؟")) {
        try {
            for (let id of selectedIdsFavorites) {
                await deleteContactFromDB(id);
            }
            await loadContacts();
            displayFavorites();
            showToast("تم حذف " + selectedIdsFavorites.size + " جهة اتصال");
            selectionModeFavorites = false;
            selectedIdsFavorites.clear();
            selectBtnFavorites.classList.remove("active");
            bulkActionsPanelFavorites.classList.add("hidden");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
});

// حذف جميع المفضلة
deleteFavoritesBtn.addEventListener("click", async () => {
    const favCount = contacts.filter(c => c.favorite).length;
    if (favCount === 0) {
        showToast("لا توجد جهات مفضلة للحذف", "error");
        return;
    }
    
    if (confirm("هل أنت متأكد من حذف جميع المفضلة؟")) {
        try {
            for (let contact of contacts.filter(c => c.favorite)) {
                contact.favorite = false;
                await saveContact(contact);
            }
            await loadContacts();
            displayFavorites();
            showToast("تم إزالة جميع المفضلة");
        } catch (error) {
            showToast("حدث خطأ: " + error.message, "error");
        }
    }
});

// التنقل بين التابات
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const tabName = btn.dataset.tab;
        
        navBtns.forEach(b => b.classList.remove("active"));
        tabs.forEach(t => t.classList.remove("active"));
        
        btn.classList.add("active");
        document.getElementById(tabName).classList.add("active");
        
        // إخفاء عناصر التحكم عند الانتقال للمفضلة
        const controls = document.querySelector("#contacts .controls");
        const bulkPanel = document.querySelector("#bulkActionsPanel");
        if (tabName === "favorites") {
            if (controls) controls.style.display = "none";
            if (bulkPanel) bulkPanel.style.display = "none";
            displayFavorites();
        } else if (tabName === "contacts") {
            if (controls) controls.style.display = "flex";
            if (bulkPanel && selectionMode) bulkPanel.style.display = "flex";
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

// عرض رسالة Toast
function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast show";
    if (type === "error") {
        toast.style.background = "#e74c3c";
    } else {
        toast.style.background = "#27ae60";
    }
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// شاشة البداية
enterBtn.addEventListener("click", () => {
    splashScreen.style.display = "none";
    mainApp.classList.remove("hidden");
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
