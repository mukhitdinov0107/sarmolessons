import { Quiz, Question } from '@/lib/types/index';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// Topic categories for AI quizzes
type AITopic = 
  | 'ai_basics' 
  | 'machine_learning' 
  | 'deep_learning' 
  | 'nlp' 
  | 'computer_vision' 
  | 'ethics';

/**
 * Generates an ID using a timestamp and random string
 */
function generateId(prefix: string = 'quiz'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Dictionary of AI-related questions by topic
 */
const AI_QUESTIONS: Record<AITopic, Question[]> = {
  // AI Basics questions
  ai_basics: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Sun\'iy intellekt (AI) nima?',
      options: [
        'Insonlar kabi fikrlash va o\'rganish qobiliyatiga ega bo\'lgan kompyuter tizimlari',
        'Faqat ma\'lumotlarni saqlash uchun mo\'ljallangan dasturlar',
        'Internetga ulangan har qanday qurilma',
        'Kompyuter o\'yinlarini boshqarish uchun ishlatiladigan tizim'
      ],
      correctAnswer: 'Insonlar kabi fikrlash va o\'rganish qobiliyatiga ega bo\'lgan kompyuter tizimlari',
      explanation: 'Sun\'iy intellekt insonlar kabi ma\'lumotlardan o\'rganish, mulohaza yuritish va muammolarni hal qilish qobiliyatiga ega bo\'lgan kompyuter tizimlaridir.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Turing testi sun\'iy intellektning inson kabi fikrlash qobiliyatini baholash uchun ishlatiladi.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'To\'g\'ri',
      explanation: 'Alan Turing tomonidan taklif qilingan Turing testi, kompyuter tizimi insondan ajratib bo\'lmaydigan darajada muloqot qila olishini baholaydi.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Quyidagilardan qaysi biri sun\'iy intellektning keng qo\'llanilish sohasiga kirmaydi?',
      options: [
        'Ovoz yordamchilari (Siri, Alexa)',
        'Tibbiy tashxis',
        'Haydovchisiz transport vositalari',
        'Qo\'l bilan yozilgan hujjatlarni raqamlashtirish'
      ],
      correctAnswer: 'Qo\'l bilan yozilgan hujjatlarni raqamlashtirish',
      explanation: 'Qo\'l bilan yozilgan hujjatlarni raqamlashtirish uchun OCR texnologiyasi ishlatiladi, bu sun\'iy intellekt qo\'llanilishidan ko\'ra ko\'proq raqamli tasvir qayta ishlash texnologiyasidir.',
      points: 10
    }
  ],
  
  // Machine Learning questions
  machine_learning: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Mashina o\'rganishining asosiy turlari qaysilar?',
      options: [
        'Nazorat qilinadigan, nazorat qilinmaydigan va kuchaytirilgan o\'rganish',
        'Strukturaviy, funktsional va obyektiv o\'rganish',
        'Nazariy, amaliy va eksperimental o\'rganish',
        'Matematik, statistik va algoritm o\'rganishi'
      ],
      correctAnswer: 'Nazorat qilinadigan, nazorat qilinmaydigan va kuchaytirilgan o\'rganish',
      explanation: 'Mashina o\'rganishining uchta asosiy turi: nazorat qilinadigan (belgilangan ma\'lumotlar asosida o\'rganish), nazorat qilinmaydigan (belgilanmagan ma\'lumotlarda naqshlarni topish) va kuchaytirilgan o\'rganish (sinov-xato orqali o\'rganish).',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Quyidagilardan qaysi biri nazorat qilinadigan o\'rganish algoritmi?',
      options: [
        'Chiziqli regressiya',
        'K-means klasterlash',
        'Asosiy komponent tahlili (PCA)',
        'Q-o\'rganish'
      ],
      correctAnswer: 'Chiziqli regressiya',
      explanation: 'Chiziqli regressiya - bu nazorat qilinadigan o\'rganish algoritmi bo\'lib, u belgilangan ma\'lumotlar asosida chiziqli munosabatlarni o\'rganadi.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Nazorat qilinmaydigan o\'rganish algoritmlari ma\'lumotlar to\'plamidagi yashirin tuzilmalarni aniqlash uchun ishlatiladi.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'To\'g\'ri',
      explanation: 'Nazorat qilinmaydigan o\'rganish algoritmlari, ma\'lumotlardagi o\'xshashliklar va farqlarni aniqlash orqali, belgilanmagan ma\'lumotlardagi yashirin tuzilmalarni topish uchun ishlatiladi.',
      points: 10
    }
  ],
  
  // Deep Learning questions
  deep_learning: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Chuqur o\'rganish qaysi texnologiyaga asoslangan?',
      options: [
        'Sun\'iy neyron tarmoqlari',
        'Genetik algoritmlar',
        'Ehtimoliy mantiq',
        'Ekspert tizimlar'
      ],
      correctAnswer: 'Sun\'iy neyron tarmoqlari',
      explanation: 'Chuqur o\'rganish ko\'p qatlamli sun\'iy neyron tarmoqlariga asoslangan bo\'lib, ular murakkab tasvirlarni tanish va til bilan ishlash kabi vazifalar uchun juda samarali.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Konvolyutsion neyron tarmoqlari (CNN) asosan qaysi sohalarda ishlatiladi?',
      options: [
        'Tasvirlarni tanib olish va kompyuter ko\'rishi',
        'Tabiiy tilni qayta ishlash',
        'Moliyaviy bashorat qilish',
        'Robotlarni boshqarish'
      ],
      correctAnswer: 'Tasvirlarni tanib olish va kompyuter ko\'rishi',
      explanation: 'CNNlar asosan tasvirlarni tanib olish, tasnif qilish va kompyuter ko\'rishi kabi sohalarda ishlatiladi, chunki ular tasvirlardagi fazoviy xususiyatlarni samarali ravishda o\'rganadi.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Rekurrent neyron tarmoqlari (RNN) ketma-ket ma\'lumotlar bilan ishlash uchun mo\'ljallangan.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'To\'g\'ri',
      explanation: 'RNNlar ketma-ket ma\'lumotlar (matn, ovoz, vaqt seriyali ma\'lumotlar) bilan ishlash uchun mo\'ljallangan, chunki ular avvalgi holatlar haqidagi ma\'lumotlarni saqlash qobiliyatiga ega.',
      points: 10
    }
  ],
  
  // NLP questions
  nlp: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Tabiiy tilni qayta ishlash (NLP) nima?',
      options: [
        'Kompyuterlarni inson tilini tushunish va qayta ishlash qobiliyati',
        'Kompyuter dasturlash tillarini yaratish jarayoni',
        'Ovozli buyruqlarni raqamli signallarga aylantirish',
        'Turli xil tabiiy tillarni tarjima qilish jarayoni'
      ],
      correctAnswer: 'Kompyuterlarni inson tilini tushunish va qayta ishlash qobiliyati',
      explanation: 'NLP kompyuterlar va insonlar o\'rtasidagi muloqotni yaxshilash uchun kompyuterlarni inson tilini tushunish va qayta ishlash qobiliyatidir.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Quyidagilardan qaysi biri NLP ilovasi emas?',
      options: [
        'Tasvirlarni tasnif qilish',
        'Sentiment tahlil',
        'Mashina tarjimasi',
        'Matnni nutqqa aylantirish'
      ],
      correctAnswer: 'Tasvirlarni tasnif qilish',
      explanation: 'Tasvirlarni tasnif qilish kompyuter ko\'rishi sohasiga tegishli bo\'lib, NLP emas, chunki u til bilan emas, balki vizual ma\'lumotlar bilan ishlaydi.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Word embedding so\'zlarni raqamli vektorlarga aylantirish usulidir.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'To\'g\'ri',
      explanation: 'Word embedding so\'zlarni semantik ma\'nolarini saqlaydigan raqamli vektorlarga aylantirish usulidir, bu kompyuterlarga so\'zlar o\'rtasidagi munosabatlarni tushunishga yordam beradi.',
      points: 10
    }
  ],
  
  // Computer Vision questions
  computer_vision: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Kompyuter ko\'rishi nima?',
      options: [
        'Kompyuterlarga tasvirlar va videolarni ko\'rish va tushunish imkonini beradigan sun\'iy intellekt sohasi',
        'Kameralarda ishlatiladigan yangi optik texnologiya',
        'Virtual va kengaytirilgan haqiqatni yaratish uchun ishlatiladigan dasturiy ta\'minot',
        'Kompyuter monitorlari uchun ishlatiladigan yuqori aniqlikdagi displeylar'
      ],
      correctAnswer: 'Kompyuterlarga tasvirlar va videolarni ko\'rish va tushunish imkonini beradigan sun\'iy intellekt sohasi',
      explanation: 'Kompyuter ko\'rishi - bu kompyuterlarga raqamli tasvirlar va videolardagi ma\'lumotlarni olish, qayta ishlash, tahlil qilish va tushunish imkonini beradigan sun\'iy intellekt sohasidir.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Quyidagilardan qaysi biri kompyuter ko\'rishi vazifasi emas?',
      options: [
        'Ovozni tanib olish',
        'Ob\'ektlarni aniqlash',
        'Tasvirlarni segmentatsiya qilish',
        'Yuzni tanib olish'
      ],
      correctAnswer: 'Ovozni tanib olish',
      explanation: 'Ovozni tanib olish audio ma\'lumotlar bilan ishlaydi va tabiiy tilni qayta ishlash sohasiga tegishli, kompyuter ko\'rishi emas, chunki u vizual ma\'lumotlar emas.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Chuqur o\'rganish algoritmlari zamonaviy kompyuter ko\'rishi tizimlarining asosiy qismidir.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'To\'g\'ri',
      explanation: 'Chuqur o\'rganish, ayniqsa konvolyutsion neyron tarmoqlari (CNN), tasvirlarni tanib olish va tasniflash uchun yuqori aniqlikka erishganligi sababli zamonaviy kompyuter ko\'rishi tizimlarining asosiy komponentidir.',
      points: 10
    }
  ],
  
  // AI Ethics questions
  ethics: [
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Sun\'iy intellekt axloqida quyidagi asosiy muammolardan qaysi biri muhokama qilinadi?',
      options: [
        'Xolis bo\'lmagan ma\'lumotlar tufayli algoritm diskriminatsiyasi',
        'Kompyuterlarning energiya samaradorligi',
        'Dasturiy ta\'minot litsenziyalash xarajatlari',
        'Dasturchilar uchun ish-hayot muvozanati'
      ],
      correctAnswer: 'Xolis bo\'lmagan ma\'lumotlar tufayli algoritm diskriminatsiyasi',
      explanation: 'AI tizimlari o\'quv ma\'lumotlaridagi noto\'g\'ri fikrlarni o\'zlashtirishi mumkin, bu esa algoritm xolisligiga va adolatliligiga ta\'sir qiladi, bu esa muhim axloqiy muammodir.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'true-false',
      question: 'Sun\'iy intellekt texnologiyasi hech qanday axloqiy nazoratga muhtoj emas, chunki u faqat dasturlash mantiqiga amal qiladi.',
      options: ['To\'g\'ri', 'Noto\'g\'ri'],
      correctAnswer: 'Noto\'g\'ri',
      explanation: 'Sun\'iy intellekt texnologiyasi, ayniqsa u jamiyatga ta\'sir qilsa, adolat, xavfsizlik, shaffoflik va mas\'uliyat kabi jihatlarni ta\'minlash uchun axloqiy ko\'rib chiqish va nazoratga muhtoj.',
      points: 10
    },
    {
      id: generateId('q'),
      type: 'multiple-choice',
      question: 'Sun\'iy intellektning axloqiy ishlab chiqilishi uchun kim javobgar?',
      options: [
        'Hammasi: ishlab chiquvchilar, kompaniyalar, hukumat va jamiyat',
        'Faqat AI ishlab chiquvchilari',
        'Faqat foydalanuvchilar',
        'Faqat hukumat organlari'
      ],
      correctAnswer: 'Hammasi: ishlab chiquvchilar, kompaniyalar, hukumat va jamiyat',
      explanation: 'Sun\'iy intellektni axloqiy jihatdan ishlab chiqish va qo\'llash uchun mas\'uliyat birgalikda yuritiladi. Manfaatdor tomonlarning har biri – ishlab chiquvchilar, kompaniyalar, hukumat va jamiyat muhim rol o\'ynaydi.',
      points: 10
    }
  ]
};

/**
 * Returns quiz questions for a given AI topic
 * @param topic AI topic category
 * @param count Number of questions to return (default: 3)
 * @returns Array of questions for the specified topic
 */
function getQuestionsForTopic(topic: AITopic, count: number = 3): Question[] {
  const availableQuestions = AI_QUESTIONS[topic];
  
  // If we don't have enough questions, return all available
  if (availableQuestions.length <= count) {
    return [...availableQuestions];
  }
  
  // Randomly select 'count' number of questions
  const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Determines the most appropriate topic based on lesson content/title
 * @param lesson The lesson to analyze
 * @returns The most appropriate AI topic for the lesson
 */
function determineTopicForLesson(lesson: any): AITopic {
  const title = (lesson.title || '').toLowerCase();
  const description = (lesson.description || '').toLowerCase();
  const content = (lesson.content || '').toLowerCase();
  
  const combinedText = `${title} ${description} ${content}`;
  
  // Simple keyword matching for topic determination
  const topicKeywords: Record<AITopic, string[]> = {
    ai_basics: ['asoslar', 'asosiy', 'kirish', 'tarix', 'tushuncha', 'nima', 'introduction', 'basics'],
    machine_learning: ['mashina', 'o\'rganish', 'algoritm', 'regression', 'klassifikatsiya', 'machine learning', 'ml'],
    deep_learning: ['chuqur', 'neyron', 'tarmoq', 'neural', 'deep', 'cnn', 'rnn', 'lstm'],
    nlp: ['tabiiy til', 'til', 'matn', 'language', 'nlp', 'sentiment', 'tarjima', 'translation'],
    computer_vision: ['ko\'rish', 'tasvir', 'video', 'image', 'vision', 'face', 'object', 'detection'],
    ethics: ['axloq', 'etika', 'xavfsizlik', 'mas\'uliyat', 'ethics', 'bias', 'privacy', 'security']
  };
  
  // Count keyword matches for each topic
  const topicScores = Object.entries(topicKeywords).map(([topic, keywords]) => {
    const score = keywords.reduce((count, keyword) => {
      return count + (combinedText.includes(keyword) ? 1 : 0);
    }, 0);
    
    return { topic: topic as AITopic, score };
  });
  
  // Sort by score and get the highest
  topicScores.sort((a, b) => b.score - a.score);
  
  // If no strong match, default to AI basics
  return topicScores[0].score > 0 ? topicScores[0].topic : 'ai_basics';
}

/**
 * Creates a quiz for a lesson based on its content
 * @param lesson The lesson to create a quiz for
 * @param questionCount Number of questions to include (default: 3)
 * @param passingScore Passing score percentage (default: 70)
 * @returns A Quiz object tailored to the lesson
 */
export function createQuizForLesson(lesson: any, questionCount: number = 3, passingScore: number = 70): Quiz {
  // Determine the best topic for this lesson
  const topic = determineTopicForLesson(lesson);
  console.log(`[QuizGenerator] Determined topic '${topic}' for lesson: ${lesson.title}`);
  
  // Get questions for the topic
  const questions = getQuestionsForTopic(topic, questionCount);
  
  // Create and return the quiz
  return {
    id: generateId('quiz'),
    lessonId: lesson.id,
    title: 'Bilimingizni tekshiring',
    description: 'Ushbu darsdan o\'tilgan materiallarni yaxshi o\'zlashtirishingiz uchun quyidagi savollarni to\'g\'ri javoblar bilan to\'ldiring.',
    questions,
    passingScore,
    timeLimit: 5 // 5 minutes
  };
}

/**
 * Adds quizzes to all lessons in a course in the database
 * @param courseId ID of the course to update
 * @returns Promise that resolves when all lessons have been updated
 */
export async function addQuizzesToCourse(courseId: string): Promise<boolean> {
  try {
    console.log(`[QuizGenerator] Adding quizzes to course: ${courseId}`);
    
    // Get the course document from Firestore
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      console.error(`[QuizGenerator] Course not found: ${courseId}`);
      return false;
    }
    
    const courseData = courseDoc.data();
    const lessons = courseData.lessons || [];
    
    if (lessons.length === 0) {
      console.log(`[QuizGenerator] No lessons found in course: ${courseId}`);
      return false;
    }
    
    console.log(`[QuizGenerator] Found ${lessons.length} lessons in course`);
    
    // Create and add quiz to each lesson
    let updatedLessons = lessons.map((lesson: any) => {
      // Only add a quiz if the lesson doesn't already have one
      if (!lesson.quiz) {
        const quiz = createQuizForLesson(lesson);
        console.log(`[QuizGenerator] Created quiz for lesson: ${lesson.title}`);
        return { ...lesson, quiz };
      }
      return lesson;
    });
    
    // Update the course document with the new lessons data
    await updateDoc(courseRef, {
      lessons: updatedLessons
    });
    
    console.log(`[QuizGenerator] Successfully added quizzes to all lessons in course: ${courseId}`);
    return true;
  } catch (error) {
    console.error('[QuizGenerator] Error adding quizzes to course:', error);
    return false;
  }
}

/**
 * Get all courses from the database
 * @returns Promise that resolves with an array of course IDs and titles
 */
export async function getAllCourses(): Promise<{ id: string; title: string }[]> {
  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title
    }));
  } catch (error) {
    console.error('[QuizGenerator] Error getting courses:', error);
    return [];
  }
}

/**
 * Add quizzes to all courses in the database
 * @returns Promise that resolves when all courses have been updated
 */
export async function addQuizzesToAllCourses(): Promise<{ success: boolean; coursesUpdated: number }> {
  try {
    const courses = await getAllCourses();
    console.log(`[QuizGenerator] Found ${courses.length} courses`);
    
    let successCount = 0;
    
    for (const course of courses) {
      const success = await addQuizzesToCourse(course.id);
      if (success) {
        successCount++;
      }
    }
    
    return {
      success: successCount > 0,
      coursesUpdated: successCount
    };
  } catch (error) {
    console.error('[QuizGenerator] Error adding quizzes to all courses:', error);
    return {
      success: false,
      coursesUpdated: 0
    };
  }
}
