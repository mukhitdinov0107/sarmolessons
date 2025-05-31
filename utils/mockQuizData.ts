import { Quiz, Question } from '@/lib/types/index';

// Simple ID generator function
function generateId(prefix: string = 'mock'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Generates a mock quiz with configurable parameters
 * @param lessonId The ID of the lesson this quiz belongs to
 * @param questionCount Number of questions to generate (default: 3)
 * @param passingScore The passing score percentage (default: 70)
 * @returns A mock Quiz object
 */
export function generateMockQuiz(lessonId: string, questionCount: number = 3, passingScore: number = 70): Quiz {
  const questions: Question[] = [];
  
  // Generate multiple choice questions
  for (let i = 0; i < questionCount; i++) {
    const questionType = i % 3 === 0 ? 'multiple-choice' : 
                         i % 3 === 1 ? 'true-false' : 'text';
    
    const question: Question = {
      id: generateId('question'),
      type: questionType as 'multiple-choice' | 'true-false' | 'text',
      question: `Test savol #${i + 1}?`,
      points: 10,
      correctAnswer: ''
    };
    
    // Set options and correct answer based on question type
    if (questionType === 'multiple-choice') {
      question.options = [
        'Javob A',
        'Javob B',
        'Javob C',
        'Javob D'
      ];
      question.correctAnswer = question.options[0]; // First option is correct
    } else if (questionType === 'true-false') {
      question.options = ['To\'g\'ri', 'Noto\'g\'ri'];
      question.correctAnswer = 'To\'g\'ri';
    } else {
      // Text question
      question.correctAnswer = 'to\'g\'ri javob';
    }
    
    questions.push(question);
  }
  
  return {
    id: generateId('quiz'),
    lessonId: lessonId,
    title: 'Test savollari',
    description: 'Ushbu testni muvaffaqiyatli topshirish uchun kamida 70% to\'g\'ri javob berishingiz kerak.',
    questions,
    passingScore,
    timeLimit: 5 // 5 minutes
  };
}

/**
 * Adds a mock quiz to a lesson object
 * @param lesson The lesson object to add a quiz to
 * @returns The lesson with an added quiz
 */
export function addMockQuizToLesson(lesson: any): any {
  if (!lesson) return lesson;
  
  // Create a copy of the lesson to avoid mutating the original
  const lessonWithQuiz = { ...lesson };
  
  // Add a quiz if it doesn't already have one
  if (!lessonWithQuiz.quiz) {
    lessonWithQuiz.quiz = generateMockQuiz(lessonWithQuiz.id || '');
    console.log('[MockData] Added mock quiz to lesson:', lessonWithQuiz.id);
  }
  
  return lessonWithQuiz;
}

/**
 * Utility function to add mock quizzes to all lessons in a course
 * @param course The course object to add quizzes to
 * @returns The course with quizzes added to all lessons
 */
export function addMockQuizzesToCourse(course: any): any {
  if (!course || !course.lessons) return course;
  
  // Create a copy of the course to avoid mutating the original
  const courseWithQuizzes = { 
    ...course,
    lessons: course.lessons.map((lesson: any) => addMockQuizToLesson(lesson))
  };
  
  console.log('[MockData] Added mock quizzes to all lessons in course:', course.id);
  return courseWithQuizzes;
}
