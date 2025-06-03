import { Quiz, Question } from '@/lib/types/index';

// Simple ID generator function
function generateId(prefix: string = 'mock'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

function extractKeywords(content: string): string[] {
  // Simple keyword extraction (in a real app, use NLP or AI)
  const words = content.split(/\s+/)
  const keywords = words.filter(word => 
    word.length > 4 && 
    !['about', 'after', 'again', 'could', 'every', 'first', 'found', 'great', 'where', 'which'].includes(word.toLowerCase())
  )
  return [...new Set(keywords)].slice(0, 20) // Get unique keywords
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
  return {
    ...lesson,
    quiz: lesson.quiz || generateQuizForLesson(lesson.id || '', lesson.title || '', lesson.content || '')
  };
}

/**
 * Utility function to add mock quizzes to all lessons in a course
 * @param course The course object to add quizzes to
 * @returns The course with quizzes added to all lessons
 */
export function addMockQuizzesToCourse(course: any): any {
  if (!course || !course.lessons) return course;
  return {
    ...course,
    lessons: course.lessons.map(lesson => addMockQuizToLesson(lesson))
  };
}

export function generateQuestionsForLesson(lessonContent: string): Question[] {
  const keywords = extractKeywords(lessonContent)
  
  const questionTemplates = [
    {
      template: "What is the significance of %s in this lesson?",
      options: ["It's a fundamental concept", "It's an advanced topic", "It's a supplementary detail", "It's not related to the main topic"]
    },
    {
      template: "How does %s relate to the main topic?",
      options: ["Direct relationship", "Indirect relationship", "Supporting concept", "Contrasting concept"]
    },
    {
      template: "Which best describes the role of %s?",
      options: ["Core component", "Supporting element", "External factor", "Background context"]
    },
    {
      template: "When implementing %s, what should you consider first?",
      options: ["Basic requirements", "Advanced features", "Edge cases", "Performance implications"]
    },
    {
      template: "What is the primary purpose of using %s?",
      options: ["Enhance functionality", "Improve performance", "Ensure reliability", "Maintain compatibility"]
    },
    {
      template: "How would you best implement %s in practice?",
      options: ["Step-by-step approach", "Iterative development", "Rapid prototyping", "Continuous integration"]
    },
    {
      template: "What potential challenges might arise when working with %s?",
      options: ["Technical limitations", "Integration issues", "Performance bottlenecks", "Compatibility problems"]
    },
    {
      template: "Which aspect of %s requires the most attention?",
      options: ["Implementation details", "Design considerations", "Testing requirements", "Maintenance aspects"]
    },
    {
      template: "How does %s impact the overall system?",
      options: ["Fundamental changes", "Minimal impact", "Moderate adjustments", "Significant restructuring"]
    },
    {
      template: "What is the best way to optimize %s?",
      options: ["Performance tuning", "Code refactoring", "Resource management", "Architecture redesign"]
    }
  ];

  return questionTemplates.map((template, index) => {
    const keyword = keywords[index % keywords.length] || 'this concept'
    const question = template.template.replace('%s', keyword)
    const correctAnswer = Math.floor(Math.random() * 4) // Randomly select correct answer

    return {
      id: generateId('q'),
      question,
      options: template.options,
      correctAnswer,
      explanation: `This question tests your understanding of ${keyword} and its role in the lesson. ${template.options[correctAnswer]} is correct because it best describes the relationship between ${keyword} and the main concepts covered.`
    }
  })
}

export function generateQuizForLesson(lessonId: string, lessonTitle: string, lessonContent: string): Quiz {
  return {
    id: `quiz-${lessonId}`,
    title: `Quiz: ${lessonTitle}`,
    questions: generateQuestionsForLesson(lessonContent),
    passingScore: 70 // 7 out of 10 questions correct
  };
}
