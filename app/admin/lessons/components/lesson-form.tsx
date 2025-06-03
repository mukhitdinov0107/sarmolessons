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
import { Lesson } from "@/lib/types";
import { CourseService } from "@/lib/services/courses";
import { useAuth } from "@/hooks/useAuth";

const lessonSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1, "Dars nomi kiritilishi shart"),
  description: z.string().min(1, "Dars tavsifi kiritilishi shart"),
  content: z.string().min(1, "Dars matni kiritilishi shart"),
  videoUrl: z.string().optional(),
  duration: z.string(),
  order: z.number().min(1, "Tartib raqami kiritilishi shart"),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  status: z.enum(["draft", "published", "archived"]),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
  })).optional(),
  links: z.array(z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonFormProps {
  courseId?: string;
  initialData?: Lesson;
  onSuccess?: () => void;
}

export function LessonForm({ courseId, initialData, onSuccess }: LessonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: initialData || {
      courseId: courseId || "",
      title: "",
      description: "",
      content: "",
      videoUrl: "",
      duration: "0",
      order: 1,
      isPublished: false,
      isFree: true,
      status: "draft",
      attachments: [],
      links: [],
    },
  });

  const onSubmit = async (data: LessonFormData) => {
    try {
      setIsSubmitting(true);

      if (initialData) {
        await CourseService.updateLesson(initialData.id, {
          ...data,
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Dars yangilandi",
          description: "Dars muvaffaqiyatli yangilandi",
        });
      } else {
        await CourseService.createLesson({
          ...data,
          createdBy: user?.uid || "",
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Dars yaratildi",
          description: "Yangi dars muvaffaqiyatli yaratildi",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/lessons");
      }
    } catch (error) {
      console.error("Error submitting lesson:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Darsni saqlashda xatolik yuz berdi",
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
              <FormLabel>Dars nomi</FormLabel>
              <FormControl>
                <Input placeholder="Dars nomini kiriting" {...field} />
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
              <FormLabel>Dars tavsifi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dars haqida qisqacha ma'lumot"
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
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dars matni</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dars matnini kiriting"
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL</FormLabel>
                <FormControl>
                  <Input placeholder="Video havolasini kiriting" {...field} />
                </FormControl>
                <FormDescription>
                  YouTube yoki boshqa video platformasi havolasi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Davomiyligi</FormLabel>
                <FormControl>
                  <Input placeholder="Dars davomiyligini kiriting" {...field} />
                </FormControl>
                <FormDescription>
                  Masalan: 45 daqiqa
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tartib raqami</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Tartib raqamini kiriting"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/lessons")}
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