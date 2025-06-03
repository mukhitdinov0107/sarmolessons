"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Course } from "@/lib/types";
import { CourseService } from "@/lib/services/courses";
import { useAuth } from "@/hooks/useAuth";

const courseSchema = z.object({
  title: z.string().min(1, "Kurs nomi kiritilishi shart"),
  description: z.string().min(1, "Kurs tavsifi kiritilishi shart"),
  shortDescription: z.string().optional(),
  instructor: z.object({
    id: z.string(),
    name: z.string(),
    photoURL: z.string().optional(),
  }),
  thumbnail: z.string().optional(),
  duration: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  tags: z.array(z.string()),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  price: z.number().optional(),
  status: z.enum(["draft", "published", "archived"]),
  language: z.enum(["uz", "ru", "en"]),
  category: z.string(),
  prerequisites: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  targetAudience: z.array(z.string()).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData?: Course;
  onSuccess?: () => void;
}

export function CourseForm({ initialData, onSuccess }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      shortDescription: "",
      instructor: {
        id: user?.uid || "",
        name: user?.displayName || "",
        photoURL: user?.photoURL || "",
      },
      thumbnail: "",
      duration: "0",
      level: "beginner",
      tags: [],
      isPublished: false,
      isFree: true,
      price: 0,
      status: "draft",
      language: "uz",
      category: "",
      prerequisites: [],
      objectives: [],
      targetAudience: [],
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      setIsSubmitting(true);

      if (initialData) {
        await CourseService.updateCourse(initialData.id, {
          ...data,
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Kurs yangilandi",
          description: "Kurs muvaffaqiyatli yangilandi",
        });
      } else {
        await CourseService.createCourse({
          ...data,
          createdBy: user?.uid || "",
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Kurs yaratildi",
          description: "Yangi kurs muvaffaqiyatli yaratildi",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/courses");
      }
    } catch (error) {
      console.error("Error submitting course:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Kursni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kurs nomi</FormLabel>
              <FormControl>
                <Input placeholder="Kurs nomini kiriting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kurs tavsifi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kurs haqida batafsil ma'lumot"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qisqa tavsif</FormLabel>
              <FormControl>
                <Input placeholder="Qisqa tavsif kiriting" {...field} />
              </FormControl>
              <FormDescription>
                Kurs haqida qisqacha ma'lumot (ixtiyoriy)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daraja</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Darajani tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Boshlang'ich</SelectItem>
                    <SelectItem value="intermediate">O'rta</SelectItem>
                    <SelectItem value="advanced">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Til</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tilni tanlang" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="uz">O'zbek</SelectItem>
                    <SelectItem value="ru">Rus</SelectItem>
                    <SelectItem value="en">Ingliz</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Statusni tanlang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Qoralama</SelectItem>
                  <SelectItem value="published">Nashr qilingan</SelectItem>
                  <SelectItem value="archived">Arxivlangan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/courses")}
          >
            Bekor qilish
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saqlanmoqda..." : initialData ? "Saqlash" : "Yaratish"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 