# Kurslarni qo'shish bo'yicha qo'llanma

Bu qo'llanma SarmoTraining platformasiga qo'lda kurslarni qo'shish jarayonini tushuntiradi.

## 📁 JSON Fayl Tuzilishi

Kurslar `data/courses.json` faylida saqlanadi. Har bir kurs quyidagi tuzilishga ega:

### 🎓 Kurs Tuzilishi

```json
{
  "id": "unique-course-id",
  "title": "Kurs nomi",
  "description": "Batafsil tavsif",
  "shortDescription": "Qisqa tavsif",
  "instructor": "O'qituvchi ismi",
  "instructorBio": "O'qituvchi haqida ma'lumot",
  "instructorImageUrl": "/instructors/instructor-image.jpg",
  "level": "Boshlang'ich", // "Boshlang'ich" | "O'rta" | "Yuqori"
  "category": "AI", // "AI" | "NLP" | "ML" va boshqalar
  "duration": "6 soat",
  "price": 0, // 0 = bepul, boshqa raqam = pullik
  "currency": "UZS",
  "language": "uz",
  "imageUrl": "/courses/course-image.jpg",
  "videoPreviewUrl": "/courses/previews/preview.mp4",
  "tags": ["AI", "Machine Learning", "Boshlang'ich"],
  "isPublished": true,
  "isFeatured": true,
  "enrollmentCount": 0,
  "rating": 4.8,
  "reviewCount": 124,
  "certificateAvailable": true,
  "estimatedHours": 6,
  "prerequisites": ["Python asoslari"],
  "learningOutcomes": [
    "AI asosiy tushunchalarini tushunish",
    "Machine Learning algoritmlarini bilish"
  ],
  "lessons": [
    // Darslar ro'yxati (pastda batafsil)
  ]
}
```

### 📚 Dars (Lesson) Tuzilishi

```json
{
  "id": "unique-lesson-id",
  "title": "Dars nomi",
  "description": "Dars tavsifi",
  "duration": "30 daqiqa",
  "order": 1,
  "isPublished": true,
  "isFree": true, // true = bepul dars, false = premium
  "videoUrl": "/lessons/course-id/lesson-1.mp4",
  "content": "<h2>Dars kontenti</h2><p>HTML formatida...</p>",
  "attachments": [
    // Qo'shimcha materiallar (pastda batafsil)
  ],
  "links": [
    // Foydali havolalar (pastda batafsil)
  ],
  "quiz": {
    // Quiz savollari (ixtiyoriy)
  }
}
```

### 📎 Qo'shimcha Material (Attachment) Tuzilishi

```json
{
  "id": "attachment-unique-id",
  "name": "Fayl nomi",
  "type": "pdf", // "pdf" | "image" | "excel" | "code" | "video" | "document"
  "url": "/attachments/file-path.pdf",
  "size": "2.5 MB",
  "description": "Fayl haqida qisqa ma'lumot"
}
```

### 🔗 Havola (Link) Tuzilishi

```json
{
  "id": "link-unique-id", 
  "title": "Havola nomi",
  "url": "https://example.com",
  "description": "Havola haqida ma'lumot",
  "type": "external" // "external" | "internal"
}
```

## 🚀 Kurslarni Import Qilish

### 1. JSON Faylni Tayyorlash
1. `data/courses.json` faylini oching
2. Yangi kursni `