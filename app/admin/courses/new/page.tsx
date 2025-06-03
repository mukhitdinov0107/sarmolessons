"use client";

import { CourseForm } from "../components/course-form";

export default function NewCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yangi kurs</h1>
        <p className="text-muted-foreground">
          Yangi kurs yaratish uchun quyidagi formani to'ldiring
        </p>
      </div>
      <CourseForm />
    </div>
  );
} 