# 🔥 ZamonAI Firebase Backend Setup Guide

## 🚀 **Complete Firebase Backend Implementation**

This project now includes a **complete Firebase backend** with:

- ✅ **Authentication** (Email/Password)
- ✅ **Firestore Database** with proper schema
- ✅ **Real-time progress tracking**
- ✅ **Achievement system**
- ✅ **Course management**
- ✅ **User enrollment system**
- ✅ **Security rules**

## 📋 **Setup Instructions**

### 1. **Install Dependencies**

```bash
npm install firebase
```

### 2. **Firebase Console Setup**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `sarmolessons`
3. Enable the following services:

#### **Authentication**
- Go to Authentication > Sign-in method
- Enable **Email/Password** authentication
- Optionally enable **Anonymous** for guest users

#### **Firestore Database**
- Go to Firestore Database
- Create database in **production mode**
- Apply the security rules from `firestore.rules`

#### **Storage** (Optional)
- Enable Firebase Storage for course images/videos
- Set up appropriate storage rules

### 3. **Database Structure**

The following collections will be created automatically:

```
📁 Firestore Collections:
├── 👥 users/              # User profiles and stats
├── 📚 courses/            # Course catalog
├── 📖 lessons/            # Individual lessons
├── 🎓 enrollments/        # User course enrollments
├── 📊 lessonProgress/     # Lesson completion tracking
├── 🏆 achievements/       # Available achievements
├── 🎯 userAchievements/   # User unlocked achievements
├── 📈 weeklyActivity/     # User learning activity
├── 💾 learningSessions/   # Learning session logs
└── 👑 admins/             # Admin user roles
```

### 4. **Security Rules**

Copy the content from `firestore.rules` to your Firebase Console:

1. Go to Firestore Database > Rules
2. Replace existing rules with the content from `firestore.rules`
3. Publish the rules

### 5. **Sample Data Setup**

To add sample courses and content to your database, use Firebase Console:

#### **Sample Courses**
```javascript
// Add these to the 'courses' collection
{
  title: "Sun'iy intellekt asoslari",
  description: "AI texnologiyalari bilan tanishing",
  shortDescription: "AI asoslari va tushunchalar",
  level: "Boshlang'ich",
  category: "AI Asoslari",
  thumbnailUrl: "/placeholder.svg",
  duration: 360,
  lessonCount: 12,
  enrollmentCount: 0,
  rating: 4.8,
  tags: ["AI", "Boshlang'ich"],
  instructor: {
    id: "instructor1",
    name: "Alisher Isaev",
    title: "AI mutaxassisi",
    bio: "5 yillik tajribaga ega AI mutaxassisi",
    expertise: ["Machine Learning", "Deep Learning"],
    yearsOfExperience: 5
  },
  prerequisites: [],
  learningOutcomes: ["AI asoslarini o'rganish"],
  isPublished: true,
  isFeatured: true,
  price: 0,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

#### **Sample Achievements**
```javascript
// Add these to the 'achievements' collection
{
  title: "Birinchi dars",
  description: "Birinchi darsni muvaffaqiyatli tugatdingiz",
  iconUrl: "/achievements/first-lesson.svg",
  type: "lesson_completion",
  criteria: {
    type: "lesson_completion",
    target: 1
  },
  points: 10,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z"
}
```

## 🔧 **Key Features Implemented**

### **Authentication System**
- User registration with email/password
- User login/logout
- Profile management
- Password reset functionality

### **Course Management**
- Course catalog with filtering
- Course enrollment system
- Progress tracking per course
- Lesson completion tracking

### **Progress & Analytics**
- Real-time progress updates
- Weekly activity tracking
- Learning session logs
- Achievement system

### **User Interface Integration**
- Custom React hooks for data management
- Loading states and error handling
- Real-time updates
- Toast notifications

## 🎯 **Usage Examples**

### **Authentication**
```typescript
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { signIn, user, loading } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      // User logged in successfully
    }
  };
}
```

### **Course Data**
```typescript
import { useFeaturedCourses } from '@/hooks/useCourses';

function Homepage() {
  const { courses, loading, error } = useFeaturedCourses(3);
  
  return (
    <div>
      {loading ? <Spinner /> : courses.map(course => 
        <CourseCard key={course.id} course={course} />
      )}
    </div>
  );
}
```

### **Progress Tracking**
```typescript
import { useCourseProgress } from '@/hooks/useProgress';

function LessonPage({ courseId, lessonId }) {
  const { progress, completeLesson } = useCourseProgress(courseId);
  
  const handleLessonComplete = async () => {
    const result = await completeLesson(lessonId, 30); // 30 minutes
    if (result.success) {
      // Lesson marked as complete
    }
  };
}
```

## 🛡️ **Security Features**

- **Row-level security** - Users can only access their own data
- **Admin role system** - Separate permissions for course management
- **Input validation** - Server-side data validation
- **Authentication required** - Protected routes and operations

## 📱 **Mobile Optimization**

- **Offline support** (via Firebase caching)
- **Real-time sync** across devices
- **Optimized for Telegram Mini Apps**
- **Progressive Web App** capabilities

## 🚀 **Development Workflow**

1. **Start the app**: `npm run dev`
2. **Authentication**: Users can register/login
3. **Browse courses**: View featured and all courses
4. **Enroll**: Users can enroll in courses
5. **Learn**: Track progress through lessons
6. **Achievements**: Unlock achievements automatically

## 🔄 **Data Flow**

```
User Registration → Firebase Auth → User Document Created
Course Enrollment → Enrollment Document → Progress Tracking
Lesson Completion → Progress Update → Achievement Check
Real-time Updates → UI Refresh → User Notification
```

## 📞 **Support**

For any issues with the Firebase setup:

1. Check Firebase Console for errors
2. Verify security rules are applied
3. Ensure all collections have proper indexes
4. Check network connectivity

## 🎉 **You're Ready!**

Your ZamonAI app now has a **complete, production-ready Firebase backend**! 

Run `npm run dev` and start exploring the features:
- Register a new account
- Browse courses
- Enroll in courses
- Track your progress
- Unlock achievements

**Happy Learning! 🚀** 