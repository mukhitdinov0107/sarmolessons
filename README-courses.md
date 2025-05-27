# Kurslarni qo'shish bo'yicha qo'llanma

Bu qo'llanma ZamonAI platformasiga qo'lda kurslarni qo'shish jarayonini tushuntiradi.

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
2. Yangi kursni `courses` massiviga qo'shing
3. Faylni saqlang

### 2. Import Qilish
1. Brauzerde `/admin/import-courses` sahifasiga o'ting
2. "Kurslarni Import qilish" tugmasini bosing
3. Jarayon tugashini kuting

### 3. Tekshirish
- Kurslar sahifasiga o'ting va yangi kursni ko'ring
- Kurs sahifasini oching va darslarni tekshiring

## 📋 Namuna Kurs

Yangi kurs qo'shish uchun quyidagi namunadan foydalaning:

```json
{
  "id": "yangi-kurs-id",
  "title": "Yangi Kurs Nomi", 
  "description": "Bu yangi kurs haqida batafsil ma'lumot...",
  "shortDescription": "Qisqa tavsif",
  "instructor": "O'qituvchi Ismi",
  "instructorBio": "O'qituvchi tajribasi...",
  "instructorImageUrl": "/instructors/instructor.jpg",
  "level": "Boshlang'ich",
  "category": "AI",
  "duration": "4 soat",
  "price": 0,
  "currency": "UZS",
  "language": "uz",
  "imageUrl": "/courses/yangi-kurs.jpg",
  "tags": ["AI", "Yangi"],
  "isPublished": true,
  "isFeatured": false,
  "enrollmentCount": 0,
  "rating": 5.0,
  "reviewCount": 0,
  "certificateAvailable": true,
  "estimatedHours": 4,
  "prerequisites": [],
  "learningOutcomes": [
    "Birinchi natija",
    "Ikkinchi natija"
  ],
  "lessons": [
    {
      "id": "yangi-kurs-dars-1",
      "title": "Birinchi dars",
      "description": "Kirish darsi",
      "duration": "20 daqiqa",
      "order": 1,
      "isPublished": true,
      "isFree": true,
      "videoUrl": "/lessons/yangi-kurs/dars-1.mp4",
      "content": "<h2>Salom!</h2><p>Bu birinchi dars...</p>",
      "attachments": [
        {
          "id": "attach-1",
          "name": "Dars materiallari",
          "type": "pdf",
          "url": "/attachments/dars-1-materiallar.pdf",
          "size": "1.5 MB",
          "description": "Dars uchun asosiy materiallar"
        }
      ],
      "links": [
        {
          "id": "link-1",
          "title": "Qo'shimcha o'qish",
          "url": "https://example.com/article",
          "description": "Mavzu bo'yicha qo'shimcha maqola",
          "type": "external"
        }
      ]
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## ⚠️ Muhim Eslatmalar

### ID'lar
- Har bir kurs, dars, attachment va link uchun **noyob ID** ishlating
- ID'larda faqat harflar, raqamlar va tire (-) ishlatiladi
- Bo'shliq va maxsus belgilardan saqlaning

### Fayllar
- Video, rasm va attachment fayllarini `public` papkaga joylashtiring
- URL'larda to'g'ri yo'lni ko'rsating (`/courses/image.jpg`)
- Fayl hajmlarini to'g'ri yozing (`2.5 MB` formatida)

### Ma'lumotlar
- `isPublished: true` bo'lgan kurslar faqat ko'rinadi
- `isFree: true` bo'lgan darslarni hamma ko'ra oladi
- `order` maydonini to'g'ri tartibda qo'ying (1, 2, 3...)

### Import
- Import qilishdan oldin JSON sintaksisini tekshiring
- Katta fayllar uchun internet tezligini hisobga oling
- Import jarayoni bir necha daqiqa davom etishi mumkin

## 🔧 Texnik Maslahatlar

1. **JSON Validator** ishlatib syntax xatolarini tekshiring
2. **Fayl yo'llarini** to'g'ri yozishga e'tibor bering
3. **Order** maydonlarini ketma-ket qo'ying
4. **ID'larni** noyob saqlang
5. **Ma'lumotlarni** to'liq kiriting

## 📞 Yordam

Agar qiyinchiliklaringiz bo'lsa, development team bilan bog'laning yoki documentation'ni qarang. 