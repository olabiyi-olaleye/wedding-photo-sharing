import { Progress } from '@/components/ui/progress'

interface UploadProgressBarProps {
  current: number
  total: number
}

export function UploadProgressBar({ current, total }: UploadProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-foreground">
          Uploading: {current} of {total} files
        </p>
        <p className="text-sm font-semibold text-primary">{percentage}%</p>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
