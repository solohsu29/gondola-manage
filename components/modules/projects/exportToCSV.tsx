import { Project } from "@/types"

export default function exportToCSV(data: Project[]) {
  // Define the headers for the CSV
  const headers = ["Project ID", "Client", "Site", "Gondolas", "Created", "Status","End Date"]

  // Map the data to CSV rows
  const rows = data.map((project) => [
    project.id,
    project.client,
    project.site,
    Array.isArray(project.gondolas) ? project.gondolas.length : 0,
    project.created?.split("T")[0],
    project.status,
    project.endDate?.split("T")[0]
  ])

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

  // Create a download link and trigger the download
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `projects-export-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}