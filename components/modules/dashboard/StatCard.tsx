import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: React.ReactNode
    description: string
    icon: React.ReactNode
    accentColor?: string
  }
  
 export default function StatCard({ title, value, description, icon, accentColor = "border-l-blue-600" }: StatCardProps) {
    return (
      <Card className={`border-l-4 ${accentColor}`}>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className="flex items-start">{icon}</div>
          </div>
        </CardContent>
      </Card>
    )
  }