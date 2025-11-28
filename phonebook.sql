-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS phonebook_db;
USE phonebook_db;

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول جهات الاتصال
CREATE TABLE IF NOT EXISTS contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    category_id INT,
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_phone (phone),
    INDEX idx_category (category_id)
);

-- جدول سجل النشاط
CREATE TABLE IF NOT EXISTS activity_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contact_id INT,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- إدراج الفئات الافتراضية
INSERT INTO categories (name, description) VALUES
('عائلة', 'جهات الاتصال العائلية'),
('أصدقاء', 'جهات الاتصال الأصدقاء'),
('عمل', 'جهات الاتصال العملية');

-- إدراج جهات الاتصال الافتراضية
INSERT INTO contacts (name, phone, email, category_id, is_favorite) VALUES
('فارس محمد عبدالسميع', '+20 100 123 4567', 'ghalwash@mrfa0gh.run.place', 3, FALSE),
('محمود اسامه سعد محمد', '+20 100 234 5678', 'mahmoud@example.com', 2, FALSE),
('حسن اشرف احمد علي محمد', '+20 100 345 6789', 'hassan@example.com', 1, FALSE),
('محمد كرم حمدي عبد المعبود', '+20 100 456 7890', 'mohamad@example.com', 3, FALSE),
('احمد محمد فؤاد محمود', '+20 100 567 8901', 'ahmed@example.com', 2, FALSE),
-- عرض جهات الاتصال مع الفئات
SELECT 
    c.id,
    c.name,
    c.phone,
    c.email,
    cat.name as category,
    c.is_favorite,
    c.created_at
FROM contacts c
LEFT JOIN categories cat ON c.category_id = cat.id
ORDER BY c.name;
