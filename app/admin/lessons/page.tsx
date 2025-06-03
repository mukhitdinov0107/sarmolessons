"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Course, Lesson } from "@/lib/types";
import { CourseService } from "@/lib/services/courses";
import { MoreHorizontal, Plus, Pencil, Trash2, FileQuestion } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function LessonsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadLessons(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const coursesData = await CourseService.getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Kurslarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      setLoading(true);
      const lessonsData = await CourseService.getLessonsByCourseId(courseId);
      setLessons(lessonsData);
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Darslarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Haqiqatan ham bu darsni o'chirmoqchimisiz?")) {
      return;
    }

    try {
      await CourseService.deleteLesson(lessonId);
      toast({
        title: "Dars o'chirildi",
        description: "Dars muvaffaqiyatli o'chirildi",
      });
      if (selectedCourseId) {
        loadLessons(selectedCourseId);
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Darsni o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lesson.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Darslar</h1>
        <Button asChild>
          <Link href={`/admin/lessons/new?courseId=${selectedCourseId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Yangi dars
          </Link>
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select
          value={selectedCourseId}
          onValueChange={setSelectedCourseId}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Kursni tanlang" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="published">Nashr qilingan</SelectItem>
            <SelectItem value="archived">Arxivlangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tartib</TableHead>
              <TableHead>Nomi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Davomiyligi</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLessons.map((lesson) => (
              <TableRow key={lesson.id}>
                <TableCell>{lesson.order}</TableCell>
                <TableCell className="font-medium">{lesson.title}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className={`capitalize ${
                      lesson.status === 'published' ? 'text-green-600' :
                      lesson.status === 'draft' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {lesson.status === 'published' ? 'Nashr qilingan' :
                       lesson.status === 'draft' ? 'Qoralama' :
                       'Arxivlangan'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{lesson.duration}</TableCell>
                <TableCell>
                  {lesson.quiz ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-green-600"
                    >
                      <Link href={`/admin/quizzes/${lesson.quiz.id}`}>
                        <FileQuestion className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/quizzes/new?lessonId=${lesson.id}`}>
                        <Plus className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/lessons/${lesson.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Tahrirlash
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteLesson(lesson.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 