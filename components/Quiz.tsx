"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface Quiz {
  id: string
  title: string
  questions: Question[]
  passingScore: number
}

interface QuizProps {
  quiz: Quiz
  onComplete?: (score: number, total: number, passed: boolean) => void
  onRetry?: () => void
}

export function Quiz({ quiz, onComplete, onRetry }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [showResults, setShowResults] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const question = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1
  const totalQuestions = quiz.questions.length

  const handleAnswerSelect = (value: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = parseInt(value)
    setSelectedAnswers(newAnswers)
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setShowResults(true)

    // Calculate score
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return acc + (answer === quiz.questions[index].correctAnswer ? 1 : 0)
    }, 0)

    const scorePercentage = (score / totalQuestions) * 100
    const passed = scorePercentage >= quiz.passingScore

    if (onComplete) {
      onComplete(score, totalQuestions, passed)
    }
  }

  const handleRetry = () => {
    setCurrentQuestion(0)
    setSelectedAnswers([])
    setShowResults(false)
    setSubmitted(false)
    if (onRetry) {
      onRetry()
    }
  }

  const isAnswerCorrect = (questionIndex: number) => {
    return selectedAnswers[questionIndex] === quiz.questions[questionIndex].correctAnswer
  }

  const correctAnswers = selectedAnswers.filter((answer, index) => isAnswerCorrect(index)).length
  const scorePercentage = (correctAnswers / totalQuestions) * 100
  const passed = scorePercentage >= quiz.passingScore

  if (showResults) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quiz Results</span>
            <div className="flex items-center gap-2">
              {passed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Your Score</span>
              <span className="text-lg font-bold">{correctAnswers} / {totalQuestions}</span>
            </div>
            <Progress value={scorePercentage} className="h-2" />
            <Alert className={passed ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
              <AlertTitle className={passed ? "text-green-800" : "text-yellow-800"}>
                {passed ? "Congratulations! You passed the quiz!" : "You need to score at least 7/10 to pass"}
              </AlertTitle>
              <AlertDescription className={passed ? "text-green-700" : "text-yellow-700"}>
                {passed 
                  ? "You can now proceed to the next lesson." 
                  : "Please review the material and try again. You need to answer at least 7 questions correctly to proceed."}
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-6">
            {quiz.questions.map((q, index) => (
              <div key={q.id} className="space-y-2 p-4 rounded-lg border">
                <div className="flex items-start gap-2">
                  {isAnswerCorrect(index) ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">Question {index + 1}: {q.question}</p>
                    <p className={`text-sm ${isAnswerCorrect(index) ? 'text-green-600' : 'text-red-600'}`}>
                      Your answer: {q.options[selectedAnswers[index]]}
                    </p>
                    {!isAnswerCorrect(index) && (
                      <p className="text-sm text-green-600">
                        Correct answer: {q.options[q.correctAnswer]}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {!passed && (
            <Button onClick={handleRetry} variant="outline">
              Retry Quiz
            </Button>
          )}
          {passed && onComplete && (
            <Button onClick={() => onComplete(correctAnswers, totalQuestions, true)} className="ml-auto">
              Continue to Next Lesson
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{quiz.title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </CardTitle>
        <Progress 
          value={(currentQuestion / totalQuestions) * 100} 
          className="h-1"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-lg">
              {currentQuestion + 1}. {question.question}
            </h3>
            <RadioGroup
              value={selectedAnswers[currentQuestion]?.toString()}
              onValueChange={handleAnswerSelect}
              className="space-y-2"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Select an answer to continue
        </div>
        <div className="space-x-2">
          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={typeof selectedAnswers[currentQuestion] === 'undefined'}
            >
              Next Question
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswers.length !== quiz.questions.length}
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 