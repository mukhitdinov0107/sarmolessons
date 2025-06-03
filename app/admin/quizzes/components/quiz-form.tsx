"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Quiz, Question } from "@/lib/types";
import { CourseService } from "@/lib/services/courses";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["multiple-choice", "true-false", "text"]),
  question: z.string().min(1, "Savol matni kiritilishi shart"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  points: z.number().min(1, "Ball kiritilishi shart"),
  order: z.number(),
});

const quizSchema = z.object({
  lessonId: z.string(),
  title: z.string().min(1, "Test nomi kiritilishi shart"),
  description: z.string().min(1, "Test tavsifi kiritilishi shart"),
  questions: z.array(questionSchema),
  passingScore: z.number().min(1, "O'tish bali kiritilishi shart"),
  timeLimit: z.number().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface QuizFormProps {
  lessonId?: string;
  initialData?: Quiz;
  onSuccess?: () => void;
}

export function QuizForm({ lessonId, initialData, onSuccess }: QuizFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: initialData || {
      lessonId: lessonId || "",
      title: "",
      description: "",
      questions: [],
      passingScore: 70,
      timeLimit: 30,
      status: "draft",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (data: QuizFormData) => {
    try {
      setIsSubmitting(true);

      if (initialData) {
        await CourseService.updateQuiz(initialData.id, {
          ...data,
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Test yangilandi",
          description: "Test muvaffaqiyatli yangilandi",
        });
      } else {
        await CourseService.createQuiz({
          ...data,
          createdBy: user?.uid || "",
          updatedBy: user?.uid || "",
        });
        toast({
          title: "Test yaratildi",
          description: "Yangi test muvaffaqiyatli yaratildi",
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/quizzes");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Xatolik yuz berdi",
        description: "Testni saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    append({
      type: "multiple-choice",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      order: fields.length + 1,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Test nomi</FormLabel>
              <FormControl>
                <Input placeholder="Test nomini kiriting" {...field} />
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
              <FormLabel>Test tavsifi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Test haqida qisqacha ma'lumot"
                  className="min-h-[100px]"
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
            name="passingScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O'tish bali (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="O'tish balini kiriting"
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
            name="timeLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vaqt chegarasi (daqiqa)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Vaqt chegarasini kiriting"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Savollar</h3>
            <Button type="button" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Savol qo'shish
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>

              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name={`questions.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Savol turi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Savol turini tanlang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Bir nechta variant</SelectItem>
                          <SelectItem value="true-false">To'g'ri/Noto'g'ri</SelectItem>
                          <SelectItem value="text">Matn</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`questions.${index}.question`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Savol matni</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Savol matnini kiriting"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch(`questions.${index}.type`) === "multiple-choice" && (
                  <div className="space-y-4">
                    {[0, 1, 2, 3].map((optionIndex) => (
                      <FormField
                        key={optionIndex}
                        control={form.control}
                        name={`questions.${index}.options.${optionIndex}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{`${optionIndex + 1}-variant`}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`${optionIndex + 1}-variantni kiriting`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}

                    <FormField
                      control={form.control}
                      name={`questions.${index}.correctAnswer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To'g'ri javob</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value as string}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="To'g'ri javobni tanlang" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[0, 1, 2, 3].map((optionIndex) => (
                                <SelectItem
                                  key={optionIndex}
                                  value={form.watch(`questions.${index}.options.${optionIndex}`) || ""}
                                >
                                  {form.watch(`questions.${index}.options.${optionIndex}`) || `${optionIndex + 1}-variant`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.watch(`questions.${index}.type`) === "true-false" && (
                  <FormField
                    control={form.control}
                    name={`questions.${index}.correctAnswer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To'g'ri javob</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value as string}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="To'g'ri javobni tanlang" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">To'g'ri</SelectItem>
                            <SelectItem value="false">Noto'g'ri</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch(`questions.${index}.type`) === "text" && (
                  <FormField
                    control={form.control}
                    name={`questions.${index}.correctAnswer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To'g'ri javob</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="To'g'ri javobni kiriting"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name={`questions.${index}.points`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ball</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Savol balini kiriting"
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
                  name={`questions.${index}.explanation`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Izoh</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Javob uchun izoh kiriting"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Talaba noto'g'ri javob berganda ko'rsatiladigan izoh
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/quizzes")}
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